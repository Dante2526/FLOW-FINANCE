
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

// --- AUTH ---

export const sendAuthOtp = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
  if (error) throw error;
  return true;
};

export const verifyAuthOtp = async (email: string, token: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: 'email' });
  if (error) throw error;
  return data;
};

// --- USER & PROFILE (LEGACY + MIXED) ---

// Helper to get User ID safely
const getUserId = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id;
};

export const loginUser = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabase.from('users').select('*').eq('email', normalizedEmail).single();
  
  if (error) throw new Error("Usuário não encontrado.");
  
  // Normalize just the profile part. Other data comes from tables now.
  let profile = data.profile || {};
  let dashboardOrder = profile.dashboardOrder || data.dashboard_order || [];
  
  return {
    profile,
    dashboardOrder,
    theme: data.theme,
    notepadContent: data.notepad_content,
    notepadDrawing: data.notepad_drawing || (profile.notepadDrawing),
    cdiRate: data.cdi_rate
  };
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  const normalizedEmail = email.toLowerCase().trim();
  const uid = await getUserId();

  if (!uid) {
    throw new Error("Sessão inválida para criar usuário. Tente fazer login novamente.");
  }
  
  // Check existence
  const { data: existing } = await supabase.from('users').select('email').eq('email', normalizedEmail).maybeSingle();
  if (existing) throw new Error("E-mail já cadastrado.");

  // Create User Entry - Explicitly including ID to satisfy potential RLS policies
  const { error } = await supabase.from('users').insert({
    id: uid, // CRITICAL: Link public.users to auth.users
    email: normalizedEmail,
    name: name.toUpperCase(),
    profile: {
      name: name.toUpperCase(),
      subtitle: '',
      avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
      isPro: false,
      dashboardOrder: ['balance-card']
    },
    cdi_rate: 11.25
  });

  if (error) throw error;

  // If initialData has months, we should insert them into the 'months' table
  if (initialData.months && initialData.months.length > 0) {
     // Optional: Insert initial month immediately
     // await apiMonths.add({ ...initialData.months[0] });
  }

  return { email: normalizedEmail, name };
};

export const deleteUser = async (email: string) => {
  // This might fail due to FK constraints if not cascading. 
  // Assuming Supabase 'users' table deletion cascades or RLS handles it.
  const { error } = await supabase.from('users').delete().eq('email', email);
  if (error) throw error;
};

// --- GENERIC FIELD UPDATES (Profile, Theme, Notepad) ---

export const saveUserField = async (email: string, field: string, data: any) => {
  let dbColumn = field;
  // Map frontend field names to DB column names (legacy 'users' table)
  if (field === 'notepadContent') dbColumn = 'notepad_content';
  if (field === 'notepadDrawing') dbColumn = 'notepad_drawing';
  if (field === 'cdiRate') dbColumn = 'cdi_rate';

  if (field === 'profile' || field === 'dashboardOrder') {
    // Complex merge for profile JSONB
    const { data: userData } = await supabase.from('users').select('profile').eq('email', email).single();
    const currentProfile = userData?.profile || {};
    
    let updatedProfile = field === 'profile' ? data : { ...currentProfile, [field]: data };
    
    const { error } = await supabase.from('users').update({ profile: updatedProfile }).eq('email', email);
    return !error;
  }
  
  const { error } = await supabase.from('users').update({ [dbColumn]: data }).eq('email', email);
  return !error;
};


// --- NORMALIZED DATA API (TRANSACTIONS, ACCOUNTS, ETC) ---

// 1. Transactions
export const apiTransactions = {
  list: async () => {
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) throw error;
    return data;
  },
  add: async (tx: any) => {
    const uid = await getUserId();
    const { data, error } = await supabase.from('transactions').insert([{ ...tx, user_id: uid }]).select().single();
    if (error) throw error;
    return data;
  },
  update: async (tx: any) => {
    const { id, ...updates } = tx;
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    return id;
  },
  bulkCreate: async (txs: any[]) => {
    const uid = await getUserId();
    const payload = txs.map(t => ({ ...t, user_id: uid }));
    const { data, error } = await supabase.from('transactions').insert(payload).select();
    if (error) throw error;
    return data;
  }
};

// 2. Accounts
export const apiAccounts = {
  list: async () => {
    const { data, error } = await supabase.from('accounts').select('*');
    if (error) throw error;
    // Map snake_case to camelCase if needed, but for now we updated types to match or handle it in hook
    // Actually, let's keep frontend types consistent. 
    // DB: color_theme -> Frontend: colorTheme
    return data.map((a: any) => ({ ...a, colorTheme: a.color_theme }));
  },
  add: async (acc: any) => {
    const uid = await getUserId();
    const payload = { ...acc, user_id: uid, color_theme: acc.colorTheme };
    delete payload.colorTheme; // clean up
    const { data, error } = await supabase.from('accounts').insert([payload]).select().single();
    if (error) throw error;
    return { ...data, colorTheme: data.color_theme };
  },
  update: async (acc: any) => {
    const { id, colorTheme, ...rest } = acc;
    const payload = { ...rest, color_theme: colorTheme };
    const { data, error } = await supabase.from('accounts').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, colorTheme: data.color_theme };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
    return id;
  },
  bulkCreate: async (accs: any[]) => {
    const uid = await getUserId();
    const payload = accs.map(a => ({
        ...a, user_id: uid, color_theme: a.colorTheme
    }));
    // Clean keys
    payload.forEach(p => delete p.colorTheme);

    const { data, error } = await supabase.from('accounts').insert(payload).select();
    if (error) throw error;
    return data.map((a: any) => ({ ...a, colorTheme: a.color_theme }));
  }
};

