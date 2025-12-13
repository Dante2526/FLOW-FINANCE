
import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
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
// AnalyticsModal is heavy (Recharts), so we lazy load it
// import AnalyticsModal from './components/AnalyticsModal';
import SettingsView, { AVAILABLE_THEMES } from './components/SettingsView';
import LongTermView from './components/LongTermView';
import InvestmentsView from './components/InvestmentsView';
import LoginScreen, { FlowLogo } from './components/LoginScreen';
import ProModal from './components/ProModal'; 
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppTheme, AppView, LongTermTransaction, Investment, AppNotification } from './types';
import { loadData, saveData, STORAGE_KEYS } from './services/storage';
import { IconBell, IconMore } from './components/Icons';
import { Crown, Loader2 } from 'lucide-react';

// Supabase Services (Simplified)
import { loginUser, registerUser, loadUserData, saveCollection, saveUserField, subscribeToUserChanges, deleteUser, supabase, VAPID_PUBLIC_KEY } from './services/supabase';

// Lazy Load Heavy Components
const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal'));

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
  { id: '1', name: 'Notas', imageUrl: '' }, 
  { id: '2', name: 'Calendário', imageUrl: '' }, 
  { id: '3', name: 'Análise', imageUrl: '' }, 
];

// Initial Profile
const INITIAL_PROFILE: UserProfile = {
  name: '',
  subtitle: '',
  avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
  isPro: false
};

// Helper: Parse Date String to determine month
const getMonthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return '';
  
  if (dateStr.toLowerCase().includes('hoje')) {
    return MONTH_NAMES[new Date().getMonth()];
  }

  const parts = dateStr.split(' ');
  if (parts.length >= 2 && !dateStr.includes('-')) {
    const code = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase(); 
    return SHORT_CODE_TO_FULL[code] || '';
  }

  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(dateStr.split(' ')[0] + 'T00:00:00');
    return MONTH_NAMES[d.getMonth()];
  }

  return '';
};

