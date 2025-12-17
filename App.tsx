
import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback } from 'react';
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
import { Crown, Loader2, BellRing } from 'lucide-react';

// Supabase Services
import { loginUser, registerUser, loadUserData, saveCollection, saveUserField, subscribeToUserChanges, deleteUser, supabase, VAPID_PUBLIC_KEY, upsertItem, deleteItem } from './services/supabase';

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

// --- UTILS ---
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const isValidUUID = (uuid: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

// Helper to prevent floating point errors (e.g. 3142.1200000000005)
const roundMoney = (amount: number) => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

// --- DYNAMIC INITIALIZATION LOGIC ---
const currentDate = new Date();
const currentMonthIndex = currentDate.getMonth();
const currentYear = currentDate.getFullYear();
const currentMonthName = MONTH_NAMES[currentMonthIndex];

const SYSTEM_INITIAL_MONTH: MonthSummary = {
  id: '00000000-0000-0000-0000-000000000001', 
  month: currentMonthName,
  year: currentYear.toString(),
  total: 0
};

// --- DATA MIGRATION HELPER ---
const sanitizeDataIds = (data: any) => {
  let hasChanges = false;
  const idMap: Record<string, string> = {}; 

  // Helper to ensure UUIDs
  const processList = (list: any[]) => {
    if (!list) return [];
    return list.map(item => {
      if (item.id && !isValidUUID(item.id)) {
        if (!idMap[item.id]) {
           idMap[item.id] = generateUUID();
        }
        hasChanges = true;
        return { ...item, id: idMap[item.id] };
      }
      return item;
    });
  };

  const newMonths = processList(data.months);
  const validMonthKeys = new Set(newMonths.map((m: any) => `${m.month}|${m.year}`));

  // --- CLEANUP: Deduplicate & Clean Orphans Transactions ---
  const rawTransactions = processList(data.transactions);
  const uniqueTxMap = new Set<string>();
  const newTransactions: any[] = [];

  if (rawTransactions) {
      rawTransactions.forEach((tx: any) => {
        if (tx.month && tx.year) {
            const key = `${tx.month}|${tx.year}`;
            if (!validMonthKeys.has(key)) {
                hasChanges = true;
                return; // Skip orphaned transaction
            }
        }
        const signature = `${tx.name?.trim()}|${tx.amount}|${tx.date}|${tx.type}|${tx.month}|${tx.year}`;
        if (!uniqueTxMap.has(signature)) {
            uniqueTxMap.add(signature);
            newTransactions.push(tx);
        } else {
            hasChanges = true; 
        }
      });
  }
  
  const fallbackMonth = (newMonths && newMonths.length > 0) ? newMonths[0] : SYSTEM_INITIAL_MONTH;

  const rawAccounts = processList(data.accounts);
  const uniqueAccountsMap = new Map<string, any>();
  const uniqueAccounts: any[] = [];
  
  rawAccounts.forEach((acc: any) => {
      if (acc.month && acc.year) {
          const key = `${acc.month}|${acc.year}`;
          if (!validMonthKeys.has(key)) {
              hasChanges = true;
              return; 
          }
      }
      if (!acc.month || !acc.year) {
          acc.month = fallbackMonth.month;
          acc.year = fallbackMonth.year;
          hasChanges = true;
      }
      const key = `${acc.name}|${acc.balance}|${acc.colorTheme}|${acc.month}|${acc.year}`;
      if (!uniqueAccountsMap.has(key)) {
          uniqueAccountsMap.set(key, true);
          uniqueAccounts.push(acc);
      } else {
          hasChanges = true; 
      }
  });

  const newInvestments = processList(data.investments);
  const newLongTerm = processList(data.longTerm);
  const newNotifications = processList(data.notifications);

  let newDashboardOrder = data.dashboardOrder || [];
  if (hasChanges && newDashboardOrder.length > 0) {
     newDashboardOrder = newDashboardOrder.map((id: string) => {
        return idMap[id] || id; 
     });
  }
  newDashboardOrder = Array.from(new Set(newDashboardOrder));

  return {
    hasChanges,
    data: {
      ...data,
      transactions: newTransactions,
      accounts: uniqueAccounts, 
      months: newMonths,
      investments: newInvestments,
      longTerm: newLongTerm,
      notifications: newNotifications,
      dashboardOrder: newDashboardOrder
    },
    idMap 
  };
};

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Notas', imageUrl: '' }, 
  { id: '2', name: 'Calendário', imageUrl: '' }, 
  { id: '3', name: 'Análise', imageUrl: '' }, 
];

const INITIAL_PROFILE: UserProfile = {
  name: '',
  subtitle: '',
  avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
  isPro: false
};

const BALANCE_CARD_ID = 'balance-card';

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

const getYearFromDateStr = (dateStr: string, activeYearContext?: string): string => {
  if (dateStr.toLowerCase().includes('hoje')) return new Date().getFullYear().toString();
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr.split('-')[0];
  if (activeYearContext) return activeYearContext;
  return new Date().getFullYear().toString();
};

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

