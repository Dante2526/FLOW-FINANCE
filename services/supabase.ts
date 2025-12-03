
import { createClient } from '@supabase/supabase-js';

// Configuração do Projeto Flow Finance
// ID CORRIGIDO (extraído do payload do JWT fornecido)
const SUPABASE_URL = 'https://xfsmdidfccgptfzjhhui.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU'.trim();

// Configurações importantes para evitar erros de "Failed to fetch" e persistência
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Desativa persistência pois usamos login personalizado
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// --- AUTH / USER MANAGEMENT ---

export const loginUser = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Busca direta na tabela users (Login sem senha)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error) {
    console.error("Erro Supabase Login:", error);
    // Se o erro for de conexão, lança mensagem amigável
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
       throw new Error("Erro de conexão. Verifique sua internet ou o ID do projeto.");
    }
    throw new Error("Usuário não encontrado. Verifique o e-mail ou crie uma conta.");
  }
  
  if (!data) {
    throw new Error("Usuário não encontrado.");
  }

  // Normaliza os dados do banco (snake_case) para o app (camelCase)
  return normalizeUserData(data);
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Verifica se usuário já existe
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('email')
    .eq('email', normalizedEmail)
    .maybeSingle(); // maybeSingle evita erro se não encontrar

  if (checkError && !checkError.message.includes('JSON')) {
     console.error("Erro verificação registro:", checkError);
     if (checkError.message.includes('fetch')) {
       throw new Error("Erro de conexão ao verificar usuário. Tente novamente.");
     }
     throw new Error("Erro ao verificar usuário: " + checkError.message);
  }

  if (existingUser) {
    throw new Error("Este e-mail já possui cadastro.");
  }

  // Cria o usuário
  const { error } = await supabase
    .from('users')
    .insert({
      email: normalizedEmail,
      name: name.toUpperCase(),
      profile: {
        name: name.toUpperCase(),
        subtitle: '',
        avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix'
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

// --- DATA SYNC ---

export const saveCollection = async (userId: string, collectionName: string, dataArray: any[]): Promise<boolean> => {
  const normalizedEmail = userId.toLowerCase().trim();
  
  // Mapeia nomes das coleções do frontend para colunas do banco
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
  
  // Mapeia campos camelCase para snake_case do banco
  let dbColumn = field;
  if (field === 'notepadContent') dbColumn = 'notepad_content';
  if (field === 'cdiRate') dbColumn = 'cdi_rate';
  if (field === 'pushSubscription') dbColumn = 'push_subscription';
  // O campo 'theme' já é igual no banco, então passa direto

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

  if (error || !data) {
    return null;
  }

  return normalizeUserData(data);
};

// Helper para converter os dados do Supabase para o formato do App
const normalizeUserData = (data: any) => {
  return {
    ...data,
    longTerm: data.long_term || [],
    notepadContent: data.notepad_content || '',
    cdiRate: data.cdi_rate !== null ? data.cdi_rate : 11.25,
    // Garante que arrays nunca sejam null
    transactions: data.transactions || [],
    accounts: data.accounts || [],
    investments: data.investments || [],
    notifications: data.notifications || [],
    months: data.months || [],
    profile: data.profile || {},
    theme: data.theme || null // Garante leitura explícita do tema
  };
};
