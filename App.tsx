
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
import SettingsView, { AVAILABLE_THEMES } from './components/SettingsView';
import LongTermView from './components/LongTermView';
import InvestmentsView from './components/InvestmentsView';
import LoginScreen, { FlowLogo } from './components/LoginScreen';
import ProModal from './components/ProModal'; 
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppTheme, AppView, LongTermTransaction, Investment, AppNotification } from './types';
import { loadData, saveData, STORAGE_KEYS } from './services/storage';
import { IconBell } from './components/Icons';
import { Crown } from 'lucide-react';

// Supabase Services
import { loginUser, registerUser, loadUserData, saveCollection, saveUserField, subscribeToUserChanges, supabase, VAPID_PUBLIC_KEY, upsertItem, deleteItem, hardDeleteMonth } from './services/supabase';

const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal'));

const MONTH_NAMES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

const SHORT_CODE_TO_FULL: Record<string, string> = {
  'Jan': 'JANEIRO', 'Fev': 'FEVEREIRO', 'Mar': 'MARÇO', 'Abr': 'ABRIL', 'Mai': 'MAIO', 'Jun': 'JUNHO', 'Jul': 'JULHO', 'Ago': 'AGOSTO', 'Set': 'SETEMBRO', 'Out': 'OUTUBRO', 'Nov': 'NOVEMBRO', 'Dez': 'DEZEMBRO'
};

const generateUUID = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | 0).toString(16));
const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

const currentDate = new Date();
const SYSTEM_INITIAL_MONTH: MonthSummary = { id: '00000000-0000-0000-0000-000000000001', month: MONTH_NAMES[currentDate.getMonth()], year: currentDate.getFullYear().toString(), total: 0, count: 0 };

const MOCK_CONTACTS: Contact[] = [{ id: '1', name: 'Notas', imageUrl: '' }, { id: '2', name: 'Calendário', imageUrl: '' }, { id: '3', name: 'Análise', imageUrl: '' }];
const INITIAL_PROFILE: UserProfile = { name: '', subtitle: '', avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix', isPro: false };
const BALANCE_CARD_ID = 'balance-card';

const getMonthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.toLowerCase().includes('hoje')) return MONTH_NAMES[new Date().getMonth()];
  const parts = dateStr.split(' ');
  if (parts.length >= 2 && !dateStr.includes('-')) return SHORT_CODE_TO_FULL[parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase()] || '';
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return MONTH_NAMES[new Date(dateStr.split(' ')[0] + 'T00:00:00').getMonth()];
  return '';
};

const getYearFromDateStr = (dateStr: string, activeYearContext?: string): string => {
  if (dateStr.toLowerCase().includes('hoje')) return new Date().getFullYear().toString();
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr.split('-')[0];
  return activeYearContext || new Date().getFullYear().toString();
};

const sortMonths = (list: MonthSummary[]) => [...list].sort((a, b) => {
    const yA = parseInt(a.year), yB = parseInt(b.year);
    if (yA !== yB) return yA - yB;
    return MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month);
});

