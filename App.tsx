
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
import ProModal from './components/ProModal'; 
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppTheme, AppView, LongTermTransaction, Investment, AppNotification } from './types';
import { loadData, saveData, STORAGE_KEYS } from './services/storage';
import { IconBell, IconMore } from './components/Icons';
import { Crown, CloudOff, RefreshCw, BarChart3 } from 'lucide-react';

import { loginUser, registerUser, loadUserData, saveCollection, saveUserField, subscribeToUserChanges, deleteUser } from './services/supabase';

// VIP Emails List
const VIP_EMAILS = ['naylanmoreira350@gmail.com', 'lopesisa40@gmail.com'];

// Constants
const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const MONTH_SHORT_CODES: Record<string, string> = {
  'JANEIRO': 'Jan', 'FEVEREIRO': 'Fev', 'MARÇO': 'Mar', 'ABRIL': 'Abr', 'MAIO': 'Mai', 'JUNHO': 'Jun',
  'JULHO': 'Jul', 'AGOSTO': 'Ago', 'SETEMBRO': 'Set', 'OUTUBRO': 'Out', 'NOVEMBRO': 'Nov', 'DEZEMBRO': 'Dez'
};

const SHORT_CODE_TO_FULL: Record<string, string> = {
  'Jan': 'JANEIRO', 'Fev': 'FEVEREIRO', 'Mar': 'MARÇO', 'Abr': 'ABRIL',
  'Mai': 'MAIO', 'Jun': 'JUNHO', 'Jul': 'JULHO', 'Ago': 'AGOSTO',
  'Set': 'SETEMBRO', 'Out': 'OUTUBRO', 'Nov': 'NOVEMBRO', 'Dez': 'DEZEMBRO'
};

// Initial Data
const currentDate = new Date();
const currentMonthName = MONTH_NAMES[currentDate.getMonth()];
const currentYear = currentDate.getFullYear();