// 3. Months
export const apiMonths = {
  list: async () => {
    const { data, error } = await supabase.from('months').select('*');
    if (error) throw error;
    return data;
  },
  add: async (m: any) => {
    const uid = await getUserId();
    const { data, error } = await supabase.from('months').insert([{ ...m, user_id: uid }]).select().single();
    if (error) throw error;
    return data;
  },
  update: async (m: any) => {
    const { id, ...updates } = m;
    const { data, error } = await supabase.from('months').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from('months').delete().eq('id', id);
    if (error) throw error;
    return id;
  }
};

// 4. Investments
export const apiInvestments = {
  list: async () => {
    const { data, error } = await supabase.from('investments').select('*');
    if (error) throw error;
    return data.map((i: any) => ({ ...i, yieldRate: i.yield_rate }));
  },
  add: async (inv: any) => {
    const uid = await getUserId();
    const payload = { ...inv, user_id: uid, yield_rate: inv.yieldRate };
    delete payload.yieldRate;
    const { data, error } = await supabase.from('investments').insert([payload]).select().single();
    if (error) throw error;
    return { ...data, yieldRate: data.yield_rate };
  },
  update: async (inv: any) => {
    const { id, yieldRate, ...rest } = inv;
    const payload = { ...rest, yield_rate: yieldRate };
    const { data, error } = await supabase.from('investments').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, yieldRate: data.yield_rate };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (error) throw error;
    return id;
  }
};

// 5. Long Term
export const apiLongTerm = {
  list: async () => {
    const { data, error } = await supabase.from('long_term').select('*');
    if (error) throw error;
    return data.map((l: any) => ({
      ...l,
      totalAmount: l.total_amount,
      installmentsCount: l.installments_count,
      startDate: l.start_date,
      installmentsPaid: l.installments_paid,
      monthlyAmount: l.monthly_amount,
      installmentsHistory: l.installments_history,
      installmentsDates: l.installments_dates
    }));
  },
  add: async (lt: any) => {
    const uid = await getUserId();
    const payload = {
       user_id: uid,
       title: lt.title,
       total_amount: lt.totalAmount,
       installments_count: lt.installments_count,
       start_date: lt.startDate,
       installments_paid: lt.installmentsPaid,
       monthly_amount: lt.monthlyAmount,
       installments_history: lt.installmentsHistory,
       installments_dates: lt.installmentsDates
    };
    const { data, error } = await supabase.from('long_term').insert([payload]).select().single();
    if (error) throw error;
    return { ...data, totalAmount: data.total_amount, installmentsCount: data.installments_count, startDate: data.start_date, installmentsPaid: data.installments_paid, monthlyAmount: data.monthly_amount, installmentsHistory: data.installments_history, installmentsDates: data.installments_dates };
  },
  update: async (lt: any) => {
    const { id, totalAmount, installmentsCount, startDate, installmentsPaid, monthlyAmount, installmentsHistory, installmentsDates, ...rest } = lt;
    const payload = {
        ...rest,
        total_amount: totalAmount,
        installments_count: installmentsCount,
        start_date: startDate,
        installments_paid: installmentsPaid,
        monthly_amount: monthlyAmount,
        installments_history: installmentsHistory,
        installments_dates: installmentsDates
    };
    const { data, error } = await supabase.from('long_term').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, totalAmount: data.total_amount, installmentsCount: data.installments_count, startDate: data.start_date, installmentsPaid: data.installments_paid, monthlyAmount: data.monthly_amount, installmentsHistory: data.installments_history, installmentsDates: data.installments_dates };
  },
  delete: async (id: string) => {
    const { error } = await supabase.from('long_term').delete().eq('id', id);
    if (error) throw error;
    return id;
  }
};

// 6. Notifications
export const apiNotifications = {
  list: async () => {
    const { data, error } = await supabase.from('notifications').select('*');
    if (error) throw error;
    return data;
  },
  add: async (n: any) => {
    const uid = await getUserId();
    const { data, error } = await supabase.from('notifications').insert([{ ...n, user_id: uid }]).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
    return id;
  },
  markRead: async (id: string) => {
     // Not used individually much, usually bulk, but implemented
     const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).select().single();
     if (error) throw error;
     return data;
  },
  markAllRead: async (ids: string[]) => {
     // This needs a specific RPC or loop. For simplicity, we loop or use 'in'.
     const { data, error } = await supabase.from('notifications').update({ read: true }).in('id', ids).select();
     if (error) throw error;
     return data;
  }
};
