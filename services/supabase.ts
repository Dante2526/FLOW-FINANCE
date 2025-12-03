
import { createClient } from '@supabase/supabase-js';

// Configuração do Projeto Flow Finance
const SUPABASE_URL = 'https://xfsmdidfcgptfzjhhui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmc21kaWRmY2NncHRmempoaHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTQ0NjAsImV4cCI6MjA4MDI5MDQ2MH0.4oFJ_L7fdjw2ttYtTko8EdTVhDpBtM5WWXQM4_N7zTU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTH / USER MANAGEMENT ---

export const loginUser = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Busca direta na tabela users (Login sem senha)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (error || !data) {
    throw new Error("Usuário não encontrado. Verifique o e-mail ou crie uma conta.");
  }

  // Normaliza os dados do banco (snake_case) para o app (camelCase)
  return normalizeUserData(data);
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Verifica se usuário já existe
  const { data: existingUser } = await supabase
    .from('users')
    .select('email')
    .eq('email', normalizedEmail)
    .single();

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
    throw new Error("Erro ao criar usuário: " + error.message);
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
    profile: data.profile || {}
  };
};
