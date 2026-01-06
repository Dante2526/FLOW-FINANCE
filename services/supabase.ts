
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DE SEGURANÇA ---
const SUPABASE_URL = 'https://xfsmdidfccgptfzjhhui.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU'.trim();

export const VAPID_PUBLIC_KEY = 'BOabgmhdqm_B03NgjZgZUG4tT6whqH_sfr9-ZmMt1XY-lbI_ADbOzze9pRDU3tnj7oXttv01ZXcNKLhzeXlifC8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, 
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// --- HELPERS DE CONVERSÃO ---

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toCamelCase(v));
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toSnakeCase(v));
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// --- AUTH HELPERS ---

export const sendAuthOtp = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({ email: email.toLowerCase().trim() });
  if (error) throw new Error(error.message);
  return true;
};

export const verifyAuthOtp = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ email: email.toLowerCase().trim(), token, type: 'email' });
  if (error) throw new Error("INVALID_CODE");
  return data;
};

// --- USER MANAGEMENT ---

const getAuthUserId = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;
    throw new Error("AUTH_REQUIRED");
};

export const loginUser = async (email: string) => {
  const { data } = await supabase.from('users').select('email').eq('email', email.toLowerCase().trim()).maybeSingle();
  if (!data) throw new Error("USER_NOT_FOUND");
  return await getAuthUserId();
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  const emailNorm = email.toLowerCase().trim();
  const { data: exists } = await supabase.from('users').select('email').eq('email', emailNorm).maybeSingle();
  if (exists) throw new Error("EMAIL_ALREADY_REGISTERED");
  
  const { error } = await supabase.from('users').insert({
    email: emailNorm,
    name: name.toUpperCase(),
    profile: { name: name.toUpperCase(), avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix', isPro: false },
    cdi_rate: initialData.cdiRate || 11.25,
  });
  if (error) throw error;
  return { email: emailNorm, name };
};

export const deleteUser = async (email: string) => {
  const userId = await getAuthUserId();
  await Promise.all([
    supabase.from('transactions').delete().eq('user_id', userId),
    supabase.from('accounts').delete().eq('user_id', userId),
    supabase.from('months').delete().eq('user_id', userId),
    supabase.from('investments').delete().eq('user_id', userId),
    supabase.from('long_term').delete().eq('user_id', userId),
    supabase.from('notifications').delete().eq('user_id', userId),
  ]);
  const { error } = await supabase.from('users').delete().eq('email', email.toLowerCase().trim());
  if (error) throw error;
};

// --- DATA SYNC ---

export const loadUserData = async (email: string) => {
  try {
    const userId = await getAuthUserId();
    const [userRes, txRes, accRes, monRes, invRes, ltRes, notRes] = await Promise.all([
      supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single(),
      supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('months').select('*').eq('user_id', userId),
      supabase.from('investments').select('*').eq('user_id', userId),
      supabase.from('long_term').select('*').eq('user_id', userId),
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    const user = userRes.data || {};
    
    // --- CORREÇÃO DE PERFIL ANINHADO ---
    // Verifica se existe um objeto 'profile' DENTRO do objeto 'profile' (bug visual)
    let profile = user.profile || {};
    if (profile.profile && typeof profile.profile === 'object') {
        // Se encontrar, traz os dados internos para a raiz, corrigindo o objeto
        // Mantém as chaves da raiz (como isPro, subscriptionExpiry) se existirem
        profile = { ...profile, ...profile.profile };
    }

    // --- VERIFICAÇÃO DE ASSINATURA ---
    // Se for PRO e tiver data de expiração, verifica se já venceu
    if (profile.isPro && profile.subscriptionExpiry) {
        const expiry = new Date(profile.subscriptionExpiry);
        const now = new Date();
        if (now > expiry) {
            // Assinatura venceu
            console.log("Assinatura PRO expirada. Revertendo para básico.");
            profile.isPro = false;
            // Opcional: Atualização silenciosa pode ser feita aqui se necessário
        }
    }

    return {
        profile: profile,
        cdiRate: user.cdi_rate ?? 11.25,
        notepadContent: user.notepad_content || '',
        notepadDrawing: user.profile?.notepadDrawing || null,
        theme: user.theme || null,
        dashboardOrder: user.profile?.dashboardOrder || [], 
        transactions: toCamelCase(txRes.data || []),
        accounts: toCamelCase(accRes.data || []),
        months: toCamelCase(monRes.data || []),
        investments: toCamelCase(invRes.data || []),
        longTerm: toCamelCase(ltRes.data || []),
        notifications: toCamelCase(notRes.data || [])
    };
  } catch (error) {
    console.error("Load Error:", error);
    return null;
  }
};

// --- CRUD GRANULAR ---

export const upsertItem = async (email: string, collection: string, item: any) => {
  try {
    const userId = await getAuthUserId();
    const table = collection === 'longTerm' ? 'long_term' : collection;
    const snake = toSnakeCase(item);
    if (!snake.created_at) snake.created_at = new Date().toISOString();
    const { error } = await supabase.from(table).upsert({ ...snake, user_id: userId }, { onConflict: 'id' });
    return !error;
  } catch (e) { return false; }
};

export const deleteItem = async (email: string, collection: string, id: string) => {
  try {
    const userId = await getAuthUserId();
    const table = collection === 'longTerm' ? 'long_term' : collection;
    const { error } = await supabase.from(table).delete().eq('user_id', userId).eq('id', id);
    return !error;
  } catch (e) { return false; }
};

export const hardDeleteMonth = async (monthId: string, monthName: string, year: string) => {
    try {
        const userId = await getAuthUserId();
        const deleteTx = supabase.from('transactions').delete().eq('user_id', userId).eq('month', monthName).eq('year', year);
        const deleteAcc = supabase.from('accounts').delete().eq('user_id', userId).eq('month', monthName).eq('year', year);
        const deleteMonth = supabase.from('months').delete().eq('user_id', userId).eq('id', monthId);
        const results = await Promise.all([deleteTx, deleteAcc, deleteMonth]);
        const hasError = results.some(r => r.error);
        if (hasError) console.error("Erro na exclusão atômica:", results.map(r => r.error));
        return !hasError;
    } catch (e) {
        console.error("Exceção na exclusão:", e);
        return false;
    }
};

export const saveCollection = async (email: string, collection: string, data: any[]): Promise<boolean> => {
  try {
    const userId = await getAuthUserId();
    const table = collection === 'longTerm' ? 'long_term' : collection;
    if (collection === 'dashboardOrder') return saveUserField(email, 'dashboardOrder', data);

    const rows = data.map(item => {
        const snake = toSnakeCase(item);
        if (!snake.created_at) snake.created_at = new Date().toISOString();
        return { ...snake, user_id: userId };
    });

    const { error: upsertError } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (upsertError) return false;

    const currentIds = rows.map(r => r.id);
    if (currentIds.length > 0) {
        await supabase.from(table).delete().eq('user_id', userId).not('id', 'in', `(${currentIds.join(',')})`);
    } else {
        await supabase.from(table).delete().eq('user_id', userId);
    }
    return true;
  } catch (error) { return false; }
};

export const saveUserField = async (email: string, field: string, data: any): Promise<boolean> => {
  try {
    let payload: any = {};
    const profileFields = ['notepadDrawing', 'dashboardOrder', 'pushSubscription', 'profile'];
    
    if (profileFields.includes(field)) {
        // Busca o perfil atual para não perder dados
        const { data: user } = await supabase.from('users').select('profile').eq('email', email.toLowerCase().trim()).maybeSingle();
        const currentProfile = user?.profile || {};

        if (field === 'profile') {
             // CORREÇÃO: Mescla os dados na raiz ao invés de aninhar
             // Isso evita criar { profile: { profile: ... } }
             payload = { profile: { ...currentProfile, ...data } };
        } else {
             // Para outros campos (ex: ordem dos cards), adiciona como chave normal
             payload = { profile: { ...currentProfile, [field]: data } };
        }
    } else {
        const map: any = { notepadContent: 'notepad_content', cdiRate: 'cdi_rate', theme: 'theme' };
        payload = { [map[field] || toSnakeCase(field)]: data };
    }
    const { error } = await supabase.from('users').update(payload).eq('email', email.toLowerCase().trim());
    return !error;
  } catch (error) { return false; }
};

export const subscribeToUserChanges = (email: string, onUpdate: () => void) => {
  const tables = ['users', 'transactions', 'accounts', 'months', 'investments', 'long_term', 'notifications'];
  const channel = supabase.channel('db-changes');
  tables.forEach(table => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onUpdate());
  });
  channel.subscribe();
  return () => { supabase.removeChannel(channel); };
};