const SplashScreen = () => (
  <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[100] animate-out fade-out duration-700">
    <div className="w-32 h-32 bg-[#1c1c1e] rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-black/20 mb-6">
       <FlowLogo className="w-24 h-24 text-accent" />
    </div>
    <div className="flex flex-col items-center gap-2">
       <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">v1.4.0 • Performance 100%</p>
    </div>
  </div>
);

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return loadData(STORAGE_KEYS.USER_SESSION, null);
  });
  
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
     return !!loadData(STORAGE_KEYS.USER_SESSION, null);
  });

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

  // --- DATA STATES ---
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
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- REFS ---
  const dragItem = useRef<string | null>(null);
  const lastDragUpdate = useRef<number>(0);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  
  // Use a string ref to lock creation of specific months to prevent duplicates
  const pendingMonthCreationRef = useRef<string | null>(null);

  const prevMonthsRef = useRef<string>(JSON.stringify(months));
  const prevDashboardOrderRef = useRef<string>(JSON.stringify(dashboardOrder));

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
    notepadDrawing,
    cdiRate,
    dashboardOrder
  });

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
      notepadDrawing,
      cdiRate,
      dashboardOrder
    };
  });

  // --- APPLY THEME TO CSS VARIABLES ---
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', appTheme.primary);
    root.style.setProperty('--color-accent-dark', appTheme.secondary);
  }, [appTheme]);

  // --- SCROLL RESET ---
  // Ensures Settings (and other views) start at top
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [currentView]);

  // --- AUTO-CALCULATE MONTH TOTALS ---
  useEffect(() => {
    setMonths(prevMonths => {
      let hasChanged = false;
      const updatedMonths = prevMonths.map(month => {
        const monthTotal = transactions
          .filter(t => {
             const tMonth = t.month || getMonthFromDateStr(t.date);
             const tYear = t.year || getYearFromDateStr(t.date, month.year);
             return tMonth === month.month && tYear === month.year;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const roundedTotal = roundMoney(monthTotal);

        if (month.total !== roundedTotal) {
          hasChanged = true;
          return { ...month, total: roundedTotal };
        }
        return month;
      });
      return hasChanged ? updatedMonths : prevMonths;
    });
  }, [transactions]); 

  // --- SYNC DASHBOARD ORDER ---
  useEffect(() => {
     if (accounts.length === 0) return;

     setDashboardOrder(prev => {
        const currentSet = new Set(prev);
        const newIds: string[] = [];
        
        accounts.forEach(acc => {
           if (!currentSet.has(acc.id)) {
              newIds.push(acc.id);
           }
        });

        if (newIds.length === 0 && currentSet.has(BALANCE_CARD_ID)) return prev;

        const nextOrder = [...prev];
        if (!currentSet.has(BALANCE_CARD_ID)) {
             nextOrder.unshift(BALANCE_CARD_ID);
        }
        return Array.from(new Set([...nextOrder, ...newIds]));
     });
  }, [accounts]);

  // --- NOTIFICATION CHECKER (FIXED) ---
  useEffect(() => {
    const checkDueBills = async () => {
      // Check even if Notification API is not supported (for internal list)
      const now = new Date();
      // Generate Local Today String manually to avoid UTC offset issues (e.g., "24/05/2025")
      const todayLocalStr = now.toLocaleDateString('pt-BR');
      
      const notifiedKey = `flow_notified_${todayLocalStr.replace(/\//g, '-')}`;
      const alreadyNotifiedIds = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
      const newNotifiedIds = [...alreadyNotifiedIds];
      let hasNotification = false;

      const todayShortLower = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toLowerCase().replace('.', ''); // "24 mai"

      for (const tx of transactions) {
         if (tx.paid) continue;
         if (alreadyNotifiedIds.includes(tx.id)) continue;

         let isToday = false;
         const txDateLower = tx.date.toLowerCase();

         // Case 1: "Hoje ..."
         if (txDateLower.includes('hoje')) {
            isToday = true;
         } 
         // Case 2: ISO YYYY-MM-DD
         else if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
            // Convert the stored ISO string to local parts for comparison
            const [y, m, d] = tx.date.split(' ')[0].split('-');
            const txLocalStr = new Date(Number(y), Number(m)-1, Number(d)).toLocaleDateString('pt-BR');
            if (txLocalStr === todayLocalStr) {
               isToday = true;
            }
         } 
         // Case 3: "24 Mai" format
         else {
            const parts = txDateLower.split(' ');
            if (parts.length >= 2) {
               if (todayShortLower.includes(parts[0]) && todayShortLower.includes(parts[1])) {
                  isToday = true;
               }
            }
         }

         if (isToday) {
            // Service Worker Notification (System Status Bar)
            if ('serviceWorker' in navigator && Notification.permission === 'granted') {
               try {
                 const registration = await navigator.serviceWorker.ready;
                 registration.showNotification('Flow Finance', {
                    body: `Conta vencendo hoje: ${tx.name} (R$ ${tx.amount.toFixed(2)})`,
                    // Fix: Use the official branded favicon to look professional
                    icon: '/favicon.svg',
                    badge: '/notification-icon.svg?v=1', // Monochrome icon with cache bust
                    vibrate: [200, 100, 200],
                    tag: `bill-${tx.id}`
                 } as any);
               } catch (e) {
                 console.error("SW Notificação falhou:", e);
               }
            }

            // Create Internal Notification Object
            const newNotif: AppNotification = {
                id: generateUUID(),
                title: 'Conta Vencendo Hoje!',
                message: `A conta ${tx.name} de R$ ${tx.amount.toFixed(2)} vence hoje.`,
                date: 'Hoje',
                read: false,
                type: 'alert'
            };

            // Update State
            setNotifications(prev => [newNotif, ...prev]);
            
            // CRITICAL: Persist notification immediately to Cloud/DB
            if (currentUserEmail) {
                upsertItem(currentUserEmail, 'notifications', newNotif);
            }

            newNotifiedIds.push(tx.id);
            hasNotification = true;
         }
      }

      if (hasNotification) {
         localStorage.setItem(notifiedKey, JSON.stringify(newNotifiedIds));
      }
    };

    const timer = setTimeout(checkDueBills, 2000);
    return () => clearTimeout(timer);
  }, [transactions, currentUserEmail]); 

  // --- FILTERING ---
  const activeMonthSummary = months.find(m => m.id === activeMonthId) || months[0];
  
  const filteredTransactions = useMemo(() => {
    if (!activeMonthSummary) return [];
    
    const filtered = transactions.filter(tx => {
      const txMonth = tx.month || getMonthFromDateStr(tx.date);
      const txYear = tx.year || getYearFromDateStr(tx.date, activeMonthSummary.year);
      return txMonth === activeMonthSummary.month && txYear === activeMonthSummary.year;
    });

    // Insertion order (newest first)
    return filtered; 
  }, [transactions, activeMonthSummary]);

  const filteredAccounts = useMemo(() => {
    if (!activeMonthSummary) return [];
    return accounts.filter(acc => {
      return acc.month === activeMonthSummary.month && acc.year === activeMonthSummary.year;
    });
  }, [accounts, activeMonthSummary]);

  const dashboardItems = useMemo(() => {
    const items: string[] = [];
    const orderSet = new Set(dashboardOrder);
    
    dashboardOrder.forEach(id => {
      if (id === BALANCE_CARD_ID) {
        items.push(id);
      } else {
        const exists = filteredAccounts.find(a => a.id === id);
        if (exists) items.push(id);
      }
    });

    filteredAccounts.forEach(a => {
      if (!orderSet.has(a.id)) {
        items.push(a.id);
      }
    });
    
    if (!items.includes(BALANCE_CARD_ID)) {
      items.unshift(BALANCE_CARD_ID);
    }
    return Array.from(new Set(items));
  }, [dashboardOrder, filteredAccounts]);

  // --- AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  // --- CLEANUP OLD NOTIFICATIONS ---
  const cleanupOldNotifications = (notifs: AppNotification[]) => {
     if (!currentUserEmail) return;
     
     // Remove notifications older than 30 days
     const thirtyDaysAgo = new Date();
     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
     
     // Since our notification date format is loose (e.g. "Hoje", "24/05/2025"), 
     // we rely on the DB insertion time if available, or skip complex parsing for now.
     // Assuming the ID is UUID, we can't extract date.
     // Strategy: Just delete if the list is too big (> 50)
     if (notifs.length > 50) {
        const toKeep = notifs.slice(0, 50); // Keep 50 newest
        const toDelete = notifs.slice(50);
        
        toDelete.forEach(n => {
           deleteItem(currentUserEmail, 'notifications', n.id);
        });
        
        setNotifications(toKeep);
     }
  };

  // --- LOAD DATA ---
  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;

    setIsLoadingData(true);

    loadUserData(currentUserEmail)
      .then((data) => {
        if (data) {
          const { hasChanges, data: cleanData, idMap } = sanitizeDataIds(data);
          applyData(cleanData);
          
          // Cleanup routine
          if (cleanData.notifications) {
             cleanupOldNotifications(cleanData.notifications);
          }

          if (hasChanges && currentUserEmail) {
             if (idMap[activeMonthId]) {
                setActiveMonthId(idMap[activeMonthId]);
             }
             saveCollection(currentUserEmail, "transactions", cleanData.transactions);
             saveCollection(currentUserEmail, "accounts", cleanData.accounts);
             saveCollection(currentUserEmail, "months", cleanData.months);
             saveUserField(currentUserEmail, "dashboardOrder", cleanData.dashboardOrder);
          }
        }
      })
      .catch(err => {
        console.error("Error loading data from Cloud:", err);
      })
      .finally(() => setIsLoadingData(false));
  }, [currentUserEmail, isSessionReady]);

  // --- REALTIME ---
  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleRealtimeUpdate = () => {
       clearTimeout(debounceTimer);
       debounceTimer = setTimeout(() => {
          loadUserData(currentUserEmail).then((data) => {
              if (data) {
                 const { data: cleanData } = sanitizeDataIds(data);
                 applyData(cleanData);
              }
          });
       }, 1000);
    };

    const unsubscribe = subscribeToUserChanges(currentUserEmail, handleRealtimeUpdate);
    return () => { 
        unsubscribe(); 
        clearTimeout(debounceTimer); 
    };
  }, [currentUserEmail, isSessionReady]);

  // --- VIGIA ---
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible' && currentUserEmail) {
         loadUserData(currentUserEmail).then((data) => {
            if (data) {
               const { data: cleanData } = sanitizeDataIds(data);
               applyData(cleanData);
            }
         });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [currentUserEmail]);

  // --- APPLY DATA ---
  const applyData = (data: any) => {
      if (data.profile) {
        let profile = data.profile;
        if (profile.isPro && profile.subscriptionExpiry) {
           const expiryDate = new Date(profile.subscriptionExpiry);
           const now = new Date();
           if (now > expiryDate) {
              profile = { ...profile, isPro: false, subscriptionExpiry: undefined };
              if (currentUserEmail) saveUserField(currentUserEmail, "profile", profile); 
           }
        }
        setUserProfile(profile);
      }
      if (data.transactions) setTransactions(data.transactions);
      if (data.accounts) setAccounts(data.accounts);
      if (data.investments) setInvestments(data.investments);
      if (data.longTerm) setLongTermTransactions(data.longTerm);
      if (data.notifications) setNotifications(data.notifications);
      if (data.theme) {
         setAppTheme(data.theme);
         saveData(STORAGE_KEYS.APP_THEME, data.theme);
      }
      if (data.notepadContent !== undefined) setNotepadContent(data.notepadContent);
      if (data.notepadDrawing !== undefined) setNotepadDrawing(data.notepadDrawing);
      if (data.months && data.months.length > 0) {
        const sorted = sortMonths(data.months);
        setMonths(sorted);
        if (activeMonthId === SYSTEM_INITIAL_MONTH.id || !sorted.find(m => m.id === activeMonthId)) {
           setActiveMonthId(sorted[sorted.length - 1].id);
        }
        prevMonthsRef.current = JSON.stringify(sorted);
      }
      if (data.cdiRate !== undefined) setCdiRate(data.cdiRate);
      if (data.dashboardOrder && Array.isArray(data.dashboardOrder)) {
         setDashboardOrder(data.dashboardOrder);
         prevDashboardOrderRef.current = JSON.stringify(data.dashboardOrder);
      }
  };

  // --- SAVES (PERFORMANCE: ONLY BULK/COMPLEX DATA USES EFFECT) ---
  const DEBOUNCE_DELAY = 1500;

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(months);
      if (currentStr !== prevMonthsRef.current) {
        const timer = setTimeout(async () => {
          await saveCollection(currentUserEmail, "months", months);
          prevMonthsRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [months, currentUserEmail, isLoadingData]);

  useEffect(() => {
    if (currentUserEmail && !isLoadingData) {
      const currentStr = JSON.stringify(dashboardOrder);
      if (currentStr !== prevDashboardOrderRef.current) {
        const timer = setTimeout(async () => {
          await saveCollection(currentUserEmail, "dashboardOrder", dashboardOrder);
          prevDashboardOrderRef.current = currentStr;
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [dashboardOrder, currentUserEmail, isLoadingData]);

  // --- ACTIONS ---
  
  const handleDuplicateMonth = useCallback(() => {
    const currentData = currentStateRef.current;
    const activeMonthRef = currentData.months.find(m => m.id === activeMonthId) || currentData.months[0];
    if (!activeMonthRef) return;

    let nextMonthIndex = MONTH_NAMES.indexOf(activeMonthRef.month) + 1;
    let nextYear = parseInt(activeMonthRef.year);

    if (nextMonthIndex > 11) {
      nextMonthIndex = 0;
      nextYear += 1;
    }

    const nextMonthName = MONTH_NAMES[nextMonthIndex];
    const nextYearStr = nextYear.toString();
    const creationKey = `${nextMonthName}-${nextYearStr}`;

    if (pendingMonthCreationRef.current === creationKey) return;

    const exists = currentData.months.find(m => m.month === nextMonthName && m.year === nextYearStr);
    if (exists) {
      setActiveMonthId(exists.id);
      return;
    }

    const existingAccounts = currentData.accounts.filter(a => a.month === nextMonthName && a.year === nextYearStr);
    const existingTransactions = currentData.transactions.filter(t => t.month === nextMonthName && t.year === nextYearStr);
    const hasOrphans = existingAccounts.length > 0 || existingTransactions.length > 0;

    pendingMonthCreationRef.current = creationKey;
    const newMonthId = generateUUID();
    
    let newTransactions: Transaction[] = [];
    let newAccounts: Account[] = [];
    let newOrderSegment: string[] = [];
    let initialTotal = 0; 

    const sourceTransactions = currentData.transactions.filter(tx => {
        const txMonth = tx.month || getMonthFromDateStr(tx.date);
        const txYear = tx.year || getYearFromDateStr(tx.date, activeMonthRef.year);
        return txMonth === activeMonthRef.month && txYear === activeMonthRef.year;
    });

    const sourceAccounts = currentData.accounts.filter(acc => {
        return acc.month === activeMonthRef.month && acc.year === activeMonthRef.year;
    });

    newTransactions = sourceTransactions.map(tx => {
        let newDate = tx.date;
        if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
            const d = new Date(tx.date.split(' ')[0] + 'T00:00:00');
            d.setMonth(d.getMonth() + 1);
            newDate = d.toISOString().split('T')[0];
        } else {
            const m = (nextMonthIndex + 1).toString().padStart(2, '0');
            newDate = `${nextYearStr}-${m}-01`;
        }

        return {
            ...tx,
            id: generateUUID(),
            month: nextMonthName,
            year: nextYearStr,
            paid: false,
            date: newDate,
            createdAt: new Date().toISOString() // Ensure duplicated tx has new date
        };
    });

    const rawTotal = newTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    initialTotal = roundMoney(rawTotal);

    const oldIdToNewIdMap = new Map<string, string>();
    sourceAccounts.forEach(acc => {
        const newId = generateUUID();
        oldIdToNewIdMap.set(acc.id, newId);
        newAccounts.push({
            ...acc,
            id: newId,
            month: nextMonthName,
            year: nextYearStr
        });
    });

    const currentOrder = currentData.dashboardOrder;
    currentOrder.forEach(oldId => {
        if (oldId === BALANCE_CARD_ID) {
            newOrderSegment.push(BALANCE_CARD_ID);
        } else if (oldIdToNewIdMap.has(oldId)) {
            newOrderSegment.push(oldIdToNewIdMap.get(oldId)!);
        }
    });

    newAccounts.forEach(acc => {
        if (!newOrderSegment.includes(acc.id)) {
            newOrderSegment.push(acc.id);
        }
    });

    const newMonth: MonthSummary = {
      id: newMonthId,
      month: nextMonthName,
      year: nextYearStr,
      total: initialTotal 
    };

    setMonths(prev => sortMonths([...prev, newMonth]));
    
    let updatedTx = [];
    let updatedAcc = [];

    if (hasOrphans) {
        setTransactions(prev => {
            const cleaned = prev.filter(t => !(t.month === nextMonthName && t.year === nextYearStr));
            updatedTx = [...newTransactions, ...cleaned];
            return updatedTx;
        });
        setAccounts(prev => {
            const cleaned = prev.filter(a => !(a.month === nextMonthName && a.year === nextYearStr));
            updatedAcc = [...prev, ...newAccounts];
            return updatedAcc;
        });
    } else {
        setTransactions(prev => {
            updatedTx = [...newTransactions, ...prev];
            return updatedTx;
        });
        setAccounts(prev => {
            updatedAcc = [...prev, ...newAccounts];
            return updatedAcc;
        });
    }
    
    setDashboardOrder(prev => {
        const cleanPrev = prev.filter(id => id !== BALANCE_CARD_ID);
        return Array.from(new Set([...cleanPrev, ...newOrderSegment]));
    });
    
    setActiveMonthId(newMonthId);

    if (currentUserEmail) {
        saveCollection(currentUserEmail, "transactions", updatedTx);
        saveCollection(currentUserEmail, "accounts", updatedAcc);
    }

    setTimeout(() => { 
        if (pendingMonthCreationRef.current === creationKey) {
            pendingMonthCreationRef.current = null; 
        }
    }, 2000);

  }, [activeMonthId, currentUserEmail]);

  const handleDeleteMonth = useCallback((id: string) => {
     if (months.length <= 1) return;
     const monthToDelete = months.find(m => m.id === id);
     if (!monthToDelete) return;

     setMonths(prev => prev.filter(m => m.id !== id));
     
     let updatedTx: Transaction[] = [];
     let updatedAcc: Account[] = [];

     setTransactions(prev => {
         updatedTx = prev.filter(t => !(t.month === monthToDelete.month && t.year === monthToDelete.year));
         return updatedTx;
     });
     setAccounts(prev => {
         updatedAcc = prev.filter(a => !(a.month === monthToDelete.month && a.year === monthToDelete.year));
         return updatedAcc;
     });
     
     if (activeMonthId === id) {
        const remaining = months.filter(m => m.id !== id);
        const sorted = sortMonths(remaining);
        if (sorted.length > 0) setActiveMonthId(sorted[sorted.length - 1].id);
     }

     // MANUAL SAVE
     if (currentUserEmail) {
        saveCollection(currentUserEmail, "transactions", updatedTx);
        saveCollection(currentUserEmail, "accounts", updatedAcc);
     }
  }, [months, activeMonthId, currentUserEmail]);

  // Drag Handlers
  const handleCardDragStart = useCallback((id: string) => {
    dragItem.current = id;
  }, []);

  const handleCardDragEnter = useCallback((targetId: string) => {
    if (dragItem.current && dragItem.current !== targetId) {
       const now = Date.now();
       if (now - lastDragUpdate.current < 250) return;

       const draggedId = dragItem.current;
       setDashboardOrder(prev => {
          const newOrder = [...prev];
          const draggedIndex = newOrder.indexOf(draggedId);
          const targetIndex = newOrder.indexOf(targetId);
          if (draggedIndex !== -1 && targetIndex !== -1) {
             newOrder.splice(draggedIndex, 1);
             newOrder.splice(targetIndex, 0, draggedId);
             lastDragUpdate.current = Date.now();
             return Array.from(new Set(newOrder));
          }
          return prev;
       });
    }
  }, []);

  const handleCardDragEnd = useCallback(() => {
    dragItem.current = null;
  }, []);

  // --- GRANULAR HANDLERS (PERFORMANCE) ---

  const handleDeleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setDashboardOrder(prev => prev.filter(oid => oid !== id));
    if (currentUserEmail) deleteItem(currentUserEmail, 'accounts', id);
  }, [currentUserEmail]);
  
  const handleEditAccount = useCallback((acc: Account) => {
      setEditingAccount(acc);
      setIsAddAccountOpen(true);
  }, []);

  const handleSaveTransaction = useCallback((txData: any) => { 
      let newTx: Transaction;
      
      setTransactions(prev => {
         if (editingTransaction) {
             // Preserve original createdAt to prevent jumping in list
             newTx = { ...editingTransaction, ...txData };
             if(currentUserEmail) upsertItem(currentUserEmail, 'transactions', newTx);
             return prev.map(t => t.id === editingTransaction.id ? newTx : t);
         } else {
             // Set createdAt on creation
             const nowIso = new Date().toISOString();
             newTx = { 
                 id: generateUUID(), 
                 ...txData, 
                 month: activeMonthSummary.month, 
                 year: activeMonthSummary.year,
                 createdAt: nowIso // Important for sorting
             };
             if(currentUserEmail) upsertItem(currentUserEmail, 'transactions', newTx);
             return [newTx, ...prev];
         }
      });
      setEditingTransaction(null);
  }, [editingTransaction, activeMonthSummary, currentUserEmail]);

  const handleDeleteTransaction = useCallback((id: string) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (currentUserEmail) deleteItem(currentUserEmail, 'transactions', id);
  }, [currentUserEmail]);

  const handleEditTransaction = useCallback((tx: Transaction) => { 
      setEditingTransaction(tx); 
      setIsAddTransactionOpen(true); 
  }, []);
  
  const handleAddTransactionClick = useCallback(() => {
      setEditingTransaction(null);
      setIsAddTransactionOpen(true);
  }, []);

  const handleToggleTransactionStatus = useCallback((id: string) => {
      setTransactions(prev => prev.map(t => {
          if (t.id === id) {
              const updated = { ...t, paid: !t.paid };
              if (currentUserEmail) upsertItem(currentUserEmail, 'transactions', updated);
              return updated;
          }
          return t;
      }));
  }, [currentUserEmail]);

  const handleTogglePaymentMethod = useCallback((id: string) => {
      setTransactions(prev => prev.map(t => {
          if (t.id === id) {
              const updated = { ...t, paymentMethod: t.paymentMethod === 'pix' ? 'card' : 'pix' } as Transaction;
              if (currentUserEmail) upsertItem(currentUserEmail, 'transactions', updated);
              return updated;
          }
          return t;
      }));
  }, [currentUserEmail]);
  
  const handleSaveAccount = useCallback((name: string, balance: number, theme: CardTheme) => {
    if (editingAccount) {
      const updated = { ...editingAccount, name, balance, colorTheme: theme };
      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? updated : acc));
      if (currentUserEmail) upsertItem(currentUserEmail, 'accounts', updated);
      setEditingAccount(null);
    } else {
      const newAcc = { id: generateUUID(), name, balance, colorTheme: theme, month: activeMonthSummary?.month, year: activeMonthSummary?.year };
      setAccounts(prev => [...prev, newAcc]);
      if (currentUserEmail) upsertItem(currentUserEmail, 'accounts', newAcc);
    }
  }, [editingAccount, activeMonthSummary, currentUserEmail]);

  // --- CRUD CALLBACKS FOR MEMOIZED VIEWS ---
  
  const handleAddLongTerm = useCallback((item: Omit<LongTermTransaction, 'id' | 'installmentsPaid'>) => {
     const newItem = { ...item, id: generateUUID(), installmentsPaid: 0 };
     setLongTermTransactions(p => [...p, newItem]);
     if (currentUserEmail) upsertItem(currentUserEmail, 'longTerm', newItem);
  }, [currentUserEmail]);

  const handleEditLongTerm = useCallback((item: LongTermTransaction) => {
     setLongTermTransactions(p => p.map(o => o.id === item.id ? item : o));
     if (currentUserEmail) upsertItem(currentUserEmail, 'longTerm', item);
  }, [currentUserEmail]);

  const handleDeleteLongTerm = useCallback((id: string) => {
     setLongTermTransactions(p => p.filter(i => i.id !== id));
     if (currentUserEmail) deleteItem(currentUserEmail, 'longTerm', id);
  }, [currentUserEmail]);

  const handleAddInvestment = useCallback((item: Omit<Investment, 'id'>) => {
     const newItem = { ...item, id: generateUUID() };
     setInvestments(p => [...p, newItem]);
     if (currentUserEmail) upsertItem(currentUserEmail, 'investments', newItem);
  }, [currentUserEmail]);

  const handleEditInvestment = useCallback((item: Investment) => {
     setInvestments(p => p.map(o => o.id === item.id ? item : o));
     if (currentUserEmail) upsertItem(currentUserEmail, 'investments', item);
  }, [currentUserEmail]);

  const handleDeleteInvestment = useCallback((id: string) => {
     setInvestments(p => p.filter(i => i.id !== id));
     if (currentUserEmail) deleteItem(currentUserEmail, 'investments', id);
  }, [currentUserEmail]);

  // Modal Openers
  const openAddTransaction = useCallback(() => setIsAddTransactionOpen(true), []);
  const openAddAccount = useCallback(() => setIsAddAccountOpen(true), []);
  const openCalculator = useCallback(() => setIsCalculatorOpen(true), []);
  const openProfile = useCallback(() => setIsProfileModalOpen(true), []);
  const openNotepad = useCallback(() => setIsNotepadOpen(true), []);
  const openCalendar = useCallback(() => setIsCalendarOpen(true), []);
  const openNotification = useCallback(() => setIsNotificationOpen(true), []);
  const openAnalytics = useCallback(() => setIsAnalyticsOpen(true), []);
  const openPro = useCallback(() => setIsProModalOpen(true), []);

  // Close Handlers
  const handleCloseTransactionModal = useCallback(() => {
      setIsAddTransactionOpen(false);
      setEditingTransaction(null);
  }, []);

  const handleCloseAccountModal = useCallback(() => {
      setIsAddAccountOpen(false);
      setEditingAccount(null);
  }, []);

  const handleCloseCalculator = useCallback(() => setIsCalculatorOpen(false), []);
  const handleCloseProfile = useCallback(() => setIsProfileModalOpen(false), []);
  const handleCloseNotepad = useCallback(() => setIsNotepadOpen(false), []);
  const handleCloseCalendar = useCallback(() => setIsCalendarOpen(false), []);
  const handleCloseNotification = useCallback(() => setIsNotificationOpen(false), []);
  const handleCloseAnalytics = useCallback(() => setIsAnalyticsOpen(false), []);
  const handleClosePro = useCallback(() => setIsProModalOpen(false), []);

  const handleSaveTheme = useCallback((t: AppTheme) => {
      setAppTheme(t);
      setCurrentView('home');
  }, []);

  const handleSaveNotepad = useCallback((c: string, d: string | null) => {
      setNotepadContent(c);
      setNotepadDrawing(d);
      if (currentUserEmail) {
          saveUserField(currentUserEmail, 'notepadContent', c);
          saveUserField(currentUserEmail, 'notepadDrawing', d);
      }
  }, [currentUserEmail]);

  const handleUpgradePro = useCallback(() => {
      setUserProfile(prev => ({...prev, isPro: true}));
      setIsProModalOpen(false);
  }, []);

  // Notification Handlers (Batch delete/mark might use SaveCollection for ease)
  const handleMarkAllRead = useCallback(() => {
      setNotifications(p => {
          const updated = p.map(n => ({ ...n, read: true }));
          if (currentUserEmail) saveCollection(currentUserEmail, 'notifications', updated);
          return updated;
      });
  }, [currentUserEmail]);

  const handleDeleteNotification = useCallback((id: string) => {
      setNotifications(p => p.filter(n => n.id !== id));
      if (currentUserEmail) deleteItem(currentUserEmail, 'notifications', id);
  }, [currentUserEmail]);

  // Contact Click Handler
  const handleContactClick = useCallback((c: Contact) => {
      if (c.id === '1') openNotepad();
      else if (c.id === '2') openCalendar();
      else if (c.id === '3') { 
          if (!userProfile.isPro) openPro(); 
          else openAnalytics(); 
      }
  }, [userProfile.isPro, openNotepad, openCalendar, openPro, openAnalytics]);

  const activeMonthMonth = activeMonthSummary?.month;
  const activeMonthYear = activeMonthSummary?.year;
  
  const activeMonthContext = useMemo(() => {
      if (!activeMonthMonth || !activeMonthYear) return undefined;
      return { monthIndex: MONTH_NAMES.indexOf(activeMonthMonth), year: parseInt(activeMonthYear) };
  }, [activeMonthMonth, activeMonthYear]);

  const handleLogin = async (email: string, name?: string) => {
      try {
        if (name) await registerUser(email, name, { months: [SYSTEM_INITIAL_MONTH], cdiRate: 11.25 });
        else await loginUser(email);
        
        saveData(STORAGE_KEYS.USER_SESSION, email);
        saveData(STORAGE_KEYS.KNOWN_USER_EMAIL, email); 
        setCurrentUserEmail(email);

        // --- SILENT PUSH NOTIFICATION REGISTRATION ON LOGIN ---
        if ('Notification' in window && 'serviceWorker' in navigator) {
           try {
              // Request permission immediately (Browser usually allows this inside user gesture async chain)
              const permission = await Notification.requestPermission();
              
              if (permission === 'granted') {
                 const registration = await navigator.serviceWorker.ready;
                 let subscription = await registration.pushManager.getSubscription();
                 
                 // If not subscribed yet, subscribe now
                 if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                 }
                 
                 // Save subscription to backend
                 if (subscription) {
                    const subJson = JSON.parse(JSON.stringify(subscription));
                    await saveUserField(email, 'pushSubscription', subJson);
                 }
              }
           } catch (e) {
              console.warn("Auto-subscription failed:", e);
           }
        }

      } catch (error) { 
        console.error("Login failed:", error); 
        throw error; 
      }
  };
  
  const handleLogout = async () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    await supabase.auth.signOut();
    setCurrentUserEmail(null);
    setIsProfileModalOpen(false);
  };
  
  const handleBackToHome = useCallback(() => setCurrentView('home'), []);

  // --- RENDER ---
  const renderView = () => {
    switch(currentView) {
      case 'settings': return <SettingsView currentThemeId={appTheme.id} onSaveTheme={handleSaveTheme} isPro={!!userProfile.isPro} onOpenProModal={openPro} />;
      case 'long-term': return <LongTermView items={longTermTransactions} onAdd={handleAddLongTerm} onEdit={handleEditLongTerm} onDelete={handleDeleteLongTerm} />;
      case 'investments': return <InvestmentsView investments={investments} onAdd={handleAddInvestment} onEdit={handleEditInvestment} onDelete={handleDeleteInvestment} onBack={handleBackToHome} cdiRate={cdiRate} onUpdateCdiRate={setCdiRate} isPro={!!userProfile.isPro} onOpenProModal={openPro} />;
      case 'home': default: return (
          <>
            <div className="flex justify-between items-center mb-6 pl-1">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={openProfile}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full border-2 overflow-hidden shadow-lg ${userProfile.isPro ? 'border-yellow-500' : 'border-transparent group-hover:border-accent'}`}>
                     <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  {userProfile.isPro && <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-[#0a0a0b]"><Crown className="w-3 h-3 text-black fill-black" /></div>}
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Bem vindo,</span>
                  <div className="flex items-center gap-1"><h1 className="text-white text-xl font-bold leading-none">{userProfile.name || 'Usuário'}</h1>{userProfile.isPro && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}</div>
                </div>
              </div>
              <div className="flex items-center gap-2"><IconBell count={notifications.filter(n => !n.read).length} onClick={openNotification} /></div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
               {dashboardItems.map((id) => {
                  if (id === BALANCE_CARD_ID) return <BalanceCard key={id} id={id} balance={(filteredAccounts.reduce((a, b) => a + b.balance, 0) - filteredTransactions.reduce((a, b) => a + b.amount, 0))} onAddClick={handleAddTransactionClick} onDuplicateClick={handleDuplicateMonth} onCalculatorClick={openCalculator} draggable onDragStart={handleCardDragStart} onDragEnter={handleCardDragEnter} onDragEnd={handleCardDragEnd} />;
                  const account = filteredAccounts.find(a => a.id === id);
                  if (account) return <SecondaryCard key={account.id} account={account} onDelete={handleDeleteAccount} onEdit={handleEditAccount} draggable onDragStart={handleCardDragStart} onDragEnter={handleCardDragEnter} onDragEnd={handleCardDragEnd} />;
                  return null;
               })}
            </div>

            <ContactsRow contacts={MOCK_CONTACTS} onAddClick={openAddAccount} onContactClick={handleContactClick} isPro={!!userProfile.isPro} />
            <TransactionSummary months={months} activeMonthId={activeMonthId} onSelectMonth={setActiveMonthId} onDeleteMonth={handleDeleteMonth} />
            <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} onEdit={handleEditTransaction} onToggleStatus={handleToggleTransactionStatus} onTogglePaymentMethod={handleTogglePaymentMethod} />
          </>
      );
    }
  };

  const shouldShowSplash = !isSessionReady || (currentUserEmail && isLoadingData && !userProfile.name);
  if (shouldShowSplash) return <SplashScreen />;
  if (!currentUserEmail) return <LoginScreen onLogin={handleLogin} />;
  
  return (
    <div ref={mainScrollRef} className={`h-full overflow-y-auto bg-[#0a0a0b] text-white px-2 pt-4 pb-32 font-sans selection:bg-accent selection:text-black no-scrollbar ${isAnyModalOpen ? 'overflow-hidden' : ''}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {renderView()}
      <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      <AddTransactionModal isOpen={isAddTransactionOpen} onClose={handleCloseTransactionModal} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} activeMonthContext={activeMonthContext} />
      <AddAccountModal isOpen={isAddAccountOpen} onClose={handleCloseAccountModal} onSave={handleSaveAccount} accountToEdit={editingAccount} isPro={!!userProfile.isPro} onOpenProModal={openPro} />
      <CalculatorModal isOpen={isCalculatorOpen} onClose={handleCloseCalculator} />
      <EditProfileModal isOpen={isProfileModalOpen} onClose={handleCloseProfile} onSave={setUserProfile} onLogout={handleLogout} onDeleteAccount={() => {}} currentProfile={userProfile} />
      <NotepadModal isOpen={isNotepadOpen} onClose={handleCloseNotepad} initialContent={notepadContent} initialDrawing={notepadDrawing} onSave={handleSaveNotepad} />
      <CalendarModal isOpen={isCalendarOpen} onClose={handleCloseCalendar} transactions={transactions} activeMonthContext={activeMonthContext} />
      <NotificationModal isOpen={isNotificationOpen} onClose={handleCloseNotification} notifications={notifications} onMarkAllRead={handleMarkAllRead} onDelete={handleDeleteNotification} currentUserEmail={currentUserEmail} />
      <Suspense fallback={null}>{isAnalyticsOpen && <AnalyticsModal isOpen={isAnalyticsOpen} onClose={handleCloseAnalytics} transactions={transactions} months={months} />}</Suspense>
      <ProModal isOpen={isProModalOpen} onClose={handleClosePro} onUpgrade={handleUpgradePro} />
    </div>
  );
};

export default App;
