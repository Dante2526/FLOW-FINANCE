
import React, { useState, useMemo, useEffect, useRef } from 'react';
import BalanceCard from './components/BalanceCard';
import SecondaryCard from './components/SecondaryCard';
import ContactsRow from './components/ContactsRow';
import TransactionSummary from './components/TransactionSummary';
import TransactionList from './components/TransactionList';
import BottomNav from './components/BottomNav';
import AddTransactionModal from './components/AddTransactionModal';
import AddAccountModal from './components/AddAccountModal';
import CalculatorModal from './components/CalculatorModal';
import EditProfileModal from './components/EditProfileModal';
import NotepadModal from './components/NotepadModal';
import { CalendarModal } from './components/CalendarModal';
import NotificationModal from './components/NotificationModal';
import AnalyticsModal from './components/AnalyticsModal';
import SettingsView, { AVAILABLE_THEMES } from './components/SettingsView';
import LongTermView from './components/LongTermView';
import InvestmentsView from './components/InvestmentsView';
import LoginScreen from './components/LoginScreen';
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppTheme, AppView, LongTermTransaction, Investment, AppNotification } from './types';
import { loadData, saveData, STORAGE_KEYS } from './services/storage';
import { IconBell, IconMore } from './components/Icons';

// Supabase Services (Migrated from Firebase)
import { loginUser, registerUser, loadUserData, saveCollection, saveUserField, subscribeToUserChanges } from './services/supabase';

// Constants
const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const MONTH_SHORT_CODES: Record<string, string> = {
  'JANEIRO': 'Jan',
  'FEVEREIRO': 'Fev',
  'MARÇO': 'Mar',
  'ABRIL': 'Abr',
  'MAIO': 'Mai',
  'JUNHO': 'Jun',
  'JULHO': 'Jul',
  'AGOSTO': 'Ago',
  'SETEMBRO': 'Set',
  'OUTUBRO': 'Out',
  'NOVEMBRO': 'Nov',
  'DEZEMBRO': 'Dez'
};

const SHORT_CODE_TO_FULL: Record<string, string> = {
  'Jan': 'JANEIRO', 'Fev': 'FEVEREIRO', 'Mar': 'MARÇO', 'Abr': 'ABRIL',
  'Mai': 'MAIO', 'Jun': 'JUNHO', 'Jul': 'JULHO', 'Ago': 'AGOSTO',
  'Set': 'SETEMBRO', 'Out': 'OUTUBRO', 'Nov': 'NOVEMBRO', 'Dez': 'DEZEMBRO'
};

// VAPID Configuration for Push Notifications
const VAPID_PUBLIC_KEY = 'BOabgmhdqm_B03NgjZgZUG4tT6whqH_sfr9-ZmMt1XY-lbI_ADbOzze9pRDU3tnj7oXttv01ZXcNKLhzeXlifC8';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// --- DYNAMIC INITIALIZATION LOGIC ---
const currentDate = new Date();
const currentMonthIndex = currentDate.getMonth();
const currentYear = currentDate.getFullYear();
const currentMonthName = MONTH_NAMES[currentMonthIndex];
const currentShortCode = MONTH_SHORT_CODES[currentMonthName];

// Initial Month based on System Date
const SYSTEM_INITIAL_MONTH: MonthSummary = {
  id: '1',
  month: currentMonthName,
  year: currentYear.toString(),
  total: 0
};

// Mock Data for Contacts (Static)
const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Notas', imageUrl: '' }, // Notes / Smart Notepad
  { id: '2', name: 'Calendário', imageUrl: '' }, // Calendar
  { id: '3', name: 'Análise', imageUrl: '' }, // Analytics
];

// Initial Profile
const INITIAL_PROFILE: UserProfile = {
  name: '',
  subtitle: '',
  avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix'
};

// Helper: Parse Date String to determine month
const getMonthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // "Hoje ..." -> Current real month
  if (dateStr.toLowerCase().includes('hoje')) {
    return MONTH_NAMES[new Date().getMonth()];
  }

  // "24 Jan ..."
  const parts = dateStr.split(' ');
  if (parts.length >= 2 && !dateStr.includes('-')) {
    const code = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase(); // Ensure title case "Jan"
    return SHORT_CODE_TO_FULL[code] || '';
  }

  // ISO "YYYY-MM-DD"
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(dateStr.split(' ')[0] + 'T00:00:00');
    return MONTH_NAMES[d.getMonth()];
  }

  return '';
};

