
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

// --- HELPERS DE CONVERSÃO (Snake Case <-> Camel Case) ---

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// --- AUTH HELPERS (OTP) ---

export const sendAuthOtp = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
  });

  if (error) {
    console.error("Erro ao enviar OTP:", error.message);
    if (error.message.includes("security purposes") || error.status === 429) {
       throw new Error("Muitas tentativas. Aguarde alguns segundos.");
    }
    throw new Error("Falha ao enviar código. Verifique o e-mail.");
  }
  return true;
};

export const verifyAuthOtp = async (email: string, token: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: 'email',
  });

  if (error) {
    console.error("Erro ao verificar OTP:", error);
    throw new Error("Código inválido ou expirado.");
  }
  return data;
};

// --- USER MANAGEMENT ---

const getAuthUserId = async (): Promise<string> => {
    const { data } = await supabase.auth.getUser();
    if (data.user) return data.user.id;
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) return sessionData.session.user.id;
    
    throw new Error("Usuário não autenticado.");
};

export const loginUser = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();
  
  if (!data) throw new Error("Usuário não encontrado.");
  
  return await getAuthUserId();
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  const normalizedEmail = email.toLowerCase().trim();

  const { data: existingUser } = await supabase
    .from('users')
    .select('email')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingUser) {
    throw new Error("Este e-mail já possui cadastro.");
  }

  const { error } = await supabase
    .from('users')
    .insert({
      email: normalizedEmail,
      name: name.toUpperCase(),
      profile: {
        name: name.toUpperCase(),
        subtitle: '',
        avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
        isPro: false 
      },
      cdi_rate: initialData.cdiRate || 11.25,
    });

  if (error) {
    console.error("Erro criação usuário:", error);
  }

  return { email: normalizedEmail, name };
};

export const deleteUser = async (email: string) => {
  const userId = await getAuthUserId();
  const normalizedEmail = email.toLowerCase().trim();
  
  await supabase.from('transactions').delete().eq('user_id', userId);
  await supabase.from('accounts').delete().eq('user_id', userId);
  await supabase.from('months').delete().eq('user_id', userId);
  await supabase.from('investments').delete().eq('user_id', userId);
  await supabase.from('long_term').delete().eq('user_id', userId);
  await supabase.from('notifications').delete().eq('user_id', userId);
  
  const { error } = await supabase.from('users').delete().eq('email', normalizedEmail);

  if (error) {
    console.error("Erro ao deletar usuário:", error);
    throw new Error("Erro ao excluir conta: " + error.message);
  }
};

// --- DATA SYNC (CRUD RELACIONAL OTIMIZADO) ---

export const loadUserData = async (email: string) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const userId = await getAuthUserId();

    const userReq = supabase.from('users').select('*').eq('email', normalizedEmail).single();

    // PERFORMANCE FIX: Ordenar transações por created_at DESC no servidor para garantir ordem correta
    const transactionsReq = supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    const accountsReq = supabase.from('accounts').select('*').eq('user_id', userId);
    const monthsReq = supabase.from('months').select('*').eq('user_id', userId);
    const investmentsReq = supabase.from('investments').select('*').eq('user_id', userId);
    const longTermReq = supabase.from('long_term').select('*').eq('user_id', userId);
    const notificationsReq = supabase.from('notifications').select('*').eq('user_id', userId);

    const [
        userRes,
        transactionsRes,
        accountsRes,
        monthsRes,
        investmentsRes,
        longTermRes,
        notificationsRes
    ] = await Promise.all([
        userReq,
        transactionsReq,
        accountsReq,
        monthsReq,
        investmentsReq,
        longTermReq,
        notificationsReq
    ]);

    const user = userRes.data || {};
    
    const result = {
        profile: user.profile || {},
        cdiRate: user.cdi_rate ?? 11.25,
        notepadContent: user.notepad_content || '',
        notepadDrawing: user.profile?.notepadDrawing || null,
        theme: user.theme || null,
        dashboardOrder: user.profile?.dashboardOrder || [], 
        
        transactions: toCamelCase(transactionsRes.data || []),
        accounts: toCamelCase(accountsRes.data || []),
        months: toCamelCase(monthsRes.data || []),
        investments: toCamelCase(investmentsRes.data || []),
        longTerm: toCamelCase(longTermRes.data || []),
        notifications: toCamelCase(notificationsRes.data || [])
    };

    return result;

  } catch (error) {
    console.error("Erro carregando dados:", error);
    return null;
  }
};

