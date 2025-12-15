
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
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey });
    // Snapshot the previous value
    const previousData = queryClient.getQueryData(queryKey);
    // Optimistically update to the new value
    queryClient.setQueryData(queryKey, (old: any) => updateFn(old));
    // Return a context object with the snapshotted value
    return { previousData };
  };

  const onErrorRollback = (err: any, variables: any, context: any, queryKey: any[]) => {
    // If the mutation fails, use the context returned from onMutate to roll back
    if (context?.previousData) {
      queryClient.setQueryData(queryKey, context.previousData);
    }
  };

  const onSettledInvalidate = (queryKey: any[]) => {
    // Always refetch after error or success:
    queryClient.invalidateQueries({ queryKey });
  };

  // --- MUTATIONS (OPTIMISTIC) ---

  // Transactions
  const addTransactionMutation = useMutation({
    mutationFn: apiTransactions.add,
    onMutate: (newTx) => onMutateOptimistic(['transactions', currentUserEmail], (old) => {
        const tempTx = { ...newTx, id: newTx.id || `temp-${Date.now()}` };
        return [tempTx, ...old];
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
        const tempAcc = { ...newAcc, id: newAcc.id || `temp-${Date.now()}` };
        return [...old, tempAcc];
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
        const temp = { ...newMonth, id: newMonth.id || `temp-${Date.now()}` };
        return sortMonths([...old, temp]);
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
        const temp = { ...newInv, id: `temp-${Date.now()}` };
        return [...old, temp];
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
        const temp = { ...newItem, id: `temp-${Date.now()}` };
        return [...old, temp];
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
       const temp = { ...newNotif, id: `temp-${Date.now()}`, read: false };
       return [temp, ...old];
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

  // Bulk Operations (Optimistic is hard for bulk, generally we just rely on settle)
  const bulkTransactionsMutation = useMutation({
    mutationFn: apiTransactions.bulkCreate,
    onSuccess: () => onSettledInvalidate(['transactions', currentUserEmail])
  });
  const bulkAccountsMutation = useMutation({
    mutationFn: apiAccounts.bulkCreate,
    onSuccess: () => onSettledInvalidate(['accounts', currentUserEmail])
  });

  // User Settings (Theme, Profile, etc.) - Direct
  const saveThemeMutation = useMutation({
    mutationFn: (theme: AppTheme) => saveUserField(currentUserEmail!, 'theme', theme),
    onMutate: (theme) => {
       setAppTheme(theme); // Instant UI Update
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
    // Data
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

    // Actions
    setUserProfile: (p: any) => {
       const newVal = typeof p === 'function' ? p(profileQuery.data?.profile || INITIAL_PROFILE) : p;
       saveProfileMutation.mutate(newVal);
    },
    setAppTheme: (t: any) => {
       saveThemeMutation.mutate(t);
    },
    setCdiRate: (r: number) => saveCdiMutation.mutate(r),
    setDashboardOrder: (o: any) => {
       const newVal = typeof o === 'function' ? o(profileQuery.data?.dashboardOrder || []) : o;
       saveDashboardOrderMutation.mutate(newVal);
    },
    // Notepad local state is handled by the modal, we only receive save commands
    setNotepadContent: (c: string) => {}, 
    setNotepadDrawing: (d: string | null) => {},
    saveNotepad: (c: string, d: string | null) => saveNotepadMutation.mutate({ content: c, drawing: d }),

    // Transactions
    addTransaction: (tx: any) => addTransactionMutation.mutate(tx),
    updateTransaction: (tx: any) => updateTransactionMutation.mutate(tx),
    deleteTransaction: (id: string) => deleteTransactionMutation.mutate(id),
    
    // Accounts
    addAccount: (acc: any) => addAccountMutation.mutate(acc),
    updateAccount: (acc: any) => updateAccountMutation.mutate(acc),
    deleteAccount: (id: string) => deleteAccountMutation.mutate(id),

    // Months
    addMonth: (m: any) => addMonthMutation.mutate(m),
    updateMonth: (m: any) => updateMonthMutation.mutate(m),
    deleteMonth: (id: string) => deleteMonthMutation.mutate(id),
    
    // Bulk
    bulkCreateTransactions: (txs: any[]) => bulkTransactionsMutation.mutate(txs),
    bulkCreateAccounts: (accs: any[]) => bulkAccountsMutation.mutate(accs),

    // Investments
    addInvestment: (inv: any) => addInvestmentMutation.mutate(inv),
    updateInvestment: (inv: any) => updateInvestmentMutation.mutate(inv),
    deleteInvestment: (id: string) => deleteInvestmentMutation.mutate(id),
    setInvestments: (invs: any) => {},

    // Long Term
    addLongTerm: (lt: any) => addLongTermMutation.mutate(lt),
    updateLongTerm: (lt: any) => updateLongTermMutation.mutate(lt),
    deleteLongTerm: (id: string) => deleteLongTermMutation.mutate(id),
    setLongTermTransactions: (lts: any) => {}, 

    // Notifications
    setNotifications: (n: any) => {},
    addNotification: (n: any) => addNotificationMutation.mutate(n),
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
    markAllNotificationsRead: () => {
       const ids = notificationsQuery.data?.map((n:any) => n.id) || [];
       if(ids.length) markAllReadMutation.mutate(ids);
    },

    // Legacy Fallbacks (No-ops as we use direct mutations now)
    setTransactions: () => {},
    setAccounts: () => {},
    setMonths: () => {},
  };
};