// Helper: Get Year from Date String
const getYearFromDateStr = (dateStr: string, activeYearContext?: string): string => {
  // If "Hoje", it's definitely current year
  if (dateStr.toLowerCase().includes('hoje')) return new Date().getFullYear().toString();
  
  // If ISO, extract year
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr.split('-')[0];
  
  // For "24 Jan", we have ambiguity.
  // We prefer the context year if it matches the month flow.
  if (activeYearContext) return activeYearContext;

  return new Date().getFullYear().toString();
};

// Helper: Sort Months Chronologically
const sortMonths = (monthsList: MonthSummary[]) => {
  return [...monthsList].sort((a, b) => {
    const yearA = parseInt(a.year);
    const yearB = parseInt(b.year);
    
    if (yearA !== yearB) return yearA - yearB;
    
    const monthIndexA = MONTH_NAMES.indexOf(a.month);
    const monthIndexB = MONTH_NAMES.indexOf(b.month);
    
    return monthIndexA - monthIndexB;
  });
};

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return loadData(STORAGE_KEYS.USER_SESSION, null);
  });
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // View State
  const [currentView, setCurrentView] = useState<AppView>('home');

  // Modal States
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  
  // --- DATA STATES ---
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [months, setMonths] = useState<MonthSummary[]>([SYSTEM_INITIAL_MONTH]);
  const [longTermTransactions, setLongTermTransactions] = useState<LongTermTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notepadContent, setNotepadContent] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    return loadData(STORAGE_KEYS.APP_THEME, AVAILABLE_THEMES[0]);
  });
  
  const [cdiRate, setCdiRate] = useState<number>(11.25); 

  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- REFS FOR CHANGE DETECTION (PREVENT WRITE-ON-LOAD) ---
  const prevTransactionsRef = useRef<string>('');
  const prevAccountsRef = useRef<string>('');
  const prevInvestmentsRef = useRef<string>('');
  const prevLongTermRef = useRef<string>('');
  const prevNotificationsRef = useRef<string>('');
  const prevProfileRef = useRef<string>('');
  const prevThemeRef = useRef<string>('');
  const prevMonthsRef = useRef<string>('');
  const prevNotepadRef = useRef<string>('');
  const prevCdiRef = useRef<number>(11.25);

  // --- SCROLL LOCK EFFECT ---
  useEffect(() => {
    const isAnyModalOpen = 
      isAddTransactionOpen || 
      isAddAccountOpen || 
      isCalculatorOpen || 
      isProfileModalOpen || 
      isNotepadOpen || 
      isCalendarOpen || 
      isNotificationOpen || 
      isAnalyticsOpen;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    isAddTransactionOpen, isAddAccountOpen, isCalculatorOpen, 
    isProfileModalOpen, isNotepadOpen, isCalendarOpen, 
    isNotificationOpen, isAnalyticsOpen
  ]);

  // --- DATA LOADING EFFECT (Supabase with LocalStorage Fallback) ---
  const loadLocalData = () => {
    const localTransactions = loadData(STORAGE_KEYS.TRANSACTIONS, []);
    const localAccounts = loadData(STORAGE_KEYS.ACCOUNTS, []);
    const localInvestments = loadData(STORAGE_KEYS.INVESTMENTS, []);
    const localLongTerm = loadData(STORAGE_KEYS.LONG_TERM_TRANSACTIONS, []);
    const localNotifications = loadData(STORAGE_KEYS.NOTIFICATIONS, []);
    const localProfile = loadData(STORAGE_KEYS.USER_PROFILE, INITIAL_PROFILE);
    const localMonths = loadData(STORAGE_KEYS.MONTHS, [SYSTEM_INITIAL_MONTH]);
    const localNotepad = loadData(STORAGE_KEYS.NOTEPAD_CONTENT, '');
    const localCdi = loadData(STORAGE_KEYS.CDI_RATE, 11.25);

    applyData({
      profile: localProfile,
      transactions: localTransactions,
      accounts: localAccounts,
      investments: localInvestments,
      longTerm: localLongTerm,
      notifications: localNotifications,
      months: localMonths,
      notepadContent: localNotepad,
      cdiRate: localCdi
    });
  };

  useEffect(() => {
    if (currentUserEmail) {
      setIsLoadingData(true);

      // CRITICAL: Check if we have pending syncs (Local data is newer than Cloud)
      const isSyncDirty = loadData(STORAGE_KEYS.IS_SYNC_DIRTY, false);

      if (isSyncDirty) {
        console.log("Local changes pending (Quota/Network Error). Loading from LocalStorage to prevent overwrite.");
        loadLocalData();
        // Allow the useEffect save hooks to eventually sync this when they run
        setIsLoadingData(false);
      } else {
        loadUserData(currentUserEmail)
          .then((data) => {
            if (data) {
              applyData(data);
            } else {
              console.log("No remote data found, starting fresh.");
              loadLocalData(); // Try local if remote is empty
            }
          })
          .catch(err => {
            console.error("Error loading data from Cloud, using LocalStorage fallback:", err);
            loadLocalData();
            // If cloud failed (e.g. Quota), mark as dirty so we trust LocalStorage next load
            saveData(STORAGE_KEYS.IS_SYNC_DIRTY, true);
          })
          .finally(() => setIsLoadingData(false));
      }
    } else {
      setTransactions([]);
      setAccounts([]);
      setMonths([SYSTEM_INITIAL_MONTH]);
      setUserProfile(INITIAL_PROFILE);
    }
  }, [currentUserEmail]);

  // --- REALTIME SUBSCRIPTION EFFECT (NOVO) ---
  useEffect(() => {
    if (!currentUserEmail) return;

    console.log("Iniciando escuta Realtime para:", currentUserEmail);
    const unsubscribe = subscribeToUserChanges(currentUserEmail, (newData) => {
      console.log('Atualização Realtime Recebida!', newData);
      // Atualiza o estado da tela, mas NÃO dispara o salvamento (loop)
      // pois o applyData atualiza os 'Refs' de controle
      applyData(newData);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserEmail]);

  const applyData = (data: any) => {
      if (data.profile) {
        setUserProfile(data.profile);
        prevProfileRef.current = JSON.stringify(data.profile);
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
      
      if (data.notepadContent) {
        setNotepadContent(data.notepadContent);
        prevNotepadRef.current = data.notepadContent;
      }

      if (data.months && data.months.length > 0) {
        const sorted = sortMonths(data.months);
        setMonths(sorted);
        // Only set active month if not already set, or if it's initial load
        if (activeMonthId === SYSTEM_INITIAL_MONTH.id || activeMonthId === '1') {
           setActiveMonthId(sorted[sorted.length - 1].id);
        }
        prevMonthsRef.current = JSON.stringify(sorted);
      } else {
        setMonths([SYSTEM_INITIAL_MONTH]);
        setActiveMonthId(SYSTEM_INITIAL_MONTH.id);
        prevMonthsRef.current = JSON.stringify([SYSTEM_INITIAL_MONTH]);
      }
      
      if (data.cdiRate !== undefined) {
        setCdiRate(data.cdiRate);
        prevCdiRef.current = data.cdiRate;
      }
  };

  // --- SAVING EFFECTS WITH DEBOUNCE (Supabase + LocalStorage) ---
  const DEBOUNCE_DELAY = 1500;

  // Helper to handle Sync Status
  const handleSyncResult = (success: boolean) => {
    if (success) {
      saveData(STORAGE_KEYS.IS_SYNC_DIRTY, false);
    } else {
      // If save failed (e.g. Quota), mark as dirty so we trust LocalStorage next load
      saveData(STORAGE_KEYS.IS_SYNC_DIRTY, true);
    }
  };

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(transactions);
      
      if (currentStr !== prevTransactionsRef.current) {
        saveData(STORAGE_KEYS.TRANSACTIONS, transactions);
        
        const timer = setTimeout(async () => {
          const success = await saveCollection(currentUserEmail, "transactions", transactions);
          handleSyncResult(success);
          prevTransactionsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [transactions, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(accounts);
      
      if (currentStr !== prevAccountsRef.current) {
        saveData(STORAGE_KEYS.ACCOUNTS, accounts);
        
        const timer = setTimeout(async () => {
          const success = await saveCollection(currentUserEmail, "accounts", accounts);
          handleSyncResult(success);
          prevAccountsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [accounts, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(investments);
      
      if (currentStr !== prevInvestmentsRef.current) {
        saveData(STORAGE_KEYS.INVESTMENTS, investments);
        
        const timer = setTimeout(async () => {
          const success = await saveCollection(currentUserEmail, "investments", investments);
          handleSyncResult(success);
          prevInvestmentsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [investments, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(longTermTransactions);
      
      if (currentStr !== prevLongTermRef.current) {
        saveData(STORAGE_KEYS.LONG_TERM_TRANSACTIONS, longTermTransactions);
        
        const timer = setTimeout(async () => {
          const success = await saveCollection(currentUserEmail, "longTerm", longTermTransactions);
          handleSyncResult(success);
          prevLongTermRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [longTermTransactions, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(notifications);

      if (currentStr !== prevNotificationsRef.current) {
        saveData(STORAGE_KEYS.NOTIFICATIONS, notifications);
        
        const timer = setTimeout(async () => {
          const success = await saveCollection(currentUserEmail, "notifications", notifications);
          handleSyncResult(success);
          prevNotificationsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(userProfile);

      if (currentStr !== prevProfileRef.current) {
        saveData(STORAGE_KEYS.USER_PROFILE, userProfile);
        
        const timer = setTimeout(async () => {
           const success = await saveUserField(currentUserEmail, "profile", userProfile);
           handleSyncResult(success);
           prevProfileRef.current = currentStr;
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [userProfile, currentUserEmail, isLoadingData]);

  // THEME EFFECT
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', appTheme.primary);
    root.style.setProperty('--color-accent-dark', appTheme.secondary);
    
    saveData(STORAGE_KEYS.APP_THEME, appTheme);

    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(appTheme);
      if (currentStr !== prevThemeRef.current) {
        saveUserField(currentUserEmail, "theme", appTheme);
        prevThemeRef.current = currentStr;
      }
    }
  }, [appTheme, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
       const currentStr = JSON.stringify(months);
       
       if (currentStr !== prevMonthsRef.current) {
         saveData(STORAGE_KEYS.MONTHS, months);
         
         const timer = setTimeout(async () => {
           const success = await saveUserField(currentUserEmail, "months", months);
           handleSyncResult(success);
           prevMonthsRef.current = currentStr;
         }, 1000);
         return () => clearTimeout(timer);
       }
    }
  }, [months, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      if (notepadContent !== prevNotepadRef.current) {
        saveData(STORAGE_KEYS.NOTEPAD_CONTENT, notepadContent);
        
        const timer = setTimeout(async () => {
          const success = await saveUserField(currentUserEmail, "notepadContent", notepadContent);
          handleSyncResult(success);
          prevNotepadRef.current = notepadContent;
        }, 2000); 
        return () => clearTimeout(timer);
      }
    }
  }, [notepadContent, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      if (cdiRate !== prevCdiRef.current) {
        saveData(STORAGE_KEYS.CDI_RATE, cdiRate);
        saveUserField(currentUserEmail, "cdiRate", cdiRate);
        prevCdiRef.current = cdiRate;
      }
    }
  }, [cdiRate, currentUserEmail, isLoadingData]);

   // --- FILTER TRANSACTIONS BY ACTIVE MONTH ---
  const activeMonthSummary = months.find(m => m.id === activeMonthId) || months[0];
  
  const filteredTransactions = useMemo(() => {
    if (!activeMonthSummary) return [];
    
    return transactions.filter(tx => {
      const txMonth = tx.month || getMonthFromDateStr(tx.date);
      const txYear = tx.year || getYearFromDateStr(tx.date, activeMonthSummary.year);
      
      return txMonth === activeMonthSummary.month && txYear === activeMonthSummary.year;
    });
  }, [transactions, activeMonthSummary]);

  // --- FILTER ACCOUNTS BY ACTIVE MONTH ---
  const filteredAccounts = useMemo(() => {
    if (!activeMonthSummary) return [];

    return accounts.filter(acc => {
      if (!acc.month && !acc.year) return true;
      return acc.month === activeMonthSummary.month && acc.year === activeMonthSummary.year;
    });
  }, [accounts, activeMonthSummary]);

  // --- PROFIT CALCULATION LOGIC ---
  const profitBalance = useMemo(() => {
    const totalAccounts = filteredAccounts.reduce((acc, account) => acc + account.balance, 0);
    const totalExpenses = filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    return totalAccounts - totalExpenses;
  }, [filteredAccounts, filteredTransactions]);

  // --- AUTOMATIC NOTIFICATION LOGIC ---
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
          const parts = tx.date.split(' ');
          // Handle "08 Dez" style
          if (parts.length >= 2 && !tx.date.includes('-')) {
             const day = parseInt(parts[0]);
             const monthStr = parts[1].toLowerCase().slice(0, 3);
             const monthsMap: {[key: string]: number} = {
                 'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                 'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
             };
             if (monthsMap[monthStr] !== undefined && !isNaN(day)) {
                if (day === today.getDate() && monthsMap[monthStr] === today.getMonth()) {
                  isDueToday = true;
                }
             }
          }
          // Handle "2025-12-08" style
          else if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
             const d = new Date(tx.date.split(' ')[0] + 'T00:00:00');
             if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
                isDueToday = true;
             }
          }
        }
        if (isDueToday) {
           const alreadyNotified = notifications.some(n => n.message.includes(tx.name) && n.date === new Date().toLocaleDateString('pt-BR'));
           if (!alreadyNotified) {
             newNotifications.push({
               id: Date.now().toString() + Math.random(),
               title: 'Vencimento Hoje!',
               message: `A conta ${tx.name} no valor de R$ ${tx.amount} vence hoje.`,
               date: new Date().toLocaleDateString('pt-BR'),
               read: false,
               type: 'alert'
             });

             // System Notification - Updated for Android Status Bar compatibility
             if ('Notification' in window && Notification.permission === 'granted') {
               try {
                 const iconUrl = 'https://api.dicebear.com/9.x/shapes/png?seed=FlowFinance&backgroundColor=0a0a0b';
                 const options: any = {
                   body: `A conta ${tx.name} vence hoje. Valor: R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                   icon: iconUrl,
                   tag: `flow-finance-bill-${tx.id}`, 
                   requireInteraction: true,
                   vibrate: [200, 100, 200]
                 };

                 if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('./sw.js').then(async () => {
                       const reg = await navigator.serviceWorker.ready;
                       reg.showNotification('Conta Vencendo Hoje! 💸', options);
                    }).catch(err => console.log('SW Notification failed (preview mode):', err));
                 } else {
                    new Notification('Conta Vencendo Hoje! 💸', options);
                 }
                 
               } catch (e) { console.warn("Notification failed", e); }
             }
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

  // --- Handlers ---
  
  const handleLogin = async (email: string, name?: string) => {
    try {
      // REQUEST PERMISSION IMMEDIATELY ON LOGIN/REGISTER CLICK
      let permissionGranted = false;
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          permissionGranted = permission === 'granted';
        } else if (Notification.permission === 'granted') {
          permissionGranted = true;
        }
      }

      // Perform Auth
      if (name) {
        // Registration Mode
        await registerUser(email, name, {
          months: [SYSTEM_INITIAL_MONTH],
          cdiRate: 11.25
        });
      } else {
        // Login Mode
        await loginUser(email);
      }
      
      // If success, set session
      saveData(STORAGE_KEYS.USER_SESSION, email);
      setCurrentUserEmail(email);

      // AUTOMATIC PUSH SUBSCRIPTION AFTER LOGIN (If permission granted)
      if (permissionGranted && 'serviceWorker' in navigator) {
         try {
             const registration = await navigator.serviceWorker.ready;
             let subscription = await registration.pushManager.getSubscription();
             
             if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
             }

             if (subscription) {
                const subscriptionJson = JSON.parse(JSON.stringify(subscription));
                await saveUserField(email, 'pushSubscription', subscriptionJson);
             }
         } catch (e) {
             console.log('Background subscription silently failed (likely preview env)', e);
         }
      }

    } catch (error) {
       console.error("Login sequence failed:", error);
       throw error; 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    setCurrentUserEmail(null);
    setIsProfileModalOpen(false);
  };

  const handleOpenProfile = () => setIsProfileModalOpen(true);
  const handleOpenAddTransaction = () => setIsAddTransactionOpen(true);
  const handleOpenAddAccount = () => setIsAddAccountOpen(true);
  const handleOpenCalculator = () => setIsCalculatorOpen(true);
  const handleOpenNotepad = () => setIsNotepadOpen(true);
  const handleOpenCalendar = () => setIsCalendarOpen(true);
  const handleOpenNotification = () => setIsNotificationOpen(true);

  // Close Handlers
  const handleCloseAddTransaction = () => {
    setIsAddTransactionOpen(false);
    setEditingTransaction(null);
  };
  const handleCloseAddAccount = () => {
    setIsAddAccountOpen(false);
    setEditingAccount(null);
  };
  const handleCloseCalculator = () => setIsCalculatorOpen(false);
  const handleCloseProfile = () => setIsProfileModalOpen(false);
  const handleCloseNotepad = () => setIsNotepadOpen(false);
  const handleCloseCalendar = () => setIsCalendarOpen(false);
  const handleCloseNotification = () => setIsNotificationOpen(false);
  const handleCloseAnalytics = () => setIsAnalyticsOpen(false);

  // --- DUPLICATE MONTH LOGIC ---
  const handleDuplicateMonth = () => {
    const currentSummary = activeMonthSummary;
    if (!currentSummary) return;

    const currentMonthIndex = MONTH_NAMES.indexOf(currentSummary.month);
    const currentYearInt = parseInt(currentSummary.year);

    let nextMonthIndex = currentMonthIndex + 1;
    let nextYearInt = currentYearInt;

    if (nextMonthIndex > 11) {
      nextMonthIndex = 0;
      nextYearInt++;
    }

    const nextMonthName = MONTH_NAMES[nextMonthIndex];
    const nextShortCode = MONTH_SHORT_CODES[nextMonthName];

    const exists = months.find(m => m.month === nextMonthName && m.year === nextYearInt.toString());
    if (exists) {
      alert(`O mês de ${nextMonthName} de ${nextYearInt} já existe!`);
      return;
    }

    // Create duplicate transactions for the next month
    const newTxs: Transaction[] = filteredTransactions.map(tx => {
       let newDateStr = '';
       const parts = tx.date.split(' ');
       
       if (parts.length >= 2 && !tx.date.toLowerCase().includes('hoje') && !tx.date.includes('-')) {
          const day = parts[0];
          newDateStr = `${day} ${nextShortCode}`;
       } 
       else if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
           const d = new Date(tx.date.split(' ')[0] + 'T00:00:00');
           d.setMonth(d.getMonth() + 1); 
           newDateStr = d.toISOString().split('T')[0];
       }
       else {
          newDateStr = `01 ${nextShortCode}`;
       }

       return {
         ...tx,
         id: Date.now().toString() + Math.random(),
         date: newDateStr,
         paid: false,
         month: nextMonthName, 
         year: nextYearInt.toString()
       };
    });

    const newAccounts: Account[] = filteredAccounts.map(acc => ({
       ...acc,
       id: Date.now().toString() + Math.random(),
       month: nextMonthName,
       year: nextYearInt.toString()
    }));

    const newMonthTotal = newTxs.reduce((acc, t) => acc + t.amount, 0);

    const newMonthSummary: MonthSummary = {
      id: Date.now().toString(),
      month: nextMonthName,
      year: nextYearInt.toString(),
      total: newMonthTotal
    };

    const newMonthsList = [...months, newMonthSummary];
    setMonths(sortMonths(newMonthsList));
    setTransactions(prev => [...newTxs, ...prev]); 
    setAccounts(prev => [...prev, ...newAccounts]);
    setActiveMonthId(newMonthSummary.id);
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id ? { ...t, ...txData } : t
      ));
      
      const oldMonth = editingTransaction.month || getMonthFromDateStr(editingTransaction.date);
      const oldYear = editingTransaction.year || getYearFromDateStr(editingTransaction.date, activeMonthSummary.year);
      
      setMonths(prev => {
        const updated = prev.map(m => {
          if (m.month === oldMonth && m.year === oldYear) {
             return { ...m, total: m.total - editingTransaction.amount + txData.amount };
          }
          return m;
        });
        return updated;
      });
      setEditingTransaction(null);

    } else {
      const newTx: Transaction = {
        id: Date.now().toString(),
        ...txData,
        month: activeMonthSummary.month,
        year: activeMonthSummary.year
      };

      setTransactions(prev => [newTx, ...prev]);
      
      setMonths(prev => prev.map(m => {
        if (m.month === activeMonthSummary.month && m.year === activeMonthSummary.year) {
          return { ...m, total: m.total + newTx.amount };
        }
        return m;
      }));
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      const txMonth = tx.month || getMonthFromDateStr(tx.date);
      const txYear = tx.year || getYearFromDateStr(tx.date, activeMonthSummary.year);

      setMonths(prev => prev.map(m => {
        if (m.month === txMonth && m.year === txYear) {
          return { ...m, total: m.total - tx.amount };
        }
        return m;
      }));
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddTransactionOpen(true);
  };

  const handleToggleTransactionStatus = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, paid: !t.paid } : t
    ));
  };

  const handleTogglePaymentMethod = (id: string) => {
    setTransactions(prev => prev.map(t => 
       t.id === id ? { ...t, paymentMethod: t.paymentMethod === 'pix' ? 'card' : 'pix' } : t
    ));
  };

  const handleSelectMonth = (id: string) => {
    setActiveMonthId(id);
  };

  const handleDeleteMonth = (id: string) => {
    if (months.length <= 1) return;
    
    const monthToDelete = months.find(m => m.id === id);
    if (!monthToDelete) return;

    setTransactions(prev => prev.filter(tx => {
      const txMonth = tx.month || getMonthFromDateStr(tx.date);
      const txYear = tx.year || getYearFromDateStr(tx.date, monthToDelete.year);
      return !(txMonth === monthToDelete.month && txYear === monthToDelete.year);
    }));

    setAccounts(prev => prev.filter(acc => {
       if (!acc.month) return true;
       return !(acc.month === monthToDelete.month && acc.year === monthToDelete.year);
    }));

    const newMonths = months.filter(m => m.id !== id);
    setMonths(newMonths);
    setActiveMonthId(newMonths[newMonths.length - 1].id);
  };

  const handleContactClick = (contact: Contact) => {
    if (contact.id === '1') {
      setIsNotepadOpen(true);
    } else if (contact.id === '2') {
      setIsCalendarOpen(true);
    } else if (contact.id === '3') {
      setIsAnalyticsOpen(true);
    }
  };

  const handleSaveAccount = (name: string, balance: number, theme: CardTheme) => {
    if (editingAccount) {
      setAccounts(prev => prev.map(acc => 
        acc.id === editingAccount.id ? { 
           ...acc, 
           name, 
           balance, 
           colorTheme: theme,
           month: acc.month || activeMonthSummary?.month,
           year: acc.year || activeMonthSummary?.year
        } : acc
      ));
      setEditingAccount(null);
    } else {
      const newAccount: Account = {
        id: Date.now().toString(),
        name,
        balance,
        colorTheme: theme,
        month: activeMonthSummary?.month,
        year: activeMonthSummary?.year
      };
      setAccounts(prev => [...prev, newAccount]);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAddAccountOpen(true);
  };

  const activeMonthContext = useMemo(() => {
     if (!activeMonthSummary) return undefined;
     return {
       monthIndex: MONTH_NAMES.indexOf(activeMonthSummary.month),
       year: parseInt(activeMonthSummary.year)
     };
  }, [activeMonthSummary]);

  // --- VIEW RENDERER ---
  const renderView = () => {
    switch(currentView) {
      case 'settings':
        return (
          <SettingsView 
            currentThemeId={appTheme.id}
            onSaveTheme={(theme) => {
              setAppTheme(theme);
              setCurrentView('home');
            }}
          />
        );
      case 'long-term':
        return (
          <LongTermView 
            items={longTermTransactions}
            onAdd={(item) => setLongTermTransactions(prev => [...prev, { ...item, id: Date.now().toString(), installmentsPaid: 0 }])}
            onEdit={(item) => setLongTermTransactions(prev => prev.map(i => i.id === item.id ? item : i))}
            onDelete={(id) => setLongTermTransactions(prev => prev.filter(i => i.id !== id))}
          />
        );
      case 'investments':
        return (
          <InvestmentsView 
             investments={investments}
             onAdd={(inv) => setInvestments(prev => [...prev, { ...inv, id: Date.now().toString() }])}
             onEdit={(inv) => setInvestments(prev => prev.map(i => i.id === inv.id ? inv : i))}
             onDelete={(id) => setInvestments(prev => prev.filter(i => i.id !== id))}
             onBack={() => setCurrentView('home')}
             cdiRate={cdiRate}
             onUpdateCdiRate={setCdiRate}
          />
        );
      case 'home':
      default:
        return (
          <>
            {/* Header / Profile Row */}
            <div className="flex justify-between items-center mb-6 pl-1">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={handleOpenProfile}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-accent transition-all overflow-hidden shadow-lg shadow-black/20">
                     <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Bem vindo,</span>
                  <h1 className="text-white text-xl font-bold leading-none">{userProfile.name || 'Usuário'}</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <IconBell count={notifications.filter(n => !n.read).length} onClick={handleOpenNotification} />
              </div>
            </div>

            {/* Main Balance Card */}
            <div className="mb-6">
              <BalanceCard 
                balance={profitBalance} 
                onAddClick={handleOpenAddTransaction}
                onDuplicateClick={handleDuplicateMonth}
                onCalculatorClick={handleOpenCalculator}
              />
            </div>

            {/* Secondary Cards (Accounts) */}
            <div className="mb-0">
               <div className="flex justify-between items-center mb-3 pl-1">
                 <h2 className="text-xl font-medium text-gray-400">FONTES DE RENDA</h2>
               </div>
               
               {filteredAccounts.length === 0 ? (
                 <div className="w-full h-32" />
               ) : (
                 filteredAccounts.map(acc => (
                   <SecondaryCard 
                     key={acc.id} 
                     account={acc} 
                     onDelete={handleDeleteAccount}
                     onEdit={handleEditAccount}
                   />
                 ))
               )}
            </div>

            <ContactsRow 
               contacts={MOCK_CONTACTS} 
               onAddClick={handleOpenAddAccount}
               onContactClick={handleContactClick}
            />

            <TransactionSummary 
              months={months}
              activeMonthId={activeMonthId}
              onSelectMonth={handleSelectMonth}
              onDeleteMonth={handleDeleteMonth}
            />

            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              onToggleStatus={handleToggleTransactionStatus}
              onTogglePaymentMethod={handleTogglePaymentMethod}
            />
          </>
        );
    }
  };

  // --- CSS VARIABLES ---
  if (!currentUserEmail) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Initial Loading State
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium animate-pulse">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-[100dvh] bg-[#0a0a0b] text-white px-2 pt-4 pb-24 font-sans selection:bg-accent selection:text-black"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      {renderView()}

      <BottomNav 
        currentView={currentView} 
        onChangeView={setCurrentView} 
      />

      <AddTransactionModal 
        isOpen={isAddTransactionOpen} 
        onClose={handleCloseAddTransaction} 
        onSave={handleSaveTransaction}
        transactionToEdit={editingTransaction}
        activeMonthContext={activeMonthContext}
      />
      
      <AddAccountModal 
        isOpen={isAddAccountOpen} 
        onClose={handleCloseAddAccount} 
        onSave={handleSaveAccount}
        accountToEdit={editingAccount}
      />

      <CalculatorModal 
        isOpen={isCalculatorOpen} 
        onClose={handleCloseCalculator} 
      />

      <EditProfileModal 
         isOpen={isProfileModalOpen}
         onClose={handleCloseProfile}
         onSave={(p) => setUserProfile(p)}
         onLogout={handleLogout}
         currentProfile={userProfile}
      />

      <NotepadModal 
        isOpen={isNotepadOpen}
        onClose={handleCloseNotepad}
        initialContent={notepadContent}
        onSave={(content) => setNotepadContent(content)}
      />

      <CalendarModal 
         isOpen={isCalendarOpen}
         onClose={handleCloseCalendar}
         transactions={transactions}
         activeMonthContext={activeMonthContext}
      />

      <NotificationModal 
        isOpen={isNotificationOpen}
        onClose={handleCloseNotification}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onDelete={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
        currentUserEmail={currentUserEmail}
      />

      <AnalyticsModal 
         isOpen={isAnalyticsOpen}
         onClose={handleCloseAnalytics}
         transactions={transactions}
         months={months}
      />
    </div>
  );
};

export default App;