// Helper: Get Year from Date String
const getYearFromDateStr = (dateStr: string, activeYearContext?: string): string => {
  if (dateStr.toLowerCase().includes('hoje')) return new Date().getFullYear().toString();
  
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr.split('-')[0];
  
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

// --- SPLASH SCREEN COMPONENT ---
// Updated to mimic native Android Splash (Icon inside Dark Grey Squircle)
const SplashScreen = () => (
  <div className="fixed inset-0 bg-[#0a0a0b] flex items-center justify-center z-[100] animate-out fade-out duration-700">
    <div className="w-32 h-32 bg-[#1c1c1e] rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-black/20">
       <FlowLogo className="w-24 h-24 text-accent" />
    </div>
  </div>
);

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return loadData(STORAGE_KEYS.USER_SESSION, null);
  });
  
  // Initialize isLoadingData to TRUE if we have a session stored.
  // This prevents the app from rendering the default state for a split second before fetching starts.
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
     return !!loadData(STORAGE_KEYS.USER_SESSION, null);
  });

  // NEW: Track if Supabase session has been checked/restored
  const [isSessionReady, setIsSessionReady] = useState(false);

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
  const [isProModalOpen, setIsProModalOpen] = useState(false); 
  
  // --- DATA STATES (Initialized EMPTY for Realtime DB Source) ---
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [months, setMonths] = useState<MonthSummary[]>([SYSTEM_INITIAL_MONTH]);
  const [longTermTransactions, setLongTermTransactions] = useState<LongTermTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notepadContent, setNotepadContent] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [cdiRate, setCdiRate] = useState<number>(11.25);

  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    return loadData(STORAGE_KEYS.APP_THEME, AVAILABLE_THEMES[0]);
  });
  
  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- DRAG AND DROP REFS ---
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  // --- REFS FOR CHANGE DETECTION (PREVENT WRITE-ON-LOAD) ---
  const prevTransactionsRef = useRef<string>(JSON.stringify(transactions));
  const prevAccountsRef = useRef<string>(JSON.stringify(accounts));
  const prevInvestmentsRef = useRef<string>(JSON.stringify(investments));
  const prevLongTermRef = useRef<string>(JSON.stringify(longTermTransactions));
  const prevNotificationsRef = useRef<string>(JSON.stringify(notifications));
  const prevProfileRef = useRef<string>(JSON.stringify(userProfile));
  const prevThemeRef = useRef<string>(JSON.stringify(appTheme));
  const prevMonthsRef = useRef<string>(JSON.stringify(months));
  const prevNotepadRef = useRef<string>(notepadContent);
  const prevCdiRef = useRef<number>(cdiRate);

  // --- CURRENT STATE REFS FOR REALTIME PROTECTION ---
  const currentStateRef = useRef({
    transactions,
    accounts,
    investments,
    longTermTransactions,
    notifications,
    userProfile,
    appTheme,
    months,
    notepadContent,
    cdiRate
  });

  // Update current state ref on every render
  useEffect(() => {
    currentStateRef.current = {
      transactions,
      accounts,
      investments,
      longTermTransactions,
      notifications,
      userProfile,
      appTheme,
      months,
      notepadContent,
      cdiRate
    };
  });

  // --- INITIALIZE ACTIVE MONTH ID BASED ON LOADED MONTHS ---
  useEffect(() => {
    // Only run once on mount if we haven't set a meaningful ID yet
    if (activeMonthId === SYSTEM_INITIAL_MONTH.id && months.length > 0) {
       const sorted = sortMonths(months);
       if (sorted.length > 0) {
          setActiveMonthId(sorted[sorted.length - 1].id);
       }
    }
  }, []); // Run once on mount

  // --- AUTH CHECK EFFECT (Fixes RLS issues) ---
  useEffect(() => {
    const initAuth = async () => {
      // Check for active session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
        saveData(STORAGE_KEYS.USER_SESSION, session.user.email);
      }
      setIsSessionReady(true);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
       if (event === 'SIGNED_OUT') {
         setCurrentUserEmail(null);
         localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
         setIsSessionReady(true); 
       } else if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
          saveData(STORAGE_KEYS.USER_SESSION, session.user.email);
          setIsSessionReady(true);
       }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      isAnalyticsOpen ||
      isProModalOpen;

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
    isNotificationOpen, isAnalyticsOpen, isProModalOpen
  ]);

  // --- DATA LOADING EFFECT (Pure Cloud) ---
  useEffect(() => {
    // Only proceed if we have an email AND session check is complete
    if (!currentUserEmail || !isSessionReady) return;

    setIsLoadingData(true);

    loadUserData(currentUserEmail)
      .then((data) => {
        if (data) {
          applyData(data);
        }
      })
      .catch(err => {
        console.error("Error loading data from Cloud:", err);
      })
      .finally(() => setIsLoadingData(false));
  }, [currentUserEmail, isSessionReady]);

  // --- REALTIME SUBSCRIPTION EFFECT ---
  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;

    const unsubscribe = subscribeToUserChanges(currentUserEmail, (newData) => {
      applyDataSafe(newData);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUserEmail, isSessionReady]);

  // --- VISIBILITY REFRESH EFFECT (Mobile Background Fix) ---
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && currentUserEmail) {
        // Force refresh when app returns to foreground
        // This handles cases where WebSocket might have disconnected in background
        loadUserData(currentUserEmail)
          .then((data) => {
            if (data) {
              applyDataSafe(data);
            }
          })
          .catch(err => console.error("Auto-refresh failed", err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUserEmail]);

  const applyData = (data: any) => {
      if (data.profile) {
        let profile = data.profile;
        if (profile.isPro && profile.subscriptionExpiry) {
           const expiryDate = new Date(profile.subscriptionExpiry);
           const now = new Date();
           if (now > expiryDate) {
              profile = { ...profile, isPro: false, subscriptionExpiry: undefined };
              if (currentUserEmail) {
                  saveUserField(currentUserEmail, "profile", profile); 
              }
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
      
      if (data.notepadContent) {
        setNotepadContent(data.notepadContent);
        prevNotepadRef.current = data.notepadContent;
      }

      if (data.months && data.months.length > 0) {
        const sorted = sortMonths(data.months);
        setMonths(sorted);
        // Only switch active month if we are currently on the default/system one
        if (activeMonthId === SYSTEM_INITIAL_MONTH.id || activeMonthId === '1') {
           setActiveMonthId(sorted[sorted.length - 1].id);
        }
        prevMonthsRef.current = JSON.stringify(sorted);
      }
      
      if (data.cdiRate !== undefined) {
        setCdiRate(data.cdiRate);
        prevCdiRef.current = data.cdiRate;
      }
  };

  // Safe apply function for Realtime updates
  // NOTE: We update prev...Ref here to signify that this state change
  // came from the server, so the Save Effects should skip sending it back.
  const applyDataSafe = (data: any) => {
      const currentTxStr = JSON.stringify(currentStateRef.current.transactions);
      if (currentTxStr === prevTransactionsRef.current) {
        if (data.transactions && JSON.stringify(data.transactions) !== currentTxStr) {
           setTransactions(data.transactions);
           prevTransactionsRef.current = JSON.stringify(data.transactions);
        }
      }

      const currentAccStr = JSON.stringify(currentStateRef.current.accounts);
      if (currentAccStr === prevAccountsRef.current) {
         if (data.accounts && JSON.stringify(data.accounts) !== currentAccStr) {
            setAccounts(data.accounts);
            prevAccountsRef.current = JSON.stringify(data.accounts);
         }
      }

      if (currentStateRef.current.notepadContent === prevNotepadRef.current) {
         if (data.notepadContent !== undefined && data.notepadContent !== currentStateRef.current.notepadContent) {
            setNotepadContent(data.notepadContent);
            prevNotepadRef.current = data.notepadContent;
         }
      }

      const currentInvStr = JSON.stringify(currentStateRef.current.investments);
      if (currentInvStr === prevInvestmentsRef.current) {
         if (data.investments && JSON.stringify(data.investments) !== currentInvStr) {
            setInvestments(data.investments);
            prevInvestmentsRef.current = JSON.stringify(data.investments);
         }
      }

      const currentLTStr = JSON.stringify(currentStateRef.current.longTermTransactions);
      if (currentLTStr === prevLongTermRef.current) {
         if (data.longTerm && JSON.stringify(data.longTerm) !== currentLTStr) {
            setLongTermTransactions(data.longTerm);
            prevLongTermRef.current = JSON.stringify(data.longTerm);
         }
      }

      const currentProfileStr = JSON.stringify(currentStateRef.current.userProfile);
      if (currentProfileStr === prevProfileRef.current) {
         if (data.profile && JSON.stringify(data.profile) !== currentProfileStr) {
             let profile = data.profile;
             if (profile.isPro && profile.subscriptionExpiry) {
                 const expiryDate = new Date(profile.subscriptionExpiry);
                 const now = new Date();
                 if (now > expiryDate) {
                    profile = { ...profile, isPro: false, subscriptionExpiry: undefined };
                 }
             }
             setUserProfile(profile);
             prevProfileRef.current = JSON.stringify(profile);
         }
      }

      const currentThemeStr = JSON.stringify(currentStateRef.current.appTheme);
      if (currentThemeStr === prevThemeRef.current) {
         if (data.theme && JSON.stringify(data.theme) !== currentThemeStr) {
             setAppTheme(data.theme);
             saveData(STORAGE_KEYS.APP_THEME, data.theme);
             prevThemeRef.current = JSON.stringify(data.theme);
         }
      }

      const currentMonthsStr = JSON.stringify(currentStateRef.current.months);
      if (currentMonthsStr === prevMonthsRef.current) {
         if (data.months && JSON.stringify(data.months) !== currentMonthsStr) {
             const sorted = sortMonths(data.months);
             setMonths(sorted);
             prevMonthsRef.current = JSON.stringify(sorted);
         }
      }
      
      const currentNotifStr = JSON.stringify(currentStateRef.current.notifications);
      if (currentNotifStr === prevNotificationsRef.current) {
         if (data.notifications && JSON.stringify(data.notifications) !== currentNotifStr) {
             setNotifications(data.notifications);
             prevNotificationsRef.current = JSON.stringify(data.notifications);
         }
      }
      
      if (currentStateRef.current.cdiRate === prevCdiRef.current) {
         if (data.cdiRate !== undefined && data.cdiRate !== currentStateRef.current.cdiRate) {
             setCdiRate(data.cdiRate);
             prevCdiRef.current = data.cdiRate;
         }
      }
  };

  // --- SAVING EFFECTS WITH DEBOUNCE (NO LOCAL STORAGE FOR DATA) ---
  const DEBOUNCE_DELAY = 1500;

  // Transactions Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(transactions);
      // Only sync if current state is different from the last known synced state
      if (currentStr !== prevTransactionsRef.current) {
        const timer = setTimeout(async () => {
          await saveCollection(currentUserEmail, "transactions", transactions);
          prevTransactionsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [transactions, currentUserEmail, isLoadingData]);

  // Accounts Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(accounts);
      if (currentStr !== prevAccountsRef.current) {
        const timer = setTimeout(async () => {
          await saveCollection(currentUserEmail, "accounts", accounts);
          prevAccountsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [accounts, currentUserEmail, isLoadingData]);

  // Investments Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(investments);
      if (currentStr !== prevInvestmentsRef.current) {
        const timer = setTimeout(async () => {
          await saveCollection(currentUserEmail, "investments", investments);
          prevInvestmentsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [investments, currentUserEmail, isLoadingData]);

  // Long Term Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(longTermTransactions);
      if (currentStr !== prevLongTermRef.current) {
        const timer = setTimeout(async () => {
          await saveCollection(currentUserEmail, "longTerm", longTermTransactions);
          prevLongTermRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [longTermTransactions, currentUserEmail, isLoadingData]);

  // Notifications Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(notifications);
      if (currentStr !== prevNotificationsRef.current) {
        const timer = setTimeout(async () => {
          await saveCollection(currentUserEmail, "notifications", notifications);
          prevNotificationsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, currentUserEmail, isLoadingData]);

  // User Profile Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(userProfile);
      if (currentStr !== prevProfileRef.current) {
        const timer = setTimeout(async () => {
           await saveUserField(currentUserEmail, "profile", userProfile);
           prevProfileRef.current = currentStr;
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [userProfile, currentUserEmail, isLoadingData]);

  // Theme Save (Still using local storage for UI preference)
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

  // Months Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
       const currentStr = JSON.stringify(months);
       if (currentStr !== prevMonthsRef.current) {
         const timer = setTimeout(async () => {
           await saveUserField(currentUserEmail, "months", months);
           prevMonthsRef.current = currentStr;
         }, 1000);
         return () => clearTimeout(timer);
       }
    }
  }, [months, currentUserEmail, isLoadingData]);

  // Notepad Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      if (notepadContent !== prevNotepadRef.current) {
        const timer = setTimeout(async () => {
          await saveUserField(currentUserEmail, "notepadContent", notepadContent);
          prevNotepadRef.current = notepadContent;
        }, 2000); 
        return () => clearTimeout(timer);
      }
    }
  }, [notepadContent, currentUserEmail, isLoadingData]);

  // CDI Save
  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      if (cdiRate !== prevCdiRef.current) {
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

  // --- PROFIT CALCULATION ---
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

             if ('Notification' in window && Notification.permission === 'granted') {
               try {
                 const iconUrl = window.location.origin + '/favicon.svg';
                 const badgeUrl = window.location.origin + '/notification-icon.svg';
                 
                 const options: any = {
                   body: `A conta ${tx.name} vence hoje. Valor: R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                   icon: iconUrl,
                   badge: badgeUrl,
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
      let permissionGranted = false;
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          permissionGranted = permission === 'granted';
        } else if (Notification.permission === 'granted') {
          permissionGranted = true;
        }
      }

      if (name) {
        await registerUser(email, name, {
          months: [SYSTEM_INITIAL_MONTH],
          cdiRate: 11.25
        });
      } else {
        await loginUser(email);
      }
      
      saveData(STORAGE_KEYS.USER_SESSION, email);
      saveData(STORAGE_KEYS.KNOWN_USER_EMAIL, email); // Mark as known user
      setCurrentUserEmail(email);

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

  const handleLogout = async () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    await supabase.auth.signOut();
    setCurrentUserEmail(null);
    setIsProfileModalOpen(false);
  };
  
  const handleDeleteUserAccount = async () => {
    if (!currentUserEmail) return;

    if (window.confirm("ATENÇÃO: Você está prestes a excluir sua conta permanentemente.\n\nTodos os seus dados (transações, contas, investimentos) serão apagados do servidor e não poderão ser recuperados.\n\nDeseja continuar?")) {
       if (window.confirm("Tem certeza absoluta? Esta ação é irreversível.")) {
          try {
             setIsLoadingData(true);
             await deleteUser(currentUserEmail);
             
             localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
             localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
             localStorage.removeItem(STORAGE_KEYS.MONTHS);
             localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
             localStorage.removeItem(STORAGE_KEYS.APP_THEME);
             localStorage.removeItem(STORAGE_KEYS.LONG_TERM_TRANSACTIONS);
             localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
             localStorage.removeItem(STORAGE_KEYS.INVESTMENTS);
             localStorage.removeItem(STORAGE_KEYS.CDI_RATE);
             localStorage.removeItem(STORAGE_KEYS.NOTEPAD_CONTENT);
             localStorage.removeItem(STORAGE_KEYS.IS_SYNC_DIRTY);
             localStorage.removeItem(STORAGE_KEYS.KNOWN_USER_EMAIL); // Forget user
             
             await handleLogout();
             alert("Conta excluída com sucesso.");
          } catch (error: any) {
             console.error(error);
             alert("Falha ao excluir conta: " + error.message);
          } finally {
             setIsLoadingData(false);
          }
       }
    }
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

  // --- REORDER LOGIC ---
  const handleAccountReorder = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const draggedIndex = accounts.findIndex(a => a.id === draggedId);
    const targetIndex = accounts.findIndex(a => a.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newAccounts = [...accounts];
    const [reorderedItem] = newAccounts.splice(draggedIndex, 1);
    newAccounts.splice(targetIndex, 0, reorderedItem);

    setAccounts(newAccounts);
  };

  const handleDragStart = (id: string) => {
    dragItem.current = id;
  };

  const handleDragEnter = (id: string) => {
    dragOverItem.current = id;
    if (dragItem.current && dragItem.current !== id) {
       handleAccountReorder(dragItem.current, id);
    }
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

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

  // --- PRO LOGIC / CONTACTS CLICK ---
  const handleContactClick = (contact: Contact) => {
    if (contact.id === '1') { // Notes
      setIsNotepadOpen(true);
    } else if (contact.id === '2') { // Calendar
      setIsCalendarOpen(true);
    } else if (contact.id === '3') { // Analytics (PRO)
      if (!userProfile.isPro) {
        setIsProModalOpen(true);
        return;
      }
      setIsAnalyticsOpen(true);
    }
  };

  const handleProUpgrade = () => {
    const amount = 7.00; // Updated price to match QR Code
    const now = new Date();
    // Expiry: Current date + 30 days
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + 30); 

    // 1. Create Transaction for the Subscription
    const newTx: Transaction = {
        id: Date.now().toString(),
        name: 'Assinatura PRO',
        amount: amount,
        type: 'subscription',
        logoType: 'generic', 
        paymentMethod: 'pix', // Assumed PIX since that's the modal
        paid: true,
        date: now.toISOString().split('T')[0], // YYYY-MM-DD
        month: activeMonthSummary.month,
        year: activeMonthSummary.year
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update Month Total to include the subscription cost
    setMonths(prev => prev.map(m => {
        if (m.month === activeMonthSummary.month && m.year === activeMonthSummary.year) {
            return { ...m, total: m.total + amount };
        }
        return m;
    }));

    // 2. Update Profile with Pro status and expiry
    const updatedProfile = {
        ...userProfile,
        isPro: true,
        subscriptionExpiry: expiryDate.toISOString()
    };
    setUserProfile(updatedProfile);

    setIsProModalOpen(false);
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
            isPro={!!userProfile.isPro}
            onOpenProModal={() => setIsProModalOpen(true)}
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
             isPro={!!userProfile.isPro}
             onOpenProModal={() => setIsProModalOpen(true)}
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
                  <div className={`w-12 h-12 rounded-full border-2 transition-all overflow-hidden shadow-lg shadow-black/20 ${userProfile.isPro ? 'border-yellow-500' : 'border-transparent group-hover:border-accent'}`}>
                     <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  {userProfile.isPro && (
                     <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-[#0a0a0b]">
                        <Crown className="w-3 h-3 text-black fill-black" />
                     </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Bem vindo,</span>
                  <div className="flex items-center gap-1">
                     <h1 className="text-white text-xl font-bold leading-none">{userProfile.name || 'Usuário'}</h1>
                     {userProfile.isPro && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </div>
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
               {filteredAccounts.map(acc => (
                   <SecondaryCard 
                     key={acc.id} 
                     account={acc} 
                     onDelete={handleDeleteAccount}
                     onEdit={handleEditAccount}
                     onDragStart={handleDragStart}
                     onDragEnter={handleDragEnter}
                     onDragEnd={handleDragEnd}
                     draggable
                   />
                 ))
               }
            </div>

            <ContactsRow 
               contacts={MOCK_CONTACTS} 
               onAddClick={handleOpenAddAccount}
               onContactClick={handleContactClick}
               isPro={!!userProfile.isPro}
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

  // --- RENDER LOGIC WITH SPLASH SCREEN TO PREVENT FLICKER ---
  
  // 1. Force Splash Screen if:
  //    a) Session check is not complete OR
  //    b) User is logged in, data is loading, AND profile name is missing (to avoid default avatar flicker)
  const shouldShowSplash = !isSessionReady || (currentUserEmail && isLoadingData && !userProfile.name);

  if (shouldShowSplash) {
      return <SplashScreen />;
  }

  // 2. If check is done and still no user, show login
  if (!currentUserEmail) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // 3. Otherwise show App
  // Initial Loading State (only show if no local data AND waiting for cloud)
  if (isLoadingData && transactions.length === 0 && accounts.length === 0) {
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
        isPro={!!userProfile.isPro}
        onOpenProModal={() => setIsProModalOpen(true)}
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
         onDeleteAccount={handleDeleteUserAccount}
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

      <Suspense fallback={null}>
        {isAnalyticsOpen && (
          <AnalyticsModal 
             isOpen={isAnalyticsOpen}
             onClose={handleCloseAnalytics}
             transactions={transactions}
             months={months}
          />
        )}
      </Suspense>

      <ProModal 
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onUpgrade={handleProUpgrade}
      />
    </div>
  );
};

export default App;