const SplashScreen = () => (
  <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[100] animate-out fade-out duration-700">
    <div className="w-32 h-32 bg-[#1c1c1e] rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-black/20 mb-6">
       <FlowLogo className="w-24 h-24 text-accent" />
    </div>
    <div className="flex flex-col items-center gap-2">
       <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">v1.4.2 • Layout Consistency Fix</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => !!loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');

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

  const dragItem = useRef<string | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const lastActionTimeRef = useRef<number>(0); 
  const prevMonthsRef = useRef<string>(JSON.stringify(months));
  const prevDashboardOrderRef = useRef<string>(JSON.stringify(dashboardOrder));

  const currentStateRef = useRef({ transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder });
  useEffect(() => { currentStateRef.current = { transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder }; });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', appTheme.primary);
    root.style.setProperty('--color-accent-dark', appTheme.secondary);
  }, [appTheme]);

  useEffect(() => {
    setMonths(prev => {
      let changed = false;
      const updated = prev.map(m => {
        const mTx = transactions.filter(t => (t.month || getMonthFromDateStr(t.date)) === m.month && (t.year || getYearFromDateStr(t.date, m.year)) === m.year);
        const total = roundMoney(mTx.reduce((s, t) => s + t.amount, 0)), count = mTx.length;
        if (m.total !== total || m.count !== count) { changed = true; return { ...m, total, count }; }
        return m;
      });
      return changed ? updated : prev;
    });
  }, [transactions]); 

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
       if (event === 'SIGNED_OUT') { setCurrentUserEmail(null); localStorage.removeItem(STORAGE_KEYS.USER_SESSION); }
       else if (session?.user?.email) { setCurrentUserEmail(session.user.email); saveData(STORAGE_KEYS.USER_SESSION, session.user.email); }
       setIsSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;
    setIsLoadingData(true);
    loadUserData(currentUserEmail).then(data => {
        if (data) applyData(data);
    }).finally(() => setIsLoadingData(false));
  }, [currentUserEmail, isSessionReady]);

  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;
    const handleSync = () => {
       if (Date.now() - lastActionTimeRef.current < 20000) return;
       loadUserData(currentUserEmail).then(data => data && applyData(data));
    };
    const unsubscribe = subscribeToUserChanges(currentUserEmail, handleSync);
    window.addEventListener('focus', handleSync);
    return () => { unsubscribe(); window.removeEventListener('focus', handleSync); };
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
        if (activeMonthId === SYSTEM_INITIAL_MONTH.id || !sorted.find(m => m.id === activeMonthId)) setActiveMonthId(sorted[sorted.length - 1].id);
        prevMonthsRef.current = JSON.stringify(sorted);
      }
      if (data.cdiRate !== undefined) setCdiRate(data.cdiRate);
      if (data.dashboardOrder) { setDashboardOrder(data.dashboardOrder); prevDashboardOrderRef.current = JSON.stringify(data.dashboardOrder); }
  };

  useEffect(() => {
    if (currentUserEmail && !isLoadingData && Date.now() - lastActionTimeRef.current > 20000) {
      const cur = JSON.stringify(months);
      if (cur !== prevMonthsRef.current) {
        const t = setTimeout(() => { saveCollection(currentUserEmail, "months", months.map(({ count, ...rest }) => rest)); prevMonthsRef.current = cur; }, 1500);
        return () => clearTimeout(t);
      }
    }
  }, [months, currentUserEmail, isLoadingData]);

  // Sync dashboardOrder global list automatically when new accounts are added externally
  useEffect(() => {
    if (accounts.length > 0 && Date.now() - lastActionTimeRef.current > 20000) {
      setDashboardOrder(prev => {
        const set = new Set(prev);
        const newOnes = accounts.filter(a => !set.has(a.id)).map(a => a.id);
        if (newOnes.length === 0) return prev;
        return [...prev, ...newOnes];
      });
    }
  }, [accounts]);

  const handleDuplicateMonth = useCallback(async () => {
    const cur = currentStateRef.current;
    const act = cur.months.find(m => m.id === activeMonthId) || cur.months[0];
    if (!act) return;
    let nIdx = MONTH_NAMES.indexOf(act.month) + 1, nYr = parseInt(act.year);
    if (nIdx > 11) { nIdx = 0; nYr += 1; }
    const nName = MONTH_NAMES[nIdx], nYrS = nYr.toString();
    if (cur.months.find(m => m.month === nName && m.year === nYrS)) return;

    lastActionTimeRef.current = Date.now();
    const nId = generateUUID();
    
    // Duplicate Transactions
    const nTx: Transaction[] = cur.transactions
      .filter(t => (t.month || getMonthFromDateStr(t.date)) === act.month && (t.year || getYearFromDateStr(t.date, act.year)) === act.year)
      .map((t, i) => ({ ...t, id: generateUUID(), month: nName, year: nYrS, paid: false, createdAt: new Date(Date.now() - i * 10).toISOString() }));

    // Duplicate Accounts + Maintain ID mapping for order preservation
    const oldToNewAccMap = new Map<string, string>();
    const sourceAcc = cur.accounts.filter(a => a.month === act.month && a.year === act.year);
    const nAcc: Account[] = sourceAcc.map(a => {
        const newId = generateUUID();
        oldToNewAccMap.set(a.id, newId);
        return { ...a, id: newId, month: nName, year: nYrS };
    });

    const nMonth = { id: nId, month: nName, year: nYrS, total: roundMoney(nTx.reduce((s, t) => s + t.amount, 0)), count: nTx.length };
    const updMonths = sortMonths([...cur.months, nMonth]);

    // PRESERVE DASHBOARD ORDER: Construct new order list mirroring the source month
    const currentOrder = cur.dashboardOrder;
    const newOrderSegment: string[] = [];
    currentOrder.forEach(id => {
       if (id === BALANCE_CARD_ID) {
          // Balance card is singleton, no new ID
       } else if (oldToNewAccMap.has(id)) {
          newOrderSegment.push(oldToNewAccMap.get(id)!);
       }
    });
    
    // Ensure all new accounts are in the order list even if source wasn't (safety)
    nAcc.forEach(a => { if (!newOrderSegment.includes(a.id)) newOrderSegment.push(a.id); });

    // Join with existing global order (appends new IDs at the end but they will be filtered correctly in dItems)
    const finalDashboardOrder = Array.from(new Set([...currentOrder, ...newOrderSegment]));

    prevMonthsRef.current = JSON.stringify(updMonths);
    prevDashboardOrderRef.current = JSON.stringify(finalDashboardOrder);

    setMonths(updMonths);
    setTransactions([...nTx, ...cur.transactions]);
    setAccounts([...cur.accounts, ...nAcc]);
    setDashboardOrder(finalDashboardOrder);
    setActiveMonthId(nId);

    if (currentUserEmail) {
        await Promise.all([
          saveCollection(currentUserEmail, "months", updMonths.map(({ count, ...rest }) => rest)), 
          saveCollection(currentUserEmail, "transactions", [...nTx, ...cur.transactions]), 
          saveCollection(currentUserEmail, "accounts", [...cur.accounts, ...nAcc]),
          saveUserField(currentUserEmail, "dashboardOrder", finalDashboardOrder)
        ]);
        lastActionTimeRef.current = Date.now();
    }
  }, [activeMonthId, currentUserEmail]);

  const handleDeleteMonth = useCallback(async (id: string) => {
     if (months.length <= 1) return;
     const target = months.find(m => m.id === id);
     if (!target) return;
     
     lastActionTimeRef.current = Date.now();

     const updMonths = months.filter(m => m.id !== id);
     const updTx = currentStateRef.current.transactions.filter(t => !((t.month || getMonthFromDateStr(t.date)) === target.month && (t.year || getYearFromDateStr(t.date, target.year)) === target.year));
     
     const deletedAccs = currentStateRef.current.accounts.filter(a => a.month === target.month && a.year === target.year);
     const deletedAccIds = new Set(deletedAccs.map(a => a.id));
     const updAcc = currentStateRef.current.accounts.filter(a => !deletedAccIds.has(a.id));
     
     // Clean up dashboard order to remove deleted account IDs
     const updDashboardOrder = currentStateRef.current.dashboardOrder.filter(oid => oid === BALANCE_CARD_ID || !deletedAccIds.has(oid));

     prevMonthsRef.current = JSON.stringify(updMonths);
     prevDashboardOrderRef.current = JSON.stringify(updDashboardOrder);
     
     setMonths(updMonths);
     setTransactions(updTx);
     setAccounts(updAcc);
     setDashboardOrder(updDashboardOrder);
     
     if (activeMonthId === id) {
        const sorted = sortMonths(updMonths);
        if (sorted.length > 0) setActiveMonthId(sorted[sorted.length - 1].id);
     }

     if (currentUserEmail) {
        try {
            await Promise.all([
               hardDeleteMonth(id, target.month, target.year),
               saveUserField(currentUserEmail, "dashboardOrder", updDashboardOrder)
            ]);
            lastActionTimeRef.current = Date.now();
        } catch (e) { console.error("Cloud Delete Fail:", e); }
     }
  }, [months, activeMonthId, currentUserEmail]);

  const handleSaveTransaction = useCallback((data: any) => { 
      const act = currentStateRef.current.months.find(m => m.id === activeMonthId);
      setTransactions(prev => {
         if (editingTransaction) {
             const upd = { ...editingTransaction, ...data };
             if(currentUserEmail) upsertItem(currentUserEmail, 'transactions', upd);
             return prev.map(t => t.id === editingTransaction.id ? upd : t);
         } else {
             const nTx = { id: generateUUID(), ...data, month: act?.month, year: act?.year, createdAt: new Date().toISOString() };
             if(currentUserEmail) upsertItem(currentUserEmail, 'transactions', nTx);
             return [nTx, ...prev];
         }
      });
      setEditingTransaction(null);
  }, [editingTransaction, activeMonthId, currentUserEmail]);

  const handleSaveAccount = useCallback((name: string, balance: number, theme: CardTheme) => {
    const act = currentStateRef.current.months.find(m => m.id === activeMonthId);
    if (editingAccount) {
      const upd = { ...editingAccount, name, balance, colorTheme: theme };
      setAccounts(prev => prev.map(a => a.id === editingAccount.id ? upd : a));
      if (currentUserEmail) upsertItem(currentUserEmail, 'accounts', upd);
      setEditingAccount(null);
    } else {
      const nAcc = { id: generateUUID(), name, balance, colorTheme: theme, month: act?.month, year: act?.year };
      setAccounts(prev => [...prev, nAcc]);
      setDashboardOrder(prev => [...prev, nAcc.id]); // Add to order list immediately
      if (currentUserEmail) {
         upsertItem(currentUserEmail, 'accounts', nAcc);
         saveUserField(currentUserEmail, 'dashboardOrder', [...dashboardOrder, nAcc.id]);
      }
    }
  }, [editingAccount, activeMonthId, currentUserEmail, dashboardOrder]);

  const handleDeleteAccount = useCallback((id: string) => {
    setAccounts(p => p.filter(a => a.id !== id));
    setDashboardOrder(p => p.filter(o => o !== id));
    if (currentUserEmail) {
       deleteItem(currentUserEmail, 'accounts', id);
       saveUserField(currentUserEmail, 'dashboardOrder', dashboardOrder.filter(o => o !== id));
    }
  }, [currentUserEmail, dashboardOrder]);

  const handleDeleteTransaction = useCallback((id: string) => {
      setTransactions(p => p.filter(t => t.id !== id));
      if (currentUserEmail) deleteItem(currentUserEmail, 'transactions', id);
  }, [currentUserEmail]);

  const filteredTx = useMemo(() => {
    const act = months.find(m => m.id === activeMonthId) || months[0];
    if (!act) return [];
    return transactions.filter(t => (t.month || getMonthFromDateStr(t.date)) === act.month && (t.year || getYearFromDateStr(t.date, act.year)) === act.year);
  }, [transactions, months, activeMonthId]);

  const filteredAcc = useMemo(() => {
    const act = months.find(m => m.id === activeMonthId) || months[0];
    if (!act) return [];
    return accounts.filter(a => a.month === act.month && a.year === act.year);
  }, [accounts, months, activeMonthId]);

  const dItems = useMemo(() => {
    const items: string[] = [];
    dashboardOrder.forEach(id => { 
       if (id === BALANCE_CARD_ID || filteredAcc.find(a => a.id === id)) items.push(id); 
    });
    // Add any missing filtered accounts to the end (failsafe)
    filteredAcc.forEach(a => { if (!items.includes(a.id)) items.push(a.id); });
    if (!items.includes(BALANCE_CARD_ID)) items.unshift(BALANCE_CARD_ID);
    return Array.from(new Set(items));
  }, [dashboardOrder, filteredAcc]);

  if (!currentUserEmail) return <LoginScreen onLogin={async (e, n) => { if (n) await registerUser(e, n, { months: [SYSTEM_INITIAL_MONTH] }); else await loginUser(e); setCurrentUserEmail(e); saveData(STORAGE_KEYS.USER_SESSION, e); }} />;
  if (isLoadingData && !userProfile.name) return <SplashScreen />;

  return (
    <div ref={mainScrollRef} className={`h-full overflow-y-auto bg-[#0a0a0b] text-white px-2 pt-4 pb-32 font-sans selection:bg-accent selection:text-black no-scrollbar ${isAnyModalOpen ? 'overflow-hidden' : ''}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {currentView === 'home' ? (
          <>
            <div className="flex justify-between items-center mb-6 pl-1">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full border-2 overflow-hidden shadow-lg ${userProfile.isPro ? 'border-yellow-500' : 'border-transparent group-hover:border-accent'}`}><img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /></div>
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
               {dItems.map(id => {
                  if (id === BALANCE_CARD_ID) return <BalanceCard key={id} id={id} balance={(filteredAcc.reduce((a, b) => a + b.balance, 0) - filteredTx.reduce((a, b) => a + b.amount, 0))} onAddClick={() => setIsAddTransactionOpen(true)} onDuplicateClick={handleDuplicateMonth} onCalculatorClick={() => setIsCalculatorOpen(true)} draggable onDragStart={id => dragItem.current = id} onDragEnter={tId => { if (dragItem.current && dragItem.current !== tId) { const nO = [...dashboardOrder]; const dI = nO.indexOf(dragItem.current), tI = nO.indexOf(tId); if (dI !== -1 && tI !== -1) { nO.splice(dI, 1); nO.splice(tI, 0, dragItem.current); setDashboardOrder(nO); } } }} onDragEnd={() => dragItem.current = null} />;
                  const a = filteredAcc.find(x => x.id === id);
                  if (a) return <SecondaryCard key={a.id} account={a} onDelete={handleDeleteAccount} onEdit={x => { setEditingAccount(x); setIsAddAccountOpen(true); }} draggable onDragStart={id => dragItem.current = id} onDragEnter={tId => { if (dragItem.current && dragItem.current !== tId) { const nO = [...dashboardOrder]; const dI = nO.indexOf(dragItem.current), tI = nO.indexOf(tId); if (dI !== -1 && tI !== -1) { nO.splice(dI, 1); nO.splice(tI, 0, dragItem.current); setDashboardOrder(nO); } } }} onDragEnd={() => dragItem.current = null} />;
                  return null;
               })}
            </div>
            <ContactsRow contacts={MOCK_CONTACTS} onAddClick={() => setIsAddAccountOpen(true)} onContactClick={c => { if (c.id === '1') setIsNotepadOpen(true); else if (c.id === '2') setIsCalendarOpen(true); else if (c.id === '3') { if (!userProfile.isPro) setIsProModalOpen(true); else setIsAnalyticsOpen(true); } }} isPro={!!userProfile.isPro} />
            <TransactionSummary months={months} activeMonthId={activeMonthId} onSelectMonth={setActiveMonthId} onDeleteMonth={handleDeleteMonth} />
            <TransactionList transactions={filteredTx} onDelete={handleDeleteTransaction} onEdit={t => { setEditingTransaction(t); setIsAddTransactionOpen(true); }} onToggleStatus={id => setTransactions(p => p.map(t => t.id === id ? { ...t, paid: !t.paid } : t))} onTogglePaymentMethod={id => setTransactions(p => p.map(t => t.id === id ? { ...t, paymentMethod: t.paymentMethod === 'pix' ? 'card' : 'pix' } as Transaction : t))} />
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