// --- FUNÇÕES GRANULARES (PERFORMANCE) ---

export const upsertItem = async (email: string, collectionName: string, item: any) => {
  try {
    const userId = await getAuthUserId();
    let tableName = collectionName;
    if (collectionName === 'longTerm') tableName = 'long_term';
    
    const snakeItem = toSnakeCase(item);
    // Garantir created_at
    if (!snakeItem.created_at) snakeItem.created_at = new Date().toISOString();
    
    const { error } = await supabase
        .from(tableName)
        .upsert({ ...snakeItem, user_id: userId }, { onConflict: 'id' });
        
    if (error) console.error(`Erro upserting ${collectionName}:`, error);
    return !error;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const deleteItem = async (email: string, collectionName: string, id: string) => {
  try {
    const userId = await getAuthUserId();
    let tableName = collectionName;
    if (collectionName === 'longTerm') tableName = 'long_term';

    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('user_id', userId)
        .eq('id', id);

    if (error) console.error(`Erro deletando ${collectionName}:`, error);
    return !error;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// Mantido para compatibilidade e operações em lote (Ex: Drag and Drop, Deletar Mês)
export const saveCollection = async (email: string, collectionName: string, dataArray: any[]): Promise<boolean> => {
  try {
    const userId = await getAuthUserId();
    let tableName = collectionName;
    
    if (collectionName === 'longTerm') tableName = 'long_term';
    if (collectionName === 'dashboardOrder') {
        return saveUserField(email, 'dashboardOrder', dataArray);
    }

    const rows = dataArray.map(item => {
        const snakeItem = toSnakeCase(item);
        if (!snakeItem.created_at) {
            snakeItem.created_at = new Date().toISOString();
        }
        return { ...snakeItem, user_id: userId };
    });

    const { error: upsertError } = await supabase
        .from(tableName)
        .upsert(rows, { onConflict: 'id' });

    if (upsertError) {
        console.error(`Erro salvando ${tableName}:`, upsertError.message);
        return false;
    }

    // Clean Orphans
    const currentIds = rows.map(r => r.id);
    if (currentIds.length > 0) {
        await supabase
            .from(tableName)
            .delete()
            .eq('user_id', userId)
            .not('id', 'in', `(${currentIds.join(',')})`); 
    } else {
        await supabase.from(tableName).delete().eq('user_id', userId);
    }

    return true;
  } catch (error) {
    console.error(`Exceção salvando ${collectionName}:`, error);
    return false;
  }
};

export const saveUserField = async (email: string, field: string, data: any): Promise<boolean> => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    let updatePayload: any = {};

    const profileFields = ['notepadDrawing', 'dashboardOrder', 'pushSubscription', 'profile'];

    if (profileFields.includes(field)) {
        const { data: userData } = await supabase
            .from('users')
            .select('profile')
            .eq('email', normalizedEmail)
            .maybeSingle();

        const currentProfile = userData?.profile || {};
        let newProfile;
        if (field === 'profile') {
             newProfile = { ...currentProfile, ...data };
        } else {
             newProfile = { ...currentProfile, [field]: data };
        }
        updatePayload = { profile: newProfile };
    } else {
        if (field === 'notepadContent') updatePayload = { notepad_content: data };
        else if (field === 'cdiRate') updatePayload = { cdi_rate: data };
        else if (field === 'theme') updatePayload = { theme: data };
        else updatePayload = toSnakeCase({ [field]: data });
    }

    const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('email', normalizedEmail);

    return !error;
  } catch (error: any) {
    console.error(`Exceção salvando campo ${field}:`, error);
    return false;
  }
};

export const subscribeToUserChanges = (email: string, onUpdate: () => void) => {
  let channels: any[] = [];

  const setup = async () => {
    try {
      const userId = await getAuthUserId();
      const normalizedEmail = email.toLowerCase().trim();
      const tables = ['transactions', 'accounts', 'months', 'investments', 'long_term', 'notifications'];
      
      const channel = supabase.channel('user-db-changes');

      channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `email=eq.${normalizedEmail}` },
          () => onUpdate()
      );

      tables.forEach(table => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table, filter: `user_id=eq.${userId}` },
          () => onUpdate()
        );
      });

      channel.subscribe();
      channels.push(channel);

    } catch (err) {
      console.warn("Could not setup realtime subscriptions", err);
    }
  };

  setup();

  return () => {
    channels.forEach(ch => supabase.removeChannel(ch));
  };
};