const SYSTEM_INITIAL_MONTH: MonthSummary = {
  id: '1',
  month: currentMonthName,
  year: currentYear.toString(),
  total: 0
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

// --- HELPER FUNCTIONS ---
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

const App: React.FC = () => {
  // Auth State
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return loadData(STORAGE_KEYS.USER_SESSION, null);
  });
  
  // Data Loading States
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [syncEnabled, setSyncEnabled] = useState<boolean>(true); // Safety flag

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

  // --- INITIALIZE STATE FROM LOCAL STORAGE (Sync) ---
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadData(STORAGE_KEYS.USER_PROFILE, INITIAL_PROFILE));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadData(STORAGE_KEYS.TRANSACTIONS, []));
  const [accounts, setAccounts] = useState<Account[]>(() => loadData(STORAGE_KEYS.ACCOUNTS, []));
  const [months, setMonths] = useState<MonthSummary[]>(() => loadData(STORAGE_KEYS.MONTHS, [SYSTEM_INITIAL_MONTH]));
  const [longTermTransactions, setLongTermTransactions] = useState<LongTermTransaction[]>(() => loadData(STORAGE_KEYS.LONG_TERM_TRANSACTIONS, []));
  const [investments, setInvestments] = useState<Investment[]>(() => loadData(STORAGE_KEYS.INVESTMENTS, []));
  const [notepadContent, setNotepadContent] = useState<string>(() => loadData(STORAGE_KEYS.NOTEPAD_CONTENT, ''));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadData(STORAGE_KEYS.NOTIFICATIONS, []));
  const [appTheme, setAppTheme] = useState<AppTheme>(() => loadData(STORAGE_KEYS.APP_THEME, AVAILABLE_THEMES[0]));
  const [cdiRate, setCdiRate] = useState<number>(() => loadData(STORAGE_KEYS.CDI_RATE, 11.25));

  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- REFS (Initialize with CURRENT state to avoid immediate save) ---
  const prevTransactionsRef = useRef<string>(JSON.stringify(transactions));
  const prevAccountsRef = useRef<string>(JSON.stringify(accounts));
  const prevInvestmentsRef = useRef<string>(JSON.stringify(investments));
  const prevLongTermRef = useRef<string>(JSON.stringify(longTermTransactions));
  const prevNotificationsRef = useRef<string>(JSON.stringify(notifications));
  const prevMonthsRef = useRef<string>(JSON.stringify(months));
  const prevProfileRef = useRef<string>(JSON.stringify(userProfile));
  const prevThemeRef = useRef<string>(JSON.stringify(appTheme));
  const prevNotepadRef = useRef<string>(notepadContent);
  const prevCdiRef = useRef<number>(cdiRate);

  // --- SCROLL LOCK ---
  useEffect(() => {
    const isAnyModalOpen = isAddTransactionOpen || isAddAccountOpen || isCalculatorOpen || 
      isProfileModalOpen || isNotepadOpen || isCalendarOpen || isNotificationOpen || 
      isAnalyticsOpen || isProModalOpen;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isAddTransactionOpen, isAddAccountOpen, isCalculatorOpen, isProfileModalOpen, isNotepadOpen, isCalendarOpen, isNotificationOpen, isAnalyticsOpen, isProModalOpen]);

  // --- INITIAL DATA LOAD EFFECT ---
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchData = async () => {
      if (!currentUserEmail) return;
      
      setIsLoadingData(true);
      setSyncEnabled(true); 

      try {
        const cloudData = await loadUserData(currentUserEmail);
        
        if (cloudData) {
          // CLOUD DATA LOADED SUCCESSFULLY
          setTransactions(cloudData.transactions);
          setAccounts(cloudData.accounts);
          setInvestments(cloudData.investments);
          setLongTermTransactions(cloudData.longTerm);
          setNotifications(cloudData.notifications);
          setMonths(cloudData.months.length > 0 ? cloudData.months : [SYSTEM_INITIAL_MONTH]);
          setNotepadContent(cloudData.notepadContent);
          setCdiRate(cloudData.cdiRate);
          
          if (cloudData.profile) setUserProfile(cloudData.profile);
          if (cloudData.theme) setAppTheme(cloudData.theme);

          // Update Refs to match Cloud Data (prevents overwriting cloud with old local data)
          prevTransactionsRef.current = JSON.stringify(cloudData.transactions);
          prevAccountsRef.current = JSON.stringify(cloudData.accounts);
          prevInvestmentsRef.current = JSON.stringify(cloudData.investments);
          prevLongTermRef.current = JSON.stringify(cloudData.longTerm);
          prevNotificationsRef.current = JSON.stringify(cloudData.notifications);
          prevMonthsRef.current = JSON.stringify(cloudData.months);
          prevProfileRef.current = JSON.stringify(cloudData.profile || userProfile);
          prevThemeRef.current = JSON.stringify(cloudData.theme || appTheme);
          prevNotepadRef.current = cloudData.notepadContent;
          prevCdiRef.current = cloudData.cdiRate;
          
          // Save fresh copy to local storage
          saveData(STORAGE_KEYS.TRANSACTIONS, cloudData.transactions);
          saveData(STORAGE_KEYS.ACCOUNTS, cloudData.accounts);
          saveData(STORAGE_KEYS.INVESTMENTS, cloudData.investments);
          saveData(STORAGE_KEYS.LONG_TERM_TRANSACTIONS, cloudData.longTerm);
          saveData(STORAGE_KEYS.NOTIFICATIONS, cloudData.notifications);
          saveData(STORAGE_KEYS.MONTHS, cloudData.months);
          saveData(STORAGE_KEYS.USER_PROFILE, cloudData.profile || userProfile);
          saveData(STORAGE_KEYS.APP_THEME, cloudData.theme || appTheme);
          saveData(STORAGE_KEYS.NOTEPAD_CONTENT, cloudData.notepadContent);
          saveData(STORAGE_KEYS.CDI_RATE, cloudData.cdiRate);
        }

        // Setup Realtime Subscription
        unsubscribe = subscribeToUserChanges(currentUserEmail, (newData) => {
           // Only update if we are not currently editing (basic conflict avoidance)
           // For this simple app, we just accept the stream
           setTransactions(newData.transactions);
           setAccounts(newData.accounts);
           setInvestments(newData.investments);
           setLongTermTransactions(newData.longTerm);
           setNotifications(newData.notifications);
           setMonths(newData.months);
           setNotepadContent(newData.notepadContent);
           setCdiRate(newData.cdiRate);
           if (newData.profile) setUserProfile(newData.profile);
           
           // Also update local storage when realtime data comes in
           saveData(STORAGE_KEYS.TRANSACTIONS, newData.transactions);
           // ... (saving other keys implicitly handled by the save effect below anyway, but explicit safety helps)
        });

      } catch (err) {
        console.error("Failed to load cloud data:", err);
        // CRITICAL: Disable Sync to prevent overwriting cloud with potentially empty local data
        setSyncEnabled(false);
        // We stick with the initial local data loaded in useState
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserEmail]);

  // --- SAVE / SYNC EFFECT ---
  useEffect(() => {
    // 1. Always save to LocalStorage (unless strictly loading, to avoid saving empty state over existing storage before hydration)
    if (isLoadingData) return;
    
    // Perform Local Save
    saveData(STORAGE_KEYS.TRANSACTIONS, transactions);
    saveData(STORAGE_KEYS.ACCOUNTS, accounts);
    saveData(STORAGE_KEYS.INVESTMENTS, investments);
    saveData(STORAGE_KEYS.LONG_TERM_TRANSACTIONS, longTermTransactions);
    saveData(STORAGE_KEYS.NOTIFICATIONS, notifications);
    saveData(STORAGE_KEYS.MONTHS, months);
    saveData(STORAGE_KEYS.USER_PROFILE, userProfile);
    saveData(STORAGE_KEYS.APP_THEME, appTheme);
    saveData(STORAGE_KEYS.NOTEPAD_CONTENT, notepadContent);
    saveData(STORAGE_KEYS.CDI_RATE, cdiRate);

    // 2. Conditionally Save to Cloud (Only if user is logged in AND sync is enabled)
    if (!currentUserEmail || !syncEnabled) return;

    // Helper to check and save
    const checkAndSave = async <T,>(
       current: T, 
       ref: React.MutableRefObject<string>, 
       collectionName: string,
       isField: boolean = false
    ) => {
       const currentStr = typeof current === 'string' ? current : JSON.stringify(current);
       if (currentStr !== ref.current) {
          // Save to Cloud
          try {
             let success = false;
             if (isField) {
               success = await saveUserField(currentUserEmail, collectionName, current);
             } else {
               success = await saveCollection(currentUserEmail, collectionName, current as any[]);
             }
             
             // Update ref only if cloud save attempt was made (even if failed, we don't want loop)
             if (success) {
                ref.current = currentStr;
             }
          } catch (e) {
             console.error("Cloud save failed", e);
          }
       }
    };

    // Debounce checks slightly to batch updates
    const timer = setTimeout(() => {
       checkAndSave(transactions, prevTransactionsRef, 'transactions');
       checkAndSave(accounts, prevAccountsRef, 'accounts');
       checkAndSave(investments, prevInvestmentsRef, 'investments');
       checkAndSave(longTermTransactions, prevLongTermRef, 'longTerm');
       checkAndSave(notifications, prevNotificationsRef, 'notifications');
       checkAndSave(months, prevMonthsRef, 'months');
       
       checkAndSave(userProfile, prevProfileRef, 'profile', true);
       checkAndSave(appTheme, prevThemeRef, 'theme', true);
       checkAndSave(notepadContent, prevNotepadRef, 'notepadContent', true);
       checkAndSave(cdiRate, prevCdiRef, 'cdiRate', true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    transactions, accounts, investments, longTermTransactions, notifications, 
    months, userProfile, appTheme, notepadContent, cdiRate, 
    currentUserEmail, isLoadingData, syncEnabled
  ]);


  // --- COMPUTED VALUES ---
  const activeMonthIndex = useMemo(() => {
    const m = months.find(m => m.id === activeMonthId);
    if (!m) return -1;
    return MONTH_NAMES.indexOf(m.month);
  }, [months, activeMonthId]);

  const activeYearStr = useMemo(() => {
    const m = months.find(m => m.id === activeMonthId);
    return m ? m.year : currentYear.toString();
  }, [months, activeMonthId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
       const txMonth = getMonthFromDateStr(t.date);
       const txYear = getYearFromDateStr(t.date, activeYearStr);
       
       const m = months.find(m => m.id === activeMonthId);
       if (!m) return false;
       
       return txMonth === m.month && txYear === m.year;
    });
  }, [transactions, activeMonthId, months, activeYearStr]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  const monthTotal = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  // Update month total when it changes
  useEffect(() => {
    setMonths(prev => prev.map(m => {
      if (m.id === activeMonthId && m.total !== monthTotal) {
        return { ...m, total: monthTotal };
      }
      return m;
    }));
  }, [monthTotal, activeMonthId]);

  // --- HANDLERS ---

  const handleLogin = async (email: string, name?: string) => {
    if (name) {
      // Register flow
      await registerUser(email, name, {
         months: [SYSTEM_INITIAL_MONTH],
         cdiRate: 11.25
      });
    } else {
      // Login flow
      await loginUser(email);
    }
    
    // Success path
    saveData(STORAGE_KEYS.USER_SESSION, email);
    setCurrentUserEmail(email);
  };
  
  const handleLogout = () => {
    saveData(STORAGE_KEYS.USER_SESSION, null);
    setCurrentUserEmail(null);
    setTransactions([]);
    setAccounts([]);
    // Reload to clear memory state cleanly
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
     if (currentUserEmail) {
        if(confirm("Tem certeza absoluta? Todos os seus dados serão apagados permanentemente.")) {
            try {
                await deleteUser(currentUserEmail);
                handleLogout();
            } catch (e) {
                alert("Erro ao excluir conta. Tente novamente.");
            }
        }
     }
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      // Ensure month/year metadata is set correctly for filtering if not implicit
      // Note: we mainly use date string parsing, but adding metadata helps consistency
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, paid: !t.paid } : t
    ));
  };

  const handleTogglePaymentMethod = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, paymentMethod: t.paymentMethod === 'pix' ? 'card' : 'pix' } : t
    ));
  };

  const handleAddAccount = (name: string, balance: number, theme: CardTheme) => {
    if (editingAccount) {
      setAccounts(prev => prev.map(acc => 
        acc.id === editingAccount.id ? { ...acc, name, balance, colorTheme: theme } : acc
      ));
      setEditingAccount(null);
    } else {
      const newAccount: Account = {
        id: crypto.randomUUID(),
        name,
        balance,
        colorTheme: theme
      };
      setAccounts(prev => [newAccount, ...prev]);
    }
  };

  const handleDeleteAccountLocal = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleAddMonth = () => {
     // Logic to add next month
     const lastMonth = months[months.length - 1];
     let nextMonthName = '';
     let nextYear = lastMonth.year;

     const idx = MONTH_NAMES.indexOf(lastMonth.month);
     if (idx === 11) {
       nextMonthName = MONTH_NAMES[0];
       nextYear = (parseInt(lastMonth.year) + 1).toString();
     } else {
       nextMonthName = MONTH_NAMES[idx + 1];
     }

     const newMonth: MonthSummary = {
       id: crypto.randomUUID(),
       month: nextMonthName,
       year: nextYear,
       total: 0
     };

     setMonths(prev => [...prev, newMonth]);
     setActiveMonthId(newMonth.id);
  };
  
  const handleDuplicateMonth = () => {
     // Create Next Month
     const lastMonth = months[months.length - 1];
     let nextMonthName = '';
     let nextYear = lastMonth.year;
     const idx = MONTH_NAMES.indexOf(lastMonth.month);
     if (idx === 11) {
       nextMonthName = MONTH_NAMES[0];
       nextYear = (parseInt(lastMonth.year) + 1).toString();
     } else {
       nextMonthName = MONTH_NAMES[idx + 1];
     }
     
     const newMonth: MonthSummary = {
       id: crypto.randomUUID(),
       month: nextMonthName,
       year: nextYear,
       total: 0
     };
     
     // Clone transactions from active month
     const activeTx = filteredTransactions;
     const newTxList = activeTx.map(tx => {
         // Calculate new date (add 1 month)
         // Parse current date
         let originalDate = new Date();
         if (tx.date.includes('Hoje')) {
             originalDate = new Date();
         } else if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
             originalDate = new Date(tx.date.split(' ')[0] + 'T00:00:00');
         } else {
             // Handle "24 Jan" format is harder without year, try to guess from context
             // For simplicity, if we can't parse easily, we just keep the day and move month
             // But actually, AddTransactionModal saves YYYY-MM-DD now.
             originalDate = new Date(); // fallback
         }
         
         // Move to next month
         const nextDate = new Date(originalDate);
         nextDate.setMonth(nextDate.getMonth() + 1);
         
         return {
             ...tx,
             id: crypto.randomUUID(),
             paid: false, // Reset paid status
             date: nextDate.toISOString().split('T')[0]
         };
     });

     setMonths(prev => [...prev, newMonth]);
     setTransactions(prev => [...newTxList, ...prev]); // Add new cloned txs
     setActiveMonthId(newMonth.id);
  };

  const handleDeleteMonth = (id: string) => {
     const monthToDelete = months.find(m => m.id === id);
     if (!monthToDelete) return;

     // Delete transactions associated with this month
     // We need to match based on the month/year string logic
     const remainingTx = transactions.filter(t => {
         const txMonth = getMonthFromDateStr(t.date);
         const txYear = getYearFromDateStr(t.date, monthToDelete.year);
         return !(txMonth === monthToDelete.month && txYear === monthToDelete.year);
     });

     setTransactions(remainingTx);
     setMonths(prev => prev.filter(m => m.id !== id));
     
     // Set active to previous or first
     if (activeMonthId === id) {
        const remaining = months.filter(m => m.id !== id);
        if (remaining.length > 0) {
           setActiveMonthId(remaining[remaining.length - 1].id);
        } else {
           // Reset to system initial if all deleted? 
           // Usually we prevent deleting the last one in UI, but just in case:
           const resetMonth = { ...SYSTEM_INITIAL_MONTH, id: crypto.randomUUID() };
           setMonths([resetMonth]);
           setActiveMonthId(resetMonth.id);
        }
     }
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
     setUserProfile(updatedProfile);
  };
  
  const handleUpgradeToPro = () => {
    if (totalBalance >= 5) {
       // Deduct from first account found with balance
       const account = accounts.find(a => a.balance >= 5);
       if (account) {
          // Create deduction transaction
          const deduction: Transaction = {
             id: crypto.randomUUID(),
             name: 'Assinatura PRO',
             amount: 5,
             type: 'purchase',
             logoType: 'generic',
             date: new Date().toISOString().split('T')[0],
             paid: true,
             paymentMethod: 'card'
          };
          
          setTransactions(prev => [deduction, ...prev]);
          setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, balance: a.balance - 5 } : a));
          
          setUserProfile(prev => ({ ...prev, isPro: true }));
          setIsProModalOpen(false);
          alert("Bem-vindo ao PRO! R$ 5,00 descontados do seu saldo.");
       }
    } else {
       alert("Saldo insuficiente para assinar o PRO (R$ 5,00).");
    }
  };

  // Render Login if no user
  if (!currentUserEmail) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activeMonthData = months.find(m => m.id === activeMonthId);

  return (
    <div className="min-h-screen bg-background text-white pb-24 relative select-none" style={{ '--color-accent': appTheme.primary, '--color-accent-dark': appTheme.secondary } as React.CSSProperties}>
       
       {/* Global Offline Indicator */}
       {!syncEnabled && (
         <div className="fixed top-0 left-0 right-0 h-1 bg-red-500 z-[100]" title="Offline: Dados salvos apenas no dispositivo" />
       )}

       {/* Main Content based on View */}
       {currentView === 'home' && (
          <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-500">
             
             {/* Header / Profile */}
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                   <div className="relative">
                      <img src={userProfile.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white/10" />
                      {userProfile.isPro && (
                         <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-[#0a0a0b]">
                            <Crown className="w-3 h-3 text-black fill-black" />
                         </div>
                      )}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-gray-400 text-xs font-bold uppercase">Olá,</span>
                      <span className="text-white font-bold text-lg leading-none">{userProfile.name}</span>
                   </div>
                </div>
                <div className="flex gap-3">
                    {!syncEnabled && (
                       <div className="w-10 h-10 flex items-center justify-center bg-red-500/10 rounded-2xl animate-pulse">
                          <CloudOff className="w-5 h-5 text-red-500" />
                       </div>
                    )}
                    <button 
                      onClick={() => setIsAnalyticsOpen(true)} 
                      className="w-10 h-10 flex items-center justify-center bg-surface rounded-2xl hover:bg-surfaceLight transition-colors"
                    >
                       <BarChart3 className="w-6 h-6 text-blue-500" />
                    </button>
                    <IconBell count={notifications.filter(n => !n.read).length} onClick={() => setIsNotificationOpen(true)} />
                </div>
             </div>
             
             {/* Balance Card */}
             <BalanceCard 
                balance={totalBalance} 
                onAddClick={() => setIsAddTransactionOpen(true)}
                onDuplicateClick={handleDuplicateMonth}
                onCalculatorClick={() => setIsCalculatorOpen(true)}
             />
             
             {/* Accounts Row */}
             <div>
                <div className="flex justify-between items-center mb-4 pl-1 pr-1">
                   <h2 className="text-xl font-medium text-gray-400">MINHA RENDA</h2>
                   <button onClick={() => setIsAddAccountOpen(true)} className="bg-[#1c1c1e] w-8 h-8 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors">
                      <IconMore />
                   </button>
                </div>
                {accounts.map(acc => (
                   <SecondaryCard 
                      key={acc.id} 
                      account={acc} 
                      onDelete={handleDeleteAccountLocal} 
                      onEdit={(acc) => {
                         setEditingAccount(acc);
                         setIsAddAccountOpen(true);
                      }}
                   />
                ))}
             </div>

             {/* Quick Access */}
             <ContactsRow 
                contacts={MOCK_CONTACTS} 
                onAddClick={() => setIsAddAccountOpen(true)} 
                onContactClick={(contact) => {
                   if (contact.id === '1') setIsNotepadOpen(true);
                   if (contact.id === '2') setIsCalendarOpen(true);
                   if (contact.id === '3') {
                      if (userProfile.isPro) {
                         setIsAnalyticsOpen(true);
                      } else {
                         setIsProModalOpen(true);
                      }
                   }
                }}
                isPro={userProfile.isPro}
             />

             {/* Transactions */}
             <div className="flex justify-between items-center mt-6 mb-0">
                 <h2 className="text-xl font-medium text-gray-400 pl-1">RESUMO MENSAL</h2>
                 <button 
                   onClick={handleAddMonth}
                   className="text-xs font-bold bg-[#1c1c1e] px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                 >
                   + MÊS
                 </button>
             </div>

             <TransactionSummary 
                months={sortMonths(months)} 
                activeMonthId={activeMonthId} 
                onSelectMonth={setActiveMonthId}
                onDeleteMonth={handleDeleteMonth}
             />
             
             <TransactionList 
                transactions={filteredTransactions} 
                onDelete={handleDeleteTransaction}
                onEdit={(tx) => {
                  setEditingTransaction(tx);
                  setIsAddTransactionOpen(true);
                }}
                onToggleStatus={handleToggleStatus}
                onTogglePaymentMethod={handleTogglePaymentMethod}
             />
          </div>
       )}
       
       {currentView === 'investments' && (
         <InvestmentsView 
            investments={investments}
            onAdd={(inv) => setInvestments(prev => [...prev, { ...inv, id: crypto.randomUUID() }])}
            onEdit={(inv) => setInvestments(prev => prev.map(i => i.id === inv.id ? inv : i))}
            onDelete={(id) => setInvestments(prev => prev.filter(i => i.id !== id))}
            onBack={() => setCurrentView('home')}
            cdiRate={cdiRate}
            onUpdateCdiRate={setCdiRate}
            isPro={userProfile.isPro}
            onOpenProModal={() => setIsProModalOpen(true)}
         />
       )}

       {currentView === 'long-term' && (
         <LongTermView 
            items={longTermTransactions}
            onAdd={(item) => setLongTermTransactions(prev => [...prev, { ...item, id: crypto.randomUUID(), installmentsPaid: 0 }])}
            onEdit={(item) => setLongTermTransactions(prev => prev.map(i => i.id === item.id ? item : i))}
            onDelete={(id) => setLongTermTransactions(prev => prev.filter(i => i.id !== id))}
         />
       )}

       {currentView === 'settings' && (
         <SettingsView 
            currentThemeId={appTheme.id}
            onSaveTheme={setAppTheme}
            isPro={userProfile.isPro || false}
            onOpenProModal={() => setIsProModalOpen(true)}
         />
       )}

       <BottomNav currentView={currentView} onChangeView={setCurrentView} />

       {/* Modals */}
       <AddTransactionModal 
         isOpen={isAddTransactionOpen} 
         onClose={() => {
            setIsAddTransactionOpen(false);
            setEditingTransaction(null);
         }} 
         onSave={editingTransaction ? (data) => {
            handleEditTransaction({ ...data, id: editingTransaction.id });
            setIsAddTransactionOpen(false);
         } : handleAddTransaction}
         transactionToEdit={editingTransaction}
         activeMonthContext={activeMonthData ? { 
             monthIndex: MONTH_NAMES.indexOf(activeMonthData.month), 
             year: parseInt(activeMonthData.year) 
         } : undefined}
       />

       <AddAccountModal 
         isOpen={isAddAccountOpen} 
         onClose={() => {
           setIsAddAccountOpen(false);
           setEditingAccount(null);
         }}
         onSave={handleAddAccount}
         accountToEdit={editingAccount}
         isPro={userProfile.isPro}
         onOpenProModal={() => setIsProModalOpen(true)}
       />

       <CalculatorModal 
         isOpen={isCalculatorOpen}
         onClose={() => setIsCalculatorOpen(false)}
       />

       <EditProfileModal 
         isOpen={isProfileModalOpen}
         onClose={() => setIsProfileModalOpen(false)}
         onSave={handleUpdateProfile}
         onLogout={handleLogout}
         onDeleteAccount={handleDeleteAccount}
         currentProfile={userProfile}
       />

       <NotepadModal 
          isOpen={isNotepadOpen}
          onClose={() => setIsNotepadOpen(false)}
          initialContent={notepadContent}
          onSave={setNotepadContent}
       />

       <CalendarModal 
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          transactions={transactions}
          activeMonthContext={activeMonthData ? { 
             monthIndex: MONTH_NAMES.indexOf(activeMonthData.month), 
             year: parseInt(activeMonthData.year) 
         } : undefined}
       />

       <NotificationModal 
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onMarkAllRead={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
          onDelete={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
          currentUserEmail={currentUserEmail}
       />

       <AnalyticsModal 
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          transactions={transactions}
          months={months}
       />
       
       <ProModal 
          isOpen={isProModalOpen}
          onClose={() => setIsProModalOpen(false)}
          onUpgrade={handleUpgradeToPro}
       />

    </div>
  );
};

export default App;
