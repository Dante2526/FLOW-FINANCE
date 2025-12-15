
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Transaction, Account, MonthSummary, UserProfile, 
  LongTermTransaction, Investment, AppNotification, AppTheme 
} from '../types';
import { 
  loginUser, saveUserField, 
  apiTransactions, apiAccounts, apiMonths, apiInvestments, apiLongTerm, apiNotifications 
} from '../services/supabase';
import { AVAILABLE_THEMES } from '../components/SettingsView';
import { sortMonths, MONTH_NAMES } from '../utils/dateUtils';

// Helper for Stable IDs (UUID v4)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const SYSTEM_INITIAL_MONTH: MonthSummary = {
  id: '1',
  month: MONTH_NAMES[new Date().getMonth()],
  year: new Date().getFullYear().toString(),
  total: 0
};

const INITIAL_PROFILE: UserProfile = {
  name: '',
  subtitle: '',
  avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
  isPro: false
};

const BALANCE_CARD_ID = 'balance-card';

export const useFinancialData = (currentUserEmail: string | null, isSessionReady: boolean) => {
  const queryClient = useQueryClient();
  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);
  
  // Enabled flag for queries
  const isEnabled = !!currentUserEmail && isSessionReady;

  // --- 1. USER PROFILE & SETTINGS QUERY ---
  const profileQuery = useQuery({
    queryKey: ['userProfile', currentUserEmail],
    queryFn: () => loginUser(currentUserEmail!),
    enabled: isEnabled,
    staleTime: Infinity,
  });

  const [appTheme, setAppTheme] = useState<AppTheme>(AVAILABLE_THEMES[0]);

  useEffect(() => {
    if (profileQuery.data?.theme) {
      setAppTheme(profileQuery.data.theme);
    }
  }, [profileQuery.data?.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', appTheme.primary);
    root.style.setProperty('--color-accent-dark', appTheme.secondary);
  }, [appTheme]);

  // --- 2. MAIN DATA QUERIES ---

  const transactionsQuery = useQuery({
    queryKey: ['transactions', currentUserEmail],
    queryFn: apiTransactions.list,
    enabled: isEnabled,
    initialData: [],
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', currentUserEmail],
    queryFn: apiAccounts.list,
    enabled: isEnabled,
    initialData: [],
  });

  const monthsQuery = useQuery({
    queryKey: ['months', currentUserEmail],
    queryFn: async () => {
       const data = await apiMonths.list();
       return sortMonths(data.length > 0 ? data : [SYSTEM_INITIAL_MONTH]);
    },
    enabled: isEnabled,
    initialData: [SYSTEM_INITIAL_MONTH],
  });

  const investmentsQuery = useQuery({
    queryKey: ['investments', currentUserEmail],
    queryFn: apiInvestments.list,
    enabled: isEnabled,
    initialData: [],
  });

  const longTermQuery = useQuery({
    queryKey: ['longTerm', currentUserEmail],
    queryFn: apiLongTerm.list,
    enabled: isEnabled,
    initialData: [],
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications', currentUserEmail],
    queryFn: apiNotifications.list,
    enabled: isEnabled,
    initialData: [],
  });

  // --- OPTIMISTIC UPDATE HELPERS ---

  const onMutateOptimistic = async (queryKey: any[], updateFn: (old: any) => any) => {
    await queryClient.cancelQueries({ queryKey });
    const previousData = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (old: any) => updateFn(old));
    return { previousData };
  };

  const onErrorRollback = (err: any, variables: any, context: any, queryKey: any[]) => {
    if (context?.previousData) {
      queryClient.setQueryData(queryKey, context.previousData);
    }
  };

  const onSettledInvalidate = (queryKey: any[]) => {
    queryClient.invalidateQueries({ queryKey });
  };

  // --- MUTATIONS (With Stable ID Handling) ---

  // Transactions
  const addTransactionMutation = useMutation({
    mutationFn: apiTransactions.add,
    onMutate: (newTx) => onMutateOptimistic(['transactions', currentUserEmail], (old) => {
        // ID is already generated in the wrapper function below
        return [newTx, ...old];
    }),
    onError: (err, newTx, context) => onErrorRollback(err, newTx, context, ['transactions', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['transactions', currentUserEmail])
  });

  const updateTransactionMutation = useMutation({
    mutationFn: apiTransactions.update,
    onMutate: (updatedTx) => onMutateOptimistic(['transactions', currentUserEmail], (old) => {
        return old.map((t: Transaction) => t.id === updatedTx.id ? { ...t, ...updatedTx } : t);
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['transactions', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['transactions', currentUserEmail])
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: apiTransactions.delete,
    onMutate: (id) => onMutateOptimistic(['transactions', currentUserEmail], (old) => {
        return old.filter((t: Transaction) => t.id !== id);
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['transactions', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['transactions', currentUserEmail])
  });

  // Accounts
  const addAccountMutation = useMutation({
    mutationFn: apiAccounts.add,
    onMutate: (newAcc) => onMutateOptimistic(['accounts', currentUserEmail], (old) => {
        return [...old, newAcc];
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['accounts', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['accounts', currentUserEmail])
  });

  const updateAccountMutation = useMutation({
    mutationFn: apiAccounts.update,
    onMutate: (updatedAcc) => onMutateOptimistic(['accounts', currentUserEmail], (old) => {
        return old.map((a: Account) => a.id === updatedAcc.id ? { ...a, ...updatedAcc } : a);
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['accounts', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['accounts', currentUserEmail])
  });

  const deleteAccountMutation = useMutation({
    mutationFn: apiAccounts.delete,
    onMutate: (id) => onMutateOptimistic(['accounts', currentUserEmail], (old) => {
        return old.filter((a: Account) => a.id !== id);
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['accounts', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['accounts', currentUserEmail])
  });

  // Months
  const addMonthMutation = useMutation({
    mutationFn: apiMonths.add,
    onMutate: (newMonth) => onMutateOptimistic(['months', currentUserEmail], (old) => {
        return sortMonths([...old, newMonth]);
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['months', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['months', currentUserEmail])
  });

  const updateMonthMutation = useMutation({
    mutationFn: apiMonths.update,
    onMutate: (updatedMonth) => onMutateOptimistic(['months', currentUserEmail], (old) => {
        return old.map((m: MonthSummary) => m.id === updatedMonth.id ? { ...m, ...updatedMonth } : m);
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['months', currentUserEmail]),
    onSettled: () => onSettledInvalidate(['months', currentUserEmail])
  });

  const deleteMonthMutation = useMutation({
    mutationFn: apiMonths.delete,
    onMutate: (id) => onMutateOptimistic(['months', currentUserEmail], (old) => {
        return old.filter((m: MonthSummary) => m.id !== id);
    }),
    onError: (err, vars, context) => onErrorRollback(err, vars, context, ['months', currentUserEmail]),
    onSettled: () => {
        onSettledInvalidate(['months', currentUserEmail]);
        onSettledInvalidate(['transactions', currentUserEmail]);
    }
  });

  // Investments
  const addInvestmentMutation = useMutation({
    mutationFn: apiInvestments.add,
    onMutate: (newInv) => onMutateOptimistic(['investments', currentUserEmail], (old) => {
        return [...old, newInv];
    }),
    onSettled: () => onSettledInvalidate(['investments', currentUserEmail])
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: apiInvestments.update,
    onMutate: (updatedInv) => onMutateOptimistic(['investments', currentUserEmail], (old) => {
        return old.map((i: Investment) => i.id === updatedInv.id ? { ...i, ...updatedInv } : i);
    }),
    onSettled: () => onSettledInvalidate(['investments', currentUserEmail])
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: apiInvestments.delete,
    onMutate: (id) => onMutateOptimistic(['investments', currentUserEmail], (old) => {
        return old.filter((i: Investment) => i.id !== id);
    }),
    onSettled: () => onSettledInvalidate(['investments', currentUserEmail])
  });

  // Long Term
  const addLongTermMutation = useMutation({
    mutationFn: apiLongTerm.add,
    onMutate: (newItem) => onMutateOptimistic(['longTerm', currentUserEmail], (old) => {
        return [...old, newItem];
    }),
    onSettled: () => onSettledInvalidate(['longTerm', currentUserEmail])
  });

  const updateLongTermMutation = useMutation({
    mutationFn: apiLongTerm.update,
    onMutate: (updatedItem) => onMutateOptimistic(['longTerm', currentUserEmail], (old) => {
        return old.map((i: LongTermTransaction) => i.id === updatedItem.id ? { ...i, ...updatedItem } : i);
    }),
    onSettled: () => onSettledInvalidate(['longTerm', currentUserEmail])
  });

  const deleteLongTermMutation = useMutation({
    mutationFn: apiLongTerm.delete,
    onMutate: (id) => onMutateOptimistic(['longTerm', currentUserEmail], (old) => {
        return old.filter((i: LongTermTransaction) => i.id !== id);
    }),
    onSettled: () => onSettledInvalidate(['longTerm', currentUserEmail])
  });

  // Notifications
  const addNotificationMutation = useMutation({
    mutationFn: apiNotifications.add,
    onMutate: (newNotif) => onMutateOptimistic(['notifications', currentUserEmail], (old) => {
       return [newNotif, ...old];
    }),
    onSettled: () => onSettledInvalidate(['notifications', currentUserEmail])
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: apiNotifications.delete,
    onMutate: (id) => onMutateOptimistic(['notifications', currentUserEmail], (old) => {
       return old.filter((n: AppNotification) => n.id !== id);
    }),
    onSettled: () => onSettledInvalidate(['notifications', currentUserEmail])
  });

  const markAllReadMutation = useMutation({
    mutationFn: (ids: string[]) => apiNotifications.markAllRead(ids),
    onMutate: () => onMutateOptimistic(['notifications', currentUserEmail], (old) => {
       return old.map((n: AppNotification) => ({ ...n, read: true }));
    }),
    onSettled: () => onSettledInvalidate(['notifications', currentUserEmail])
  });

  // Bulk Operations
  const bulkTransactionsMutation = useMutation({
    mutationFn: apiTransactions.bulkCreate,
    onSuccess: () => onSettledInvalidate(['transactions', currentUserEmail])
  });
  const bulkAccountsMutation = useMutation({
    mutationFn: apiAccounts.bulkCreate,
    onSuccess: () => onSettledInvalidate(['accounts', currentUserEmail])
  });

  // Settings
  const saveThemeMutation = useMutation({
    mutationFn: (theme: AppTheme) => saveUserField(currentUserEmail!, 'theme', theme),
    onMutate: (theme) => {
       setAppTheme(theme);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] })
  });

  const saveProfileMutation = useMutation({
    mutationFn: (profile: UserProfile) => saveUserField(currentUserEmail!, 'profile', profile),
    onMutate: (newProfile) => onMutateOptimistic(['userProfile', currentUserEmail], (old) => {
        return { ...old, profile: newProfile };
    }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] })
  });

  const saveCdiMutation = useMutation({
    mutationFn: (rate: number) => saveUserField(currentUserEmail!, 'cdiRate', rate),
    onMutate: (rate) => onMutateOptimistic(['userProfile', currentUserEmail], (old) => {
        return { ...old, cdiRate: rate };
    }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] })
  });

  const saveNotepadMutation = useMutation({
    mutationFn: (payload: { content: string, drawing: string | null }) => {
       return Promise.all([
          saveUserField(currentUserEmail!, 'notepadContent', payload.content),
          saveUserField(currentUserEmail!, 'notepadDrawing', payload.drawing)
       ]);
    },
    onMutate: (payload) => onMutateOptimistic(['userProfile', currentUserEmail], (old) => {
        return { ...old, notepadContent: payload.content, notepadDrawing: payload.drawing };
    }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] })
  });

  const saveDashboardOrderMutation = useMutation({
    mutationFn: (order: string[]) => saveUserField(currentUserEmail!, 'dashboardOrder', order),
    onMutate: (order) => onMutateOptimistic(['userProfile', currentUserEmail], (old) => {
        return { ...old, dashboardOrder: order };
    }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['userProfile'] })
  });


  // --- INITIAL MONTH CHECK ---
  useEffect(() => {
    if (monthsQuery.data.length > 0 && activeMonthId === SYSTEM_INITIAL_MONTH.id) {
       // Set active to last month loaded
       setActiveMonthId(monthsQuery.data[monthsQuery.data.length - 1].id);
    }
  }, [monthsQuery.data]);


  // --- EXPORTED DATA & HANDLERS ---
  
  return {
    userProfile: profileQuery.data?.profile || INITIAL_PROFILE,
    transactions: transactionsQuery.data,
    accounts: accountsQuery.data,
    months: monthsQuery.data,
    longTermTransactions: longTermQuery.data,
    investments: investmentsQuery.data,
    notifications: notificationsQuery.data,
    notepadContent: profileQuery.data?.notepadContent || '',
    notepadDrawing: profileQuery.data?.notepadDrawing || null,
    cdiRate: profileQuery.data?.cdiRate || 11.25,
    dashboardOrder: profileQuery.data?.dashboardOrder || [BALANCE_CARD_ID],
    appTheme,
    
    activeMonthId, 
    setActiveMonthId,
    isLoadingData: profileQuery.isLoading || transactionsQuery.isLoading,

    setUserProfile: (p: any) => {
       const newVal = typeof p === 'function' ? p(profileQuery.data?.profile || INITIAL_PROFILE) : p;
       saveProfileMutation.mutate(newVal);
    },
    setAppTheme: (t: any) => saveThemeMutation.mutate(t),
    setCdiRate: (r: number) => saveCdiMutation.mutate(r),
    setDashboardOrder: (o: any) => {
       const newVal = typeof o === 'function' ? o(profileQuery.data?.dashboardOrder || []) : o;
       saveDashboardOrderMutation.mutate(newVal);
    },
    setNotepadContent: (c: string) => {}, 
    setNotepadDrawing: (d: string | null) => {},
    saveNotepad: (c: string, d: string | null) => saveNotepadMutation.mutate({ content: c, drawing: d }),

    // --- WRAPPERS WITH STABLE IDs ---
    
    addTransaction: (tx: any) => {
        // Ensure ID is generated here for 100% consistency between Optimistic UI and DB
        const txWithId = { ...tx, id: tx.id || generateUUID() };
        addTransactionMutation.mutate(txWithId);
    },
    updateTransaction: (tx: any) => updateTransactionMutation.mutate(tx),
    deleteTransaction: (id: string) => deleteTransactionMutation.mutate(id),
    
    addAccount: (acc: any) => {
        const accWithId = { ...acc, id: acc.id || generateUUID() };
        addAccountMutation.mutate(accWithId);
    },
    updateAccount: (acc: any) => updateAccountMutation.mutate(acc),
    deleteAccount: (id: string) => deleteAccountMutation.mutate(id),

    addMonth: (m: any) => {
        const monthWithId = { ...m, id: m.id || generateUUID() };
        addMonthMutation.mutate(monthWithId);
    },
    updateMonth: (m: any) => updateMonthMutation.mutate(m),
    deleteMonth: (id: string) => deleteMonthMutation.mutate(id),
    
    bulkCreateTransactions: (txs: any[]) => bulkTransactionsMutation.mutate(txs),
    bulkCreateAccounts: (accs: any[]) => bulkAccountsMutation.mutate(accs),

    addInvestment: (inv: any) => {
        const invWithId = { ...inv, id: inv.id || generateUUID() };
        addInvestmentMutation.mutate(invWithId);
    },
    updateInvestment: (inv: any) => updateInvestmentMutation.mutate(inv),
    deleteInvestment: (id: string) => deleteInvestmentMutation.mutate(id),
    setInvestments: (invs: any) => {},

    addLongTerm: (lt: any) => {
        const ltWithId = { ...lt, id: lt.id || generateUUID() };
        addLongTermMutation.mutate(ltWithId);
    },
    updateLongTerm: (lt: any) => updateLongTermMutation.mutate(lt),
    deleteLongTerm: (id: string) => deleteLongTermMutation.mutate(id),
    setLongTermTransactions: (lts: any) => {}, 

    setNotifications: (n: any) => {},
    addNotification: (n: any) => {
        const notifWithId = { ...n, id: n.id || generateUUID(), read: false };
        addNotificationMutation.mutate(notifWithId);
    },
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
    markAllNotificationsRead: () => {
       const ids = notificationsQuery.data?.map((n:any) => n.id) || [];
       if(ids.length) markAllReadMutation.mutate(ids);
    },

    // Legacy Fallbacks
    setTransactions: () => {},
    setAccounts: () => {},
    setMonths: () => {},
  };
};
