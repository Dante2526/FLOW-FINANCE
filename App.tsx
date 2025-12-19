
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
  'JANEIRO': 'Jan', 'FEVEREIRO': 'Fev', 'MARÇO': 'Mar', 'ABRIL': 'Abr',
  'MAIO': 'Mai', 'JUNHO': 'Jun', 'JULHO': 'Jul', 'AGOSTO': 'Ago',
  'SETEMBRO': 'Set', 'OUTUBRO': 'Out', 'NOVEMBRO': 'Nov', 'DEZEMBRO': 'Dez'
};

const SHORT_CODE_TO_FULL: Record<string, string> = {
  'Jan': 'JANEIRO', 'Fev': 'FEVEREIRO', 'Mar': 'MARÇO', 'Abr': 'ABRIL',
  'Mai': 'MAIO', 'Jun': 'JUNHO', 'Jul': 'JULHO', 'Ago': 'AGOSTO',
  'Set': 'SETEMBRO', 'Out': 'OUTUBRO', 'Nov': 'NOVEMBRO', 'Dez': 'DEZEMBRO'
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
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

const roundMoney = (amount: number) => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

// --- INITIAL STATE ---
const currentDate = new Date();
const currentMonthIndex = currentDate.getMonth();
const currentYear = currentDate.getFullYear();
const currentMonthName = MONTH_NAMES[currentMonthIndex];

const SYSTEM_INITIAL_MONTH: MonthSummary = {
  id: '00000000-0000-0000-0000-000000000001', 
  month: currentMonthName,
  year: currentYear.toString(),
  total: 0,
  count: 0
};

// --- DATA MIGRATION HELPER ---
const sanitizeDataIds = (data: any) => {
  let hasChanges = false;
  const idMap: Record<string, string> = {}; 

  const processList = (list: any[]) => {
    if (!list) return [];
    return list.map(item => {
      if (item.id && !isValidUUID(item.id)) {
        if (!idMap[item.id]) idMap[item.id] = generateUUID();
        hasChanges = true;
        return { ...item, id: idMap[item.id] };
      }
      return item;
    });
  };

  const newMonths = processList(data.months);
  const validMonthKeys = new Set(newMonths.map((m: any) => `${m.month}|${m.year}`));

  const rawTransactions = processList(data.transactions);
  const uniqueTxMap = new Set<string>();
  const newTransactions: any[] = [];

  if (rawTransactions) {
      rawTransactions.forEach((tx: any) => {
        if (tx.month && tx.year) {
            const key = `${tx.month}|${tx.year}`;
            if (!validMonthKeys.has(key)) {
                hasChanges = true;
                return; 
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
     newDashboardOrder = newDashboardOrder.map((id: string) => idMap[id] || id);
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
  if (dateStr.toLowerCase().includes('hoje')) return MONTH_NAMES[new Date().getMonth()];
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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => !!loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isSessionReady, setIsSessionReady] = useState(false);
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
  
  const isAnyModalOpen = isAddTransactionOpen || isAddAccountOpen || isCalculatorOpen || isProfileModalOpen || isNotepadOpen || isCalendarOpen || isNotificationOpen || isAnalyticsOpen || isProModalOpen;

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
  const [appTheme, setAppTheme] = useState<AppTheme>(() => loadData(STORAGE_KEYS.APP_THEME, AVAILABLE_THEMES[0]));
  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- REFS ---
  const dragItem = useRef<string | null>(null);
  const lastDragUpdate = useRef<number>(0);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const lastActionTimeRef = useRef<number>(0); // CRITICAL: Para evitar race conditions
  const pendingMonthCreationRef = useRef<string | null>(null);
  const prevMonthsRef = useRef<string>(JSON.stringify(months));
  const prevDashboardOrderRef = useRef<string>(JSON.stringify(dashboardOrder));

  const currentStateRef = useRef({
    transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder
  });

  useEffect(() => {
    currentStateRef.current = { transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder };
  });

  // --- APPLY THEME ---
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', appTheme.primary);
    root.style.setProperty('--color-accent-dark', appTheme.secondary);
  }, [appTheme]);

  // --- AUTO-CALCULATE MONTH TOTALS ---
  useEffect(() => {
    setMonths(prevMonths => {
      let hasChanged = false;
      const updatedMonths = prevMonths.map(month => {
        const monthTransactions = transactions.filter(t => {
             const tMonth = t.month || getMonthFromDateStr(t.date);
             const tYear = t.year || getYearFromDateStr(t.date, month.year);
             return tMonth === month.month && tYear === month.year;
        });
        const monthTotal = roundMoney(monthTransactions.reduce((sum, t) => sum + t.amount, 0));
        const count = monthTransactions.length;
        if (month.total !== monthTotal || month.count !== count) {
          hasChanged = true;
          return { ...month, total: monthTotal, count };
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
        const newIds = accounts.filter(acc => !currentSet.has(acc.id)).map(a => a.id);
        if (newIds.length === 0 && currentSet.has(BALANCE_CARD_ID)) return prev;
        const nextOrder = currentSet.has(BALANCE_CARD_ID) ? [...prev] : [BALANCE_CARD_ID, ...prev];
        return Array.from(new Set([...nextOrder, ...newIds]));
     });
  }, [accounts]);

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
       } else if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
          saveData(STORAGE_KEYS.USER_SESSION, session.user.email);
       }
       setIsSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- LOAD DATA ---
  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;
    setIsLoadingData(true);
    loadUserData(currentUserEmail).then((data) => {
        if (data) {
          const { hasChanges, data: cleanData, idMap } = sanitizeDataIds(data);
          applyData(cleanData);
          if (hasChanges && currentUserEmail) {
             if (idMap[activeMonthId]) setActiveMonthId(idMap[activeMonthId]);
             saveCollection(currentUserEmail, "transactions", cleanData.transactions);
             saveCollection(currentUserEmail, "accounts", cleanData.accounts);
             saveCollection(currentUserEmail, "months", cleanData.months.map(({ count, ...rest }: any) => rest));
             saveUserField(currentUserEmail, "dashboardOrder", cleanData.dashboardOrder);
          }
        }
    }).catch(err => console.error("Load Error:", err)).finally(() => setIsLoadingData(false));
  }, [currentUserEmail, isSessionReady]);

  // --- REALTIME & FOCUS ---
  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;
    const handleSync = () => {
       // BLOQUEIO DE 20 SEGUNDOS APÓS AÇÕES CRÍTICAS
       if (Date.now() - lastActionTimeRef.current < 20000) return;
       loadUserData(currentUserEmail).then((data) => {
           if (data) {
              const { data: cleanData } = sanitizeDataIds(data);
              applyData(cleanData);
           }
       });
    };
    const unsubscribe = subscribeToUserChanges(currentUserEmail, handleSync);
    window.addEventListener('focus', handleSync);
    return () => { 
        unsubscribe(); 
        window.removeEventListener('focus', handleSync);
    };
  }, [currentUserEmail, isSessionReady]);

  const applyData = (data: any) => {
      if (data.profile) setUserProfile(data.profile);
      if (data.transactions) setTransactions(data.transactions);
      if (data.accounts) setAccounts(data.accounts);
      if (data.investments) setInvestments(data.investments);
      if (data.longTerm) setLongTermTransactions(data.longTerm);
      if (data.notifications) setNotifications(data.notifications);
      if (data.theme) { setAppTheme(data.theme); saveData(STORAGE_KEYS.APP_THEME, data.theme); }
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
      if (data.dashboardOrder) { setDashboardOrder(data.dashboardOrder); prevDashboardOrderRef.current = JSON.stringify(data.dashboardOrder); }
  };

  // --- AUTO-SAVE EFFECTS (PROTEGIDOS) ---
  useEffect(() => {
    if (currentUserEmail && !isLoadingData && Date.now() - lastActionTimeRef.current > 20000) {
      const currentStr = JSON.stringify(months);
      if (currentStr !== prevMonthsRef.current) {
        const timer = setTimeout(() => {
          saveCollection(currentUserEmail, "months", months.map(({ count, ...rest }) => rest));
          prevMonthsRef.current = currentStr;
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [months, currentUserEmail, isLoadingData]);

  // --- ACTIONS ---
  const handleDuplicateMonth = useCallback(async () => {
    const currentData = currentStateRef.current;
    const activeM = currentData.months.find(m => m.id === activeMonthId) || currentData.months[0];
    if (!activeM) return;

    let nextMonthIndex = MONTH_NAMES.indexOf(activeM.month) + 1;
    let nextYear = parseInt(activeM.year);
    if (nextMonthIndex > 11) { nextMonthIndex = 0; nextYear += 1; }
    const nextMonthName = MONTH_NAMES[nextMonthIndex];
    const nextYearStr = nextYear.toString();
    const creationKey = `${nextMonthName}-${nextYearStr}`;

    if (pendingMonthCreationRef.current === creationKey) return;
    const exists = currentData.months.find(m => m.month === nextMonthName && m.year === nextYearStr);
    if (exists) { setActiveMonthId(exists.id); return; }

    pendingMonthCreationRef.current = creationKey;
    lastActionTimeRef.current = Date.now(); // ATIVA BLOQUEIO

    const newMonthId = generateUUID();
    const sourceTx = currentData.transactions.filter(tx => (tx.month || getMonthFromDateStr(tx.date)) === activeM.month && (tx.year || getYearFromDateStr(tx.date, activeM.year)) === activeM.year);
    
    const newTx: Transaction[] = sourceTx.map((tx, idx) => ({
        ...tx, id: generateUUID(), month: nextMonthName, year: nextYearStr, paid: false, createdAt: new Date(Date.now() - idx * 10).toISOString()
    }));

    const sourceAcc = currentData.accounts.filter(acc => acc.month === activeM.month && acc.year === activeM.year);
    const newAcc: Account[] = sourceAcc.map(acc => ({ ...acc, id: generateUUID(), month: nextMonthName, year: nextYearStr }));

    const newMonth: MonthSummary = { id: newMonthId, month: nextMonthName, year: nextYearStr, total: roundMoney(newTx.reduce((s, t) => s + t.amount, 0)), count: newTx.length };
    const updatedMonths = sortMonths([...currentData.months, newMonth]);

    // SINCRONIA PREVENTIVA DAS REFS PARA EVITAR SOBRESCRITA PELO AUTO-SAVE
    prevMonthsRef.current = JSON.stringify(updatedMonths);
    setMonths(updatedMonths);
    setTransactions([...newTx, ...currentData.transactions]);
    setAccounts([...currentData.accounts, ...newAcc]);
    setActiveMonthId(newMonthId);

    if (currentUserEmail) {
        await Promise.all([
           saveCollection(currentUserEmail, "months", updatedMonths.map(({ count, ...rest }) => rest)),
           saveCollection(currentUserEmail, "transactions", [...newTx, ...currentData.transactions]),
           saveCollection(currentUserEmail, "accounts", [...currentData.accounts, ...newAcc])
        ]);
        lastActionTimeRef.current = Date.now(); // RENOVA BLOQUEIO
    }
    setTimeout(() => { pendingMonthCreationRef.current = null; }, 3000);
  }, [activeMonthId, currentUserEmail]);

  const handleDeleteMonth = useCallback(async (id: string) => {
     if (months.length <= 1) return;
     const monthToDelete = months.find(m => m.id === id);
     if (!monthToDelete) return;
     
     lastActionTimeRef.current = Date.now(); // ATIVA BLOQUEIO

     const updatedMonths = months.filter(m => m.id !== id);
     const updatedTx = currentStateRef.current.transactions.filter(t => !(t.month === monthToDelete.month && t.year === monthToDelete.year));
     const updatedAcc = currentStateRef.current.accounts.filter(a => !(a.month === monthToDelete.month && a.year === monthToDelete.year));

     prevMonthsRef.current = JSON.stringify(updatedMonths);
     setMonths(updatedMonths);
     setTransactions(updatedTx);
     setAccounts(updatedAcc);
     
     if (activeMonthId === id) {
        const sorted = sortMonths(updatedMonths);
        if (sorted.length > 0) setActiveMonthId(sorted[sorted.length - 1].id);
     }

     if (currentUserEmail) {
        try {
            await Promise.all([
               deleteItem(currentUserEmail, "months", id),
               saveCollection(currentUserEmail, "transactions", updatedTx),
               saveCollection(currentUserEmail, "accounts", updatedAcc)
            ]);
            lastActionTimeRef.current = Date.now(); // RENOVA BLOQUEIO
        } catch (e) { console.error("Delete Fail:", e); }
     }
  }, [months, activeMonthId, currentUserEmail]);

  // --- OUTROS HANDLERS ---
  const handleSaveTransaction = useCallback((txData: any) => { 
      setTransactions(prev => {
         if (editingTransaction) {
             const updated = { ...editingTransaction, ...txData };
             if(currentUserEmail) upsertItem(currentUserEmail, 'transactions', updated);
             return prev.map(t => t.id === editingTransaction.id ? updated : t);
         } else {
             const newTx = { id: generateUUID(), ...txData, month: currentStateRef.current.months.find(m => m.id === activeMonthId)?.month, year: currentStateRef.current.months.find(m => m.id === activeMonthId)?.year, createdAt: new Date().toISOString() };
             if(currentUserEmail) upsertItem(currentUserEmail, 'transactions', newTx);
             return [newTx, ...prev];
         }
      });
      setEditingTransaction(null);
  }, [editingTransaction, activeMonthId, currentUserEmail]);

  const handleSaveAccount = useCallback((name: string, balance: number, theme: CardTheme) => {
    const activeM = currentStateRef.current.months.find(m => m.id === activeMonthId);
    if (editingAccount) {
      const updated = { ...editingAccount, name, balance, colorTheme: theme };
      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? updated : acc));
      if (currentUserEmail) upsertItem(currentUserEmail, 'accounts', updated);
      setEditingAccount(null);
    } else {
      const newAcc = { id: generateUUID(), name, balance, colorTheme: theme, month: activeM?.month, year: activeM?.year };
      setAccounts(prev => [...prev, newAcc]);
      if (currentUserEmail) upsertItem(currentUserEmail, 'accounts', newAcc);
    }
  }, [editingAccount, activeMonthId, currentUserEmail]);

  const handleDeleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    setDashboardOrder(prev => prev.filter(oid => oid !== id));
    if (currentUserEmail) deleteItem(currentUserEmail, 'accounts', id);
  }, [currentUserEmail]);

  const handleDeleteTransaction = useCallback((id: string) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (currentUserEmail) deleteItem(currentUserEmail, 'transactions', id);
  }, [currentUserEmail]);

  const filteredTransactions = useMemo(() => {
    const activeM = months.find(m => m.id === activeMonthId) || months[0];
    return transactions.filter(tx => (tx.month || getMonthFromDateStr(tx.date)) === activeM.month && (tx.year || getYearFromDateStr(tx.date, activeM.year)) === activeM.year);
  }, [transactions, months, activeMonthId]);

  const filteredAccounts = useMemo(() => {
    const activeM = months.find(m => m.id === activeMonthId) || months[0];
    return accounts.filter(acc => acc.month === activeM.month && acc.year === activeM.year);
  }, [accounts, months, activeMonthId]);

  const dashboardItems = useMemo(() => {
    const items: string[] = [];
    dashboardOrder.forEach(id => {
      if (id === BALANCE_CARD_ID) items.push(id);
      else if (filteredAccounts.find(a => a.id === id)) items.push(id);
    });
    filteredAccounts.forEach(a => { if (!items.includes(a.id)) items.push(a.id); });
    if (!items.includes(BALANCE_CARD_ID)) items.unshift(BALANCE_CARD_ID);
    return Array.from(new Set(items));
  }, [dashboardOrder, filteredAccounts]);

  if (!currentUserEmail) return <LoginScreen onLogin={async (e, n) => { 
    if (n) await registerUser(e, n, { months: [SYSTEM_INITIAL_MONTH] }); else await loginUser(e); 
    setCurrentUserEmail(e); saveData(STORAGE_KEYS.USER_SESSION, e);
  }} />;

  if (isLoadingData && !userProfile.name) return <SplashScreen />;

  return (
    <div ref={mainScrollRef} className={`h-full overflow-y-auto bg-[#0a0a0b] text-white px-2 pt-4 pb-32 font-sans selection:bg-accent selection:text-black no-scrollbar ${isAnyModalOpen ? 'overflow-hidden' : ''}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {currentView === 'home' ? (
          <>
            <div className="flex justify-between items-center mb-6 pl-1">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
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
              <div className="flex items-center gap-2"><IconBell count={notifications.filter(n => !n.read).length} onClick={() => setIsNotificationOpen(true)} /></div>
            </div>
            <div className="flex flex-col gap-2 mb-6">
               {dashboardItems.map((id) => {
                  if (id === BALANCE_CARD_ID) return <BalanceCard key={id} id={id} balance={(filteredAccounts.reduce((a, b) => a + b.balance, 0) - filteredTransactions.reduce((a, b) => a + b.amount, 0))} onAddClick={() => setIsAddTransactionOpen(true)} onDuplicateClick={handleDuplicateMonth} onCalculatorClick={() => setIsCalculatorOpen(true)} draggable onDragStart={id => dragItem.current = id} onDragEnter={targetId => { if (dragItem.current && dragItem.current !== targetId) { const newOrder = [...dashboardOrder]; const dIdx = newOrder.indexOf(dragItem.current); const tIdx = newOrder.indexOf(targetId); if (dIdx !== -1 && tIdx !== -1) { newOrder.splice(dIdx, 1); newOrder.splice(tIdx, 0, dragItem.current); setDashboardOrder(newOrder); } } }} onDragEnd={() => dragItem.current = null} />;
                  const account = filteredAccounts.find(a => a.id === id);
                  if (account) return <SecondaryCard key={account.id} account={account} onDelete={handleDeleteAccount} onEdit={acc => { setEditingAccount(acc); setIsAddAccountOpen(true); }} draggable onDragStart={id => dragItem.current = id} onDragEnter={targetId => { if (dragItem.current && dragItem.current !== targetId) { const newOrder = [...dashboardOrder]; const dIdx = newOrder.indexOf(dragItem.current); const tIdx = newOrder.indexOf(targetId); if (dIdx !== -1 && tIdx !== -1) { newOrder.splice(dIdx, 1); newOrder.splice(tIdx, 0, dragItem.current); setDashboardOrder(newOrder); } } }} onDragEnd={() => dragItem.current = null} />;
                  return null;
               })}
            </div>
            <ContactsRow contacts={MOCK_CONTACTS} onAddClick={() => setIsAddAccountOpen(true)} onContactClick={c => { if (c.id === '1') setIsNotepadOpen(true); else if (c.id === '2') setIsCalendarOpen(true); else if (c.id === '3') { if (!userProfile.isPro) setIsProModalOpen(true); else setIsAnalyticsOpen(true); } }} isPro={!!userProfile.isPro} />
            <TransactionSummary months={months} activeMonthId={activeMonthId} onSelectMonth={setActiveMonthId} onDeleteMonth={handleDeleteMonth} />
            <TransactionList transactions={filteredTransactions} onDelete={handleDeleteTransaction} onEdit={tx => { setEditingTransaction(tx); setIsAddTransactionOpen(true); }} onToggleStatus={id => setTransactions(p => p.map(t => t.id === id ? { ...t, paid: !t.paid } : t))} onTogglePaymentMethod={id => setTransactions(p => p.map(t => t.id === id ? { ...t, paymentMethod: t.paymentMethod === 'pix' ? 'card' : 'pix' } as Transaction : t))} />
          </>
      ) : currentView === 'settings' ? (
          <SettingsView currentThemeId={appTheme.id} onSaveTheme={t => { setAppTheme(t); saveData(STORAGE_KEYS.APP_THEME, t); if(currentUserEmail) saveUserField(currentUserEmail, 'theme', t); setCurrentView('home'); }} isPro={!!userProfile.isPro} onOpenProModal={() => setIsProModalOpen(true)} />
      ) : currentView === 'long-term' ? (
          <LongTermView items={longTermTransactions} onAdd={i => { const n = { ...i, id: generateUUID(), installmentsPaid: 0 }; setLongTermTransactions(p => [...p, n]); if(currentUserEmail) upsertItem(currentUserEmail, 'longTerm', n); }} onEdit={i => { setLongTermTransactions(p => p.map(o => o.id === i.id ? i : o)); if(currentUserEmail) upsertItem(currentUserEmail, 'longTerm', i); }} onDelete={id => { setLongTermTransactions(p => p.filter(i => i.id !== id)); if(currentUserEmail) deleteItem(currentUserEmail, 'longTerm', id); }} />
      ) : (
          <InvestmentsView investments={investments} onAdd={i => { const n = { ...i, id: generateUUID() }; setInvestments(p => [...p, n]); if(currentUserEmail) upsertItem(currentUserEmail, 'investments', n); }} onEdit={i => { setInvestments(p => p.map(o => o.id === i.id ? i : o)); if(currentUserEmail) upsertItem(currentUserEmail, 'investments', i); }} onDelete={id => { setInvestments(p => p.filter(i => i.id !== id)); if(currentUserEmail) deleteItem(currentUserEmail, 'investments', id); }} onBack={() => setCurrentView('home')} cdiRate={cdiRate} onUpdateCdiRate={r => { setCdiRate(r); if(currentUserEmail) saveUserField(currentUserEmail, 'cdiRate', r); }} isPro={!!userProfile.isPro} onOpenProModal={() => setIsProModalOpen(true)} />
      )}
      <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      <AddTransactionModal isOpen={isAddTransactionOpen} onClose={() => { setIsAddTransactionOpen(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} />
      <AddAccountModal isOpen={isAddAccountOpen} onClose={() => { setIsAddAccountOpen(false); setEditingAccount(null); }} onSave={handleSaveAccount} accountToEdit={editingAccount} isPro={!!userProfile.isPro} onOpenProModal={() => setIsProModalOpen(true)} />
      <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={p => { setUserProfile(p); if(currentUserEmail) saveUserField(currentUserEmail, 'profile', p); }} onLogout={async () => { localStorage.removeItem(STORAGE_KEYS.USER_SESSION); await supabase.auth.signOut(); setCurrentUserEmail(null); }} onDeleteAccount={() => {}} currentProfile={userProfile} />
      <NotepadModal isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)} initialContent={notepadContent} initialDrawing={notepadDrawing} onSave={(c, d) => { setNotepadContent(c); setNotepadDrawing(d); if(currentUserEmail) { saveUserField(currentUserEmail, 'notepadContent', c); saveUserField(currentUserEmail, 'notepadDrawing', d); } }} />
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} transactions={transactions} />
      <NotificationModal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} notifications={notifications} onMarkAllRead={() => { setNotifications([]); if(currentUserEmail) saveCollection(currentUserEmail, 'notifications', []); }} onDelete={id => { setNotifications(p => p.filter(n => n.id !== id)); if(currentUserEmail) deleteItem(currentUserEmail, 'notifications', id); }} currentUserEmail={currentUserEmail} />
      <Suspense fallback={null}>{isAnalyticsOpen && <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} transactions={transactions} months={months} />}</Suspense>
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} onUpgrade={() => { setUserProfile(p => ({...p, isPro: true})); setIsProModalOpen(false); if(currentUserEmail) saveUserField(currentUserEmail, 'profile', { ...userProfile, isPro: true }); }} />
    </div>
  );
};

export default App;
