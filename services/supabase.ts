import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DE SEGURANÇA ---
// NOTA: As chaves abaixo são PÚBLICAS (Anon Key) e projetadas para uso no Frontend.
// A segurança dos dados depende das regras de Row Level Security (RLS) configuradas no painel do Supabase.
// NÃO substitua a 'SUPABASE_ANON_KEY' por uma chave 'SERVICE_ROLE' (Admin).

const SUPABASE_URL = 'https://xfsmdidfccgptfzjhhui.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU'.trim();

// Chave Pública para Push Notifications (Web Push)
export const VAPID_PUBLIC_KEY = 'BOabgmhdqm_B03NgjZgZUG4tT6whqH_sfr9-ZmMt1XY-lbI_ADbOzze9pRDU3tnj7oXttv01ZXcNKLhzeXlifC8';

// Configurações simples
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, 
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage // Explicitly use localStorage to fix reload disconnects
  }
});

// Helper para converter os dados do Supabase para o formato do App
export const normalizeUserData = (data: any) => {
  const result: any = { ...data };

  const assignIfPresent = (targetKey: string, sourceKey: string, defaultVal: any) => {
    if (sourceKey in data) {
      result[targetKey] = data[sourceKey] || defaultVal;
    }
  };

  assignIfPresent('longTerm', 'long_term', []);
  assignIfPresent('notepadContent', 'notepad_content', '');
  
  if ('cdi_rate' in data) {
    result.cdiRate = data.cdi_rate !== null ? data.cdi_rate : 11.25;
  }
  
  assignIfPresent('transactions', 'transactions', []);
  assignIfPresent('accounts', 'accounts', []);
  assignIfPresent('investments', 'investments', []);
  assignIfPresent('notifications', 'notifications', []);
  assignIfPresent('months', 'months', []);
  assignIfPresent('profile', 'profile', {});
  assignIfPresent('theme', 'theme', null);

  return result;
};

// --- AUTH HELPERS (OTP) ---

export const sendAuthOtp = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
  });

  if (error) {
    console.error("Erro ao enviar OTP:", error.message);
    
    // Tratamento específico para Rate Limit (Muitas tentativas)
    if (error.message.includes("security purposes") || error.status === 429) {
       const match = error.message.match(/after (\d+) seconds/);
       const seconds = match ? match[1] : null;
       
       if (seconds) {
         throw new Error(`Muitas tentativas. Aguarde ${seconds}s para tentar novamente.`);
       } else {
         throw new Error("Muitas tentativas. Aguarde um momento.");
       }
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

export const loginUser = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Busca direta na tabela users
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
    // Se não encontrou (código PGRST116), lançamos erro específico
    throw new Error("Usuário não encontrado. Verifique o e-mail ou crie uma conta.");
  }
  
  if (!data) {
    throw new Error("Usuário não encontrado.");
  }

  return normalizeUserData(data);
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Verifica se usuário já existe
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('email')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (checkError && !checkError.message.includes('JSON')) {
     console.error("Erro verificação registro:", checkError);
  }

  if (existingUser) {
    throw new Error("Este e-mail já possui cadastro.");
  }

  // Cria o usuário diretamente
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
      months: initialData.months || [],
      cdi_rate: initialData.cdiRate || 11.25
    });

  if (error) {
    console.error("Erro criação usuário:", error);
    throw new Error("Erro ao criar conta. Tente novamente.");
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

// --- HELPER DE AUTENTICAÇÃO ANÔNIMA PARA SYNC ---
const ensureAuth = async () => {
  // Se já estiver logado via OTP, não faz nada
  if (supabase.auth.getSession()) return;
  
  // Fallback para acesso anônimo se necessário
  // (Nota: se você estiver usando OTP, o ideal é usar a sessão do usuário)
  // Mas mantemos a compatibilidade caso a sessão expire e o app use localStorage
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
    .subscribe((status) => {
      console.log(`[Realtime] Status para ${normalizedEmail}:`, status);
      if (status === 'SUBSCRIBED') {
         console.log("Conectado para receber atualizações em tempo real.");
      }
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
         console.warn("Desconectado do Realtime. O app tentará reconectar...");
      }
    });

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
  return loginUser(userId);
};