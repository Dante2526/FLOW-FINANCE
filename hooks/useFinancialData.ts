
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Transaction, Account, MonthSummary, UserProfile, 
  LongTermTransaction, Investment, AppNotification, AppTheme 
} from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';
import { 
  loadUserData, saveCollection, saveUserField, 
  subscribeToUserChanges 
} from '../services/supabase';
import { AVAILABLE_THEMES } from '../components/SettingsView';
import { MONTH_NAMES, sortMonths } from '../utils/dateUtils';

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
  // --- STATE ---
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
     return !!loadData(STORAGE_KEYS.USER_SESSION, null);
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [months, setMonths] = useState<MonthSummary[]>([SYSTEM_INITIAL_MONTH]);
  const [longTermTransactions, setLongTermTransactions] = useState<LongTermTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notepadContent, setNotepadContent] = useState<string>('');
  const [notepadDrawing, setNotepadDrawing] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [cdiRate, setCdiRate] = useState<number>(11.25);
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([BALANCE_CARD_ID]);
  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    return loadData(STORAGE_KEYS.APP_THEME, AVAILABLE_THEMES[0]);
  });
  
  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);

  // --- REFS (For Debounce & Sync Protection) ---
  const prevTransactionsRef = useRef<string>(JSON.stringify(transactions));
  const prevAccountsRef = useRef<string>(JSON.stringify(accounts));
  const prevInvestmentsRef = useRef<string>(JSON.stringify(investments));
  const prevLongTermRef = useRef<string>(JSON.stringify(longTermTransactions));
  const prevNotificationsRef = useRef<string>(JSON.stringify(notifications));
  const prevProfileRef = useRef<string>(JSON.stringify(userProfile));
  const prevThemeRef = useRef<string>(JSON.stringify(appTheme));
  const prevMonthsRef = useRef<string>(JSON.stringify(months));
  const prevNotepadRef = useRef<string>(notepadContent);
  const prevDrawingRef = useRef<string | null>(notepadDrawing);
  const prevCdiRef = useRef<number>(cdiRate);
  const prevDashboardOrderRef = useRef<string>(JSON.stringify(dashboardOrder));

  const currentStateRef = useRef({
    transactions, accounts, investments, longTermTransactions, notifications,
    userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder
  });

  // Update ref on render
  useEffect(() => {
    currentStateRef.current = {
      transactions, accounts, investments, longTermTransactions, notifications,
      userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder
    };
  });

  // --- INITIAL MONTH LOGIC ---
  useEffect(() => {
    if (activeMonthId === SYSTEM_INITIAL_MONTH.id && months.length > 0) {
       const sorted = sortMonths(months);
       if (sorted.length > 0) {
          setActiveMonthId(sorted[sorted.length - 1].id);
       }
    }
  }, []);

  // --- DATA LOADING & SYNC ---
  const applyData = useCallback((data: any) => {
      if (data.profile) {
        let profile = data.profile;
        // Check PRO expiry
        if (profile.isPro && profile.subscriptionExpiry) {
           const expiryDate = new Date(profile.subscriptionExpiry);
           const now = new Date();
           if (now > expiryDate) {
              profile = { ...profile, isPro: false, subscriptionExpiry: undefined };
              if (currentUserEmail) saveUserField(currentUserEmail, "profile", profile); 
           }
        }
        setUserProfile(profile);
        prevProfileRef.current = JSON.stringify(profile);
      }
      if (data.transactions) {
        setTransactions(data.transactions);
        prevTransactionsRef.current = JSON.stringify(data.transactions);
      }
      if (data.accounts) {
        setAccounts(data.accounts);
        prevAccountsRef.current = JSON.stringify(data.accounts);
      }
      if (data.investments) {
        setInvestments(data.investments);
        prevInvestmentsRef.current = JSON.stringify(data.investments);
      }
      if (data.longTerm) {
        setLongTermTransactions(data.longTerm);
        prevLongTermRef.current = JSON.stringify(data.longTerm);
      }
      if (data.notifications) {
        setNotifications(data.notifications);
        prevNotificationsRef.current = JSON.stringify(data.notifications);
      }
      if (data.theme) {
         setAppTheme(data.theme);
         saveData(STORAGE_KEYS.APP_THEME, data.theme);
         prevThemeRef.current = JSON.stringify(data.theme);
      }
      if (data.notepadContent !== undefined) {
        setNotepadContent(data.notepadContent);
        prevNotepadRef.current = data.notepadContent;
      }
      if (data.notepadDrawing !== undefined) {
        setNotepadDrawing(data.notepadDrawing);
        prevDrawingRef.current = data.notepadDrawing;
      }
      if (data.months && data.months.length > 0) {
        const sorted = sortMonths(data.months);
        setMonths(sorted);
        if (activeMonthId === SYSTEM_INITIAL_MONTH.id || activeMonthId === '1') {
           setActiveMonthId(sorted[sorted.length - 1].id);
        }
        prevMonthsRef.current = JSON.stringify(sorted);
      }
      if (data.cdiRate !== undefined) {
        setCdiRate(data.cdiRate);
        prevCdiRef.current = data.cdiRate;
      }
      
      // Order Handling - Prefer profile data, fall back to calculated list
      if (data.dashboardOrder && Array.isArray(data.dashboardOrder) && data.dashboardOrder.length > 0) {
         setDashboardOrder(data.dashboardOrder);
         prevDashboardOrderRef.current = JSON.stringify(data.dashboardOrder);
      } else if (data.accounts) {
         // If no saved order, create default
         const initialOrder = [BALANCE_CARD_ID, ...data.accounts.map((a: Account) => a.id)];
         setDashboardOrder(initialOrder);
         // Don't update ref yet to allow it to be saved as "dirty" later if needed
      }
  }, [activeMonthId, currentUserEmail]);

  // Safe apply for Realtime (checks against current state to avoid loops)
  const applyDataSafe = useCallback((data: any) => {
      const state = currentStateRef.current;

      const updateIfChanged = (key: keyof typeof state, dataKey: string, setter: Function, ref: React.MutableRefObject<any>, isJson = true) => {
         const currentVal = isJson ? JSON.stringify(state[key]) : state[key];
         const refVal = ref.current;
         
         if (currentVal === refVal) { // Only update if local state matches last known synced state (no local edits pending)
            if (data[dataKey] !== undefined) {
               const newDataStr = isJson ? JSON.stringify(data[dataKey]) : data[dataKey];
               if (newDataStr !== currentVal) {
                  setter(data[dataKey]);
                  ref.current = newDataStr;
               }
            }
         }
      };

      updateIfChanged('transactions', 'transactions', setTransactions, prevTransactionsRef);
      updateIfChanged('accounts', 'accounts', setAccounts, prevAccountsRef);
      updateIfChanged('investments', 'investments', setInvestments, prevInvestmentsRef);
      updateIfChanged('longTermTransactions', 'longTerm', setLongTermTransactions, prevLongTermRef);
      updateIfChanged('notifications', 'notifications', setNotifications, prevNotificationsRef);
      updateIfChanged('months', 'months', (m: any) => setMonths(sortMonths(m)), prevMonthsRef);
      
      // Explicitly handle dashboardOrder with array check
      if (data.dashboardOrder && Array.isArray(data.dashboardOrder) && data.dashboardOrder.length > 0) {
         const currentOrderStr = JSON.stringify(state.dashboardOrder);
         if (currentOrderStr === prevDashboardOrderRef.current) {
             const newOrderStr = JSON.stringify(data.dashboardOrder);
             if (newOrderStr !== currentOrderStr) {
                 setDashboardOrder(data.dashboardOrder);
                 prevDashboardOrderRef.current = newOrderStr;
             }
         }
      }
      
      // Special Handling for Profile (Pro Expiry)
      const currentProfileStr = JSON.stringify(state.userProfile);
      if (currentProfileStr === prevProfileRef.current) {
         if (data.profile && JSON.stringify(data.profile) !== currentProfileStr) {
             let profile = data.profile;
             if (profile.isPro && profile.subscriptionExpiry) {
                 const expiryDate = new Date(profile.subscriptionExpiry);
                 if (new Date() > expiryDate) {
                    profile = { ...profile, isPro: false, subscriptionExpiry: undefined };
                 }
             }
             setUserProfile(profile);
             prevProfileRef.current = JSON.stringify(profile);
         }
      }

      // Theme
      const currentThemeStr = JSON.stringify(state.appTheme);
      if (currentThemeStr === prevThemeRef.current) {
         if (data.theme && JSON.stringify(data.theme) !== currentThemeStr) {
             setAppTheme(data.theme);
             saveData(STORAGE_KEYS.APP_THEME, data.theme);
             prevThemeRef.current = JSON.stringify(data.theme);
         }
      }

      // Notepad
      if (state.notepadContent === prevNotepadRef.current) {
         if (data.notepadContent !== undefined && data.notepadContent !== state.notepadContent) {
            setNotepadContent(data.notepadContent);
            prevNotepadRef.current = data.notepadContent;
         }
      }
      if (state.notepadDrawing === prevDrawingRef.current) {
         if (data.notepadDrawing !== undefined && data.notepadDrawing !== state.notepadDrawing) {
            setNotepadDrawing(data.notepadDrawing);
            prevDrawingRef.current = data.notepadDrawing;
         }
      }
      
      // CDI
      if (state.cdiRate === prevCdiRef.current) {
         if (data.cdiRate !== undefined && data.cdiRate !== state.cdiRate) {
             setCdiRate(data.cdiRate);
             prevCdiRef.current = data.cdiRate;
         }
      }
  }, []);

  // Load Initial Data
  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;
    setIsLoadingData(true);

    loadUserData(currentUserEmail)
      .then((data) => {
        if (data) applyData(data);
      })
      .catch(err => console.error("Error loading data:", err))
      .finally(() => setIsLoadingData(false));
  }, [currentUserEmail, isSessionReady, applyData]);

  // Realtime Subscription
  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;
    const unsubscribe = subscribeToUserChanges(currentUserEmail, applyDataSafe);
    return () => { unsubscribe(); };
  }, [currentUserEmail, isSessionReady, applyDataSafe]);

  // Visibility Refresh
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && currentUserEmail) {
        loadUserData(currentUserEmail)
          .then((data) => { if (data) applyDataSafe(data); })
          .catch(console.error);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUserEmail, applyDataSafe]);

  // --- SAVING EFFECTS (Debounced) ---
  const DEBOUNCE_DELAY = 1500;

  const createSaveEffect = (data: any, ref: React.MutableRefObject<any>, collectionName: string) => {
    useEffect(() => {
        if (currentUserEmail && !isLoadingData) {
            const currentStr = typeof data === 'object' ? JSON.stringify(data) : data;
            if (currentStr !== ref.current) {
                const timer = setTimeout(async () => {
                    if (collectionName === 'profile' || collectionName === 'theme' || collectionName === 'months' || collectionName.startsWith('notepad') || collectionName === 'cdiRate') {
                        await saveUserField(currentUserEmail, collectionName, data);
                    } else if (collectionName === 'dashboardOrder') {
                        // Special save for order to profile structure
                        await saveCollection(currentUserEmail, collectionName, data);
                    } else {
                        await saveCollection(currentUserEmail, collectionName, data);
                    }
                    ref.current = currentStr;
                }, DEBOUNCE_DELAY);
                return () => clearTimeout(timer);
            }
        }
    }, [data, currentUserEmail, isLoadingData]);
  };

  createSaveEffect(transactions, prevTransactionsRef, 'transactions');
  createSaveEffect(accounts, prevAccountsRef, 'accounts');
  createSaveEffect(investments, prevInvestmentsRef, 'investments');
  createSaveEffect(longTermTransactions, prevLongTermRef, 'longTerm');
  createSaveEffect(notifications, prevNotificationsRef, 'notifications');
  createSaveEffect(userProfile, prevProfileRef, 'profile');
  createSaveEffect(months, prevMonthsRef, 'months');
  createSaveEffect(dashboardOrder, prevDashboardOrderRef, 'dashboardOrder');
  createSaveEffect(cdiRate, prevCdiRef, 'cdiRate');

  // Notepad Save (Special Case for multiple fields)
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const isContentChanged = notepadContent !== prevNotepadRef.current;
      const isDrawingChanged = notepadDrawing !== prevDrawingRef.current;

      if (isContentChanged || isDrawingChanged) {
        const timer = setTimeout(async () => {
          if (isContentChanged) {
             await saveUserField(currentUserEmail, "notepadContent", notepadContent);
             prevNotepadRef.current = notepadContent;
          }
          if (isDrawingChanged) {
             await saveUserField(currentUserEmail, "notepadDrawing", notepadDrawing);
             prevDrawingRef.current = notepadDrawing;
          }
        }, 2000); 
        return () => clearTimeout(timer);
      }
    }
  }, [notepadContent, notepadDrawing, currentUserEmail, isLoadingData]);

  // Theme Local Storage Sync
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', appTheme.primary);
    root.style.setProperty('--color-accent-dark', appTheme.secondary);
    saveData(STORAGE_KEYS.APP_THEME, appTheme);
    
    // Cloud sync handled by createSaveEffect above
  }, [appTheme]);


  // --- AUTO NOTIFICATIONS ---
  useEffect(() => {
    if (!currentUserEmail) return;

    const checkDueBills = async () => {
      const today = new Date();
      const newNotifications: AppNotification[] = [];
      
      transactions.forEach(tx => {
        if (tx.paid) return;
        let isDueToday = false;
        
        if (tx.date.toLowerCase().includes('hoje')) {
          isDueToday = true;
        } else {
          // Parse YYYY-MM-DD
          if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
             const d = new Date(tx.date.split(' ')[0] + 'T00:00:00');
             if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
                isDueToday = true;
             }
          }
          // Legacy format parsing if needed
        }

        if (isDueToday) {
           const alreadyNotified = notifications.some(n => n.message.includes(tx.name) && n.date === new Date().toLocaleDateString('pt-BR'));
           if (!alreadyNotified) {
             const notif: AppNotification = {
               id: Date.now().toString() + Math.random(),
               title: 'Vencimento Hoje!',
               message: `A conta ${tx.name} no valor de R$ ${tx.amount} vence hoje.`,
               date: new Date().toLocaleDateString('pt-BR'),
               read: false,
               type: 'alert'
             };
             newNotifications.push(notif);
             // Trigger Browser Notification Logic here if desired (simplified for hook)
           }
        }
      });
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    };
    const timer = setTimeout(checkDueBills, 2000);
    return () => clearTimeout(timer);
  }, [transactions, currentUserEmail]); 

  // --- RETURN ---
  return {
    // Data
    userProfile, setUserProfile,
    transactions, setTransactions,
    accounts, setAccounts,
    months, setMonths,
    longTermTransactions, setLongTermTransactions,
    investments, setInvestments,
    notepadContent, setNotepadContent,
    notepadDrawing, setNotepadDrawing,
    notifications, setNotifications,
    cdiRate, setCdiRate,
    dashboardOrder, setDashboardOrder,
    appTheme, setAppTheme,
    activeMonthId, setActiveMonthId,
    isLoadingData,

    // Actions
    deleteUser: async () => { /* Logic moved to App or kept here? Kept simplified in App for now */ }
  };
};
