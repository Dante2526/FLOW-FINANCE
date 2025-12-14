
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
  // First try to get drawing from direct column
  assignIfPresent('notepadDrawing', 'notepad_drawing', null); 
  
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
  
  // Fallback: Check profile for notepadDrawing if not found in root column
  if (!result.notepadDrawing && data.profile && data.profile.notepadDrawing) {
     result.notepadDrawing = data.profile.notepadDrawing;
  }
  
  // Try to find dashboardOrder in column first, then fallback to profile
  if ('dashboard_order' in data && data.dashboard_order && Array.isArray(data.dashboard_order) && data.dashboard_order.length > 0) {
     result.dashboardOrder = data.dashboard_order;
  } else if (data.profile && data.profile.dashboardOrder) {
     result.dashboardOrder = data.profile.dashboardOrder;
  } else {
     result.dashboardOrder = [];
  }

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
  
  // SPECIAL HANDLING FOR DASHBOARD ORDER:
  // Since 'dashboard_order' might not exist as a column in the schema,
  // we store it inside the 'profile' JSONB column to avoid schema errors.
  if (collectionName === 'dashboardOrder') {
     try {
       // 1. Fetch current profile to avoid overwriting other fields
       const { data: userData, error: fetchError } = await supabase
         .from('users')
         .select('profile')
         .eq('email', normalizedEmail)
         .single();
       
       if (fetchError) {
         console.error(`Error fetching profile for dashboardOrder:`, fetchError.message);
         return false;
       }

       const currentProfile = userData?.profile || {};
       const updatedProfile = { ...currentProfile, dashboardOrder: dataArray };

       // 2. Save updated profile
       const { error: updateError } = await supabase
         .from('users')
         .update({ profile: updatedProfile })
         .eq('email', normalizedEmail);

       if (updateError) {
         console.error(`Error saving dashboardOrder to profile:`, updateError.message);
         return false;
       }
       return true;

     } catch (err: any) {
       console.error("Exception saving dashboardOrder:", err.message || err);
       return false;
     }
  }

  // STANDARD HANDLING FOR OTHER COLLECTIONS
  let dbColumn = collectionName;
  if (collectionName === 'longTerm') dbColumn = 'long_term';

  try {
    const { error } = await supabase
      .from('users')
      .update({ [dbColumn]: dataArray })
      .eq('email', normalizedEmail);

    if (error) {
      console.error(`Error saving ${collectionName} to Supabase:`, error.message);
      return false;
    }
    return true;

  } catch (error: any) {
    console.error(`Error saving ${collectionName}:`, error.message || error);
    return false;
  }
};

export const saveUserField = async (userId: string, field: string, data: any): Promise<boolean> => {
  const normalizedEmail = userId.toLowerCase().trim();
  
  // SPECIAL HANDLING: notepadDrawing (save to profile JSONB)
  // This avoids errors if the 'notepad_drawing' column does not exist in the DB schema
  if (field === 'notepadDrawing') {
    try {
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('profile')
        .eq('email', normalizedEmail)
        .single();

      if (fetchError) throw fetchError;

      const currentProfile = userData?.profile || {};
      const updatedProfile = { ...currentProfile, notepadDrawing: data };

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile: updatedProfile })
        .eq('email', normalizedEmail);

      if (updateError) throw updateError;
      return true;
    } catch (err: any) {
      console.error(`Error saving notepadDrawing to profile:`, err.message);
      return false;
    }
  }

  // Standard Column Mapping
  let dbColumn = field;
  if (field === 'notepadContent') dbColumn = 'notepad_content';
  if (field === 'cdiRate') dbColumn = 'cdi_rate';
  if (field === 'pushSubscription') dbColumn = 'push_subscription';
  
  // If we reach here with 'notepadDrawing' (fallback) or other fields
  const { error } = await supabase
    .from('users')
    .update({ [dbColumn]: data })
    .eq('email', normalizedEmail);

  if (error) {
    console.error(`Error saving field ${field}:`, error.message);
    return false;
  }
  return true;
};

// Modified loadUserData to fetch all necessary fields/sub-collections logic if simulated
export const loadUserData = async (userId: string) => {
  return loginUser(userId);
};
