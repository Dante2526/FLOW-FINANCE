
import { createClient } from '@supabase/supabase-js';

// Configuração do Projeto Flow Finance
const SUPABASE_URL = 'https://xfsmdidfccgptfzjhhui.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU'.trim();

const VIP_EMAILS = ['naylanmoreira350@gmail.com', 'lopesisa40@gmail.com'];

// Configurações importantes para evitar erros de "Failed to fetch" e persistência
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Desativa persistência pois usamos login personalizado
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Helper para converter os dados do Supabase para o formato do App
export const normalizeUserData = (data: any) => {
  return {
    ...data,
    longTerm: data.long_term || [],
    notepadContent: data.notepad_content || '',
    cdiRate: data.cdi_rate !== null ? data.cdi_rate : 11.25,
    transactions: data.transactions || [],
    accounts: data.accounts || [],
    investments: data.investments || [],
    notifications: data.notifications || [],
    months: data.months || [],
    profile: data.profile || {},
    theme: data.theme || null 
  };
};

// --- AUTH / USER MANAGEMENT ---

export const loginUser = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error) {
    console.error("Erro Supabase Login:", error);
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
       throw new Error("Erro de conexão. Verifique sua internet.");
    }
    if (error.code === 'PGRST116') {
       throw new Error("Usuário não encontrado. Verifique o e-mail ou crie uma conta.");
    }
    throw error;
  }
  
  if (!data) {
    throw new Error("Usuário não encontrado.");
  }

  return normalizeUserData(data);
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  const normalizedEmail = email.toLowerCase().trim();
  const isVip = VIP_EMAILS.includes(normalizedEmail);

  // Verifica se usuário já existe
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('email')
    .eq('email', normalizedEmail)
    .maybeSingle(); 

  if (checkError) {
     console.error("Erro verificação registro:", checkError);
     // Se for erro de rede, lança exceção para não sobrescrever dados
     if (checkError.message && (checkError.message.includes('fetch') || checkError.message.includes('network'))) {
       throw new Error("Erro de conexão. Tente novamente.");
     }
  }

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
        isPro: isVip
      },
      months: initialData.months || [],
      cdi_rate: initialData.cdiRate || 11.25
    });

  if (error) {
    console.error("Erro criação usuário:", error);
    throw new Error("Erro ao criar conta: " + error.message);
  }

  return { email: normalizedEmail, name };
};

export const deleteUser = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', normalizedEmail);

  if (error) {
    console.error("Erro ao deletar usuário:", error);
    throw new Error("Erro ao excluir conta: " + error.message);
  }
};

// --- REALTIME SUBSCRIPTION ---

export const subscribeToUserChanges = (email: string, onUpdate: (data: any) => void) => {
  const normalizedEmail = email.toLowerCase().trim();

  const channel = supabase
    .channel(`user-updates-${normalizedEmail}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE', 
        schema: 'public',
        table: 'users',
        filter: `email=eq.${normalizedEmail}` 
      },
      (payload) => {
        if (payload.new) {
          onUpdate(normalizeUserData(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// --- DATA SYNC ---

export const saveCollection = async (userId: string, collectionName: string, dataArray: any[]): Promise<boolean> => {
  const normalizedEmail = userId.toLowerCase().trim();
  
  let dbColumn = collectionName;
  if (collectionName === 'longTerm') dbColumn = 'long_term';

  const { error } = await supabase
    .from('users')
    .update({ [dbColumn]: dataArray })
    .eq('email', normalizedEmail);

  if (error) {
    console.error(`Error saving ${collectionName}:`, error);
    return false;
  }
  return true;
};

export const saveUserField = async (userId: string, field: string, data: any): Promise<boolean> => {
  const normalizedEmail = userId.toLowerCase().trim();
  
  let dbColumn = field;
  if (field === 'notepadContent') dbColumn = 'notepad_content';
  if (field === 'cdiRate') dbColumn = 'cdi_rate';
  if (field === 'pushSubscription') dbColumn = 'push_subscription';

  const { error } = await supabase
    .from('users')
    .update({ [dbColumn]: data })
    .eq('email', normalizedEmail);

  if (error) {
    console.error(`Error saving field ${field}:`, error);
    return false;
  }
  return true;
};

export const loadUserData = async (userId: string) => {
  const normalizedEmail = userId.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error) {
    console.error("Supabase load error:", error);
    // CRITICAL FIX: Only return null if user truly doesn't exist.
    // Throw error on network issues so App.tsx knows NOT to overwrite with empty local data.
    if (error.code !== 'PGRST116') {
      throw error;
    }
    return null;
  }

  if (!data) return null;

  return normalizeUserData(data);
};
