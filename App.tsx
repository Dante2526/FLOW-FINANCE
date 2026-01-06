
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
import DonationModal from './components/DonationModal';
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppTheme, AppView, LongTermTransaction, Investment, AppNotification, AppLanguage } from './types';
import { loadData, saveData, STORAGE_KEYS } from './services/storage';
import { TRANSLATIONS, getBrowserLanguage, getLocale } from './i18n';
import { IconBell, JeittoLogo } from './components/Icons';
import { Crown, Languages, ExternalLink, Zap, Heart, Copy, Check, ChevronRight } from 'lucide-react';

// Supabase Services
import { loginUser, registerUser, loadUserData, saveCollection, saveUserField, subscribeToUserChanges, supabase, upsertItem, deleteItem, hardDeleteMonth } from './services/supabase';

const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal'));

// INTERNAL DB KEYS (ALWAYS PT-BR for consistency)
const MONTH_NAMES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

// Expanded Mapping to map ANY language short code to the Internal DB Key
const SHORT_CODE_TO_FULL: Record<string, string> = {
  // PT
  'Jan': 'JANEIRO', 'Fev': 'FEVEREIRO', 'Mar': 'MARÇO', 'Abr': 'ABRIL', 'Mai': 'MAIO', 'Jun': 'JUNHO', 
  'Jul': 'JULHO', 'Ago': 'AGOSTO', 'Set': 'SETEMBRO', 'Out': 'OUTUBRO', 'Nov': 'NOVEMBRO', 'Dez': 'DEZEMBRO',
  // EN
  'Feb': 'FEVEREIRO', 'Apr': 'ABRIL', 'May': 'MAIO', 'Aug': 'AGOSTO', 'Sep': 'SETEMBRO', 'Oct': 'OUTUBRO', 'Dec': 'DEZEMBRO',
  // ES
  'Ene': 'JANEIRO', 'Dic': 'DEZEMBRO'
};

const TODAY_KEYWORDS = ['hoje', 'today', 'hoy'];

const generateUUID = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | 0).toString(16));
const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

const currentDate = new Date();
const SYSTEM_INITIAL_MONTH: MonthSummary = { id: '00000000-0000-0000-0000-000000000001', month: MONTH_NAMES[currentDate.getMonth()], year: currentDate.getFullYear().toString(), total: 0, count: 0 };

const INITIAL_PROFILE: UserProfile = { name: '', subtitle: '', avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix', isPro: false };
const BALANCE_CARD_ID = 'balance-card';

const getMonthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return '';
  const lower = dateStr.toLowerCase();
  
  // Check against all supported languages for "Today"
  if (TODAY_KEYWORDS.some(k => lower.includes(k))) {
     return MONTH_NAMES[new Date().getMonth()];
  }

  const parts = dateStr.split(' ');
  if (parts.length >= 2 && !dateStr.includes('-')) {
    const code = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    // Use expanded map to find the correct PT-BR key regardless of input lang
    return SHORT_CODE_TO_FULL[code] || '';
  }
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(dateStr.split(' ')[0] + 'T00:00:00');
    return MONTH_NAMES[d.getMonth()];
  }
  return '';
};

const getYearFromDateStr = (dateStr: string, activeYearContext?: string): string => {
  const lower = dateStr.toLowerCase();
  if (TODAY_KEYWORDS.some(k => lower.includes(k))) return new Date().getFullYear().toString();
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr.split('-')[0];
  return activeYearContext || new Date().getFullYear().toString();
};

const sortMonths = (list: MonthSummary[]) => [...list].sort((a, b) => {
    const yA = parseInt(a.year || "0"), yB = parseInt(b.year || "0");
    if (yA !== yB) return yA - yB;
    const idxA = MONTH_NAMES.indexOf((a.month || "").toUpperCase().trim());
    const idxB = MONTH_NAMES.indexOf((b.month || "").toUpperCase().trim());
    return idxA - idxB;
});

const SplashScreen = () => (
  <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[100] animate-out fade-out duration-700">
    <div className="w-32 h-32 bg-[#1c1c1e] rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-black/20 mb-6">
       <FlowLogo className="w-24 h-24 text-accent" />
    </div>
    <div className="flex flex-col items-center gap-2">
       <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Flow Finance v1.5</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => !!loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  // Use browser detection as fallback for initial language
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => loadData(STORAGE_KEYS.APP_LANGUAGE, getBrowserLanguage()));
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  
  const isAnyModalOpen = isAddTransactionOpen || isAddAccountOpen || isCalculatorOpen || isProfileModalOpen || isNotepadOpen || isCalendarOpen || isNotificationOpen || isAnalyticsOpen || isProModalOpen || isDonationModalOpen;

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
  
  const t = TRANSLATIONS[appLanguage];

  // Dynamic Contacts with Translations
  const mockContacts = useMemo(() => [
    { id: '1', name: t.notepad.title, imageUrl: '' },
    { id: '2', name: t.calendar.title, imageUrl: '' },
    { id: '3', name: t.analytics.title, imageUrl: '' }
  ], [t]);

  const currentStateRef = useRef({ transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder, appLanguage });
  useEffect(() => { currentStateRef.current = { transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, notepadContent, notepadDrawing, cdiRate, dashboardOrder, appLanguage }; });

  // Reset scroll on view change
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentView]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', appTheme.primary);
    root.style.setProperty('--color-accent-dark', appTheme.secondary);
  }, [appTheme]);

  // Sync HTML Lang and Meta Data
  useEffect(() => {
    document.documentElement.lang = appLanguage === 'pt' ? 'pt-BR' : appLanguage === 'es' ? 'es-ES' : 'en-US';
    
    // Update Title and Description
    if (t.meta) {
        document.title = t.meta.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', t.meta.description);
        }
    }
  }, [appLanguage, t]);

  useEffect(() => {
    setMonths(prev => {
      let changed = false;
      const updated = prev.map(m => {
        const mName = (m.month || "").toUpperCase().trim();
        const mYear = m.year || "";
        const mTx = transactions.filter(t => 
            (t.month || getMonthFromDateStr(t.date) || "").toUpperCase().trim() === mName && 
            (t.year || getYearFromDateStr(t.date, mYear)) === mYear
        );
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
    loadUserData(currentUserEmail).then(data => { if (data) applyData(data); }).finally(() => setIsLoadingData(false));
  }, [currentUserEmail, isSessionReady]);

  useEffect(() => {
     if (!currentUserEmail) {
        setIsProfileModalOpen(false);
        setIsAddTransactionOpen(false);
        setIsAddAccountOpen(false);
        setIsCalculatorOpen(false);
        setIsNotepadOpen(false);
        setIsCalendarOpen(false);
        setIsNotificationOpen(false);
        setIsAnalyticsOpen(false);
        setIsProModalOpen(false);
        setIsDonationModalOpen(false);
        setCurrentView('home');
     }
  }, [currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail || !isSessionReady) return;
    const handleSync = () => {
       if (Date.now() - lastActionTimeRef.current < 15000) return;
       loadUserData(currentUserEmail).then(data => data && applyData(data));
    };
    const unsubscribe = subscribeToUserChanges(currentUserEmail, handleSync);
    window.addEventListener('focus', handleSync);
    return () => { unsubscribe(); window.removeEventListener('focus', handleSync); };
  }, [currentUserEmail, isSessionReady]);

  // SYSTEM: Check for bills due today and generate notifications
  useEffect(() => {
    if (isLoadingData) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const missingNotifs: AppNotification[] = [];

    // Localize numbers based on current app language
    const locale = getLocale(appLanguage);
    const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

    transactions.forEach(t => {
       if (t.paid) return;

       let isToday = false;
       
       // Check explicit "Hoje" / "Today" / "Hoy" using the multilingual keywords list
       const lowerDate = t.date.toLowerCase();
       if (TODAY_KEYWORDS.some(k => lowerDate.includes(k))) isToday = true;
       // Check ISO date
       else if (t.date.startsWith(todayStr)) isToday = true;

       if (isToday) {
           const notifId = `bill-alert-${t.id}`;
           const exists = notifications.some(n => n.id === notifId);
           if (!exists) {
               const formattedValue = t.amount.toLocaleString(locale, { minimumFractionDigits: 2 });
               
               // Use dynamic translation keys
               const title = TRANSLATIONS[appLanguage].notifications.system.billDueTitle;
               const message = TRANSLATIONS[appLanguage].notifications.system.billDueMessage
                  .replace('{name}', t.name)
                  .replace('{value}', `${currencySymbol} ${formattedValue}`);
               const dateStr = TRANSLATIONS[appLanguage].notifications.system.todayAt.replace('{time}', nowTime);

               missingNotifs.push({
                   id: notifId,
                   title: title,
                   message: message,
                   date: dateStr,
                   read: false,
                   type: 'alert'
               });
           }
       }
    });

    if (missingNotifs.length > 0) {
        const updatedNotifications = [...missingNotifs, ...notifications];
        setNotifications(updatedNotifications);
        
        if (currentUserEmail) {
            saveCollection(currentUserEmail, 'notifications', updatedNotifications);
            lastActionTimeRef.current = Date.now();
        }
    }
  }, [transactions, notifications, isLoadingData, currentUserEmail, appLanguage]); // Added appLanguage dep

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
      }
      if (data.cdiRate !== undefined) setCdiRate(data.cdiRate);
      if (data.dashboardOrder) setDashboardOrder(data.dashboardOrder);
  };

  const handleChangeLanguage = (lang: AppLanguage) => {
      setAppLanguage(lang);
      saveData(STORAGE_KEYS.APP_LANGUAGE, lang);
      setIsLangMenuOpen(false);
  };

  const handleDuplicateMonth = useCallback(async () => {
    const cur = currentStateRef.current;
    const act = cur.months.find(m => m.id === activeMonthId) || cur.months[0];
    if (!act) return;

    const actMonthNorm = (act.month || "").trim().toUpperCase();
    const actYear = act.year || "";
    
    // Determine Target Month Index (Next Month)
    let currentIdx = MONTH_NAMES.indexOf(actMonthNorm);
    if (currentIdx === -1) currentIdx = 0;

    let nIdx = currentIdx + 1;
    let nYr = parseInt(actYear) || new Date().getFullYear();
    
    if (nIdx > 11) { nIdx = 0; nYr += 1; }

    const nName = MONTH_NAMES[nIdx];
    const nYrS = nYr.toString();

    if (cur.months.find(m => (m.month || "").toUpperCase().trim() === nName && m.year === nYrS)) {
        const currentLang = cur.appLanguage;
        const tCommon = TRANSLATIONS[currentLang].common;
        // Use dynamic translation for duplicate month alert
        alert(tCommon.monthExists.replace('{month}', nName).replace('{year}', nYrS));
        return;
    }

    lastActionTimeRef.current = Date.now();
    const nId = generateUUID();

    const sourceTx = cur.transactions.filter(t => 
        (t.month || getMonthFromDateStr(t.date) || "").toUpperCase().trim() === actMonthNorm && 
        (t.year || getYearFromDateStr(t.date, actYear)) === actYear
    );
    const sourceAcc = cur.accounts.filter(a => (a.month || "").toUpperCase().trim() === actMonthNorm && (a.year || "") === actYear);

    // --- LÓGICA CORRIGIDA DE DATAS ---
    const nTx: Transaction[] = sourceTx.map((t, i) => {
        let originalDate = new Date();

        // 1. Tentar Parsear a data atual da transação para um objeto Date
        if (t.date.match(/^\d{4}-\d{2}-\d{2}/)) {
             // Formato ISO (YYYY-MM-DD)
             const parts = t.date.split(' ')[0].split('-');
             // Mês em JS é 0-indexado
             originalDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (TODAY_KEYWORDS.some(k => t.date.toLowerCase().includes(k))) {
             // Se for "Hoje"/"Today", usa a data atual
             originalDate = new Date();
        } else {
             // Formato legado "DD Mmm" (ex: "10 Fev" ou "10 Feb")
             const parts = t.date.split(' ');
             if (parts.length >= 2) {
                 const day = parseInt(parts[0], 10);
                 const code = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
                 // Use expanded map to find month name
                 const fullMonth = SHORT_CODE_TO_FULL[code]; 
                 const monthIdx = MONTH_NAMES.indexOf(fullMonth);
                 
                 // Se encontrarmos o mês, construímos a data.
                 // Usamos o ano do mês ativo como base.
                 if (monthIdx !== -1) {
                    originalDate = new Date(parseInt(actYear), monthIdx, day);
                 }
             }
        }

        // 2. Adicionar EXATAMENTE 1 Mês à data original
        // Isso preserva a lógica: "10 Fev" + 1 mês = "10 Mar"
        const targetDate = new Date(originalDate);
        const originalDay = targetDate.getDate(); // Salva o dia original (ex: 31)
        
        targetDate.setMonth(targetDate.getMonth() + 1);

        // 3. Ajuste de Overflow (ex: 31 Jan + 1 mês -> 3 Março. Queremos 28 Fev)
        // Se o dia mudou após adicionar o mês, significa que o mês seguinte é mais curto
        if (targetDate.getDate() !== originalDay) {
            targetDate.setDate(0); // Volta para o último dia do mês anterior (que é o mês correto de destino)
        }

        // 4. Formatar para ISO YYYY-MM-DD
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const newDate = `${yyyy}-${mm}-${dd}`;

        return { ...t, id: generateUUID(), month: nName, year: nYrS, date: newDate, paid: false, createdAt: new Date(Date.now() - i * 10).toISOString() };
    });
    
    const oldToNewAccMap = new Map<string, string>();
    const nAcc: Account[] = sourceAcc.map(a => {
        const newId = generateUUID();
        oldToNewAccMap.set(a.id, newId);
        return { ...a, id: newId, month: nName, year: nYrS };
    });

    const nMonth = { id: nId, month: nName, year: nYrS, total: roundMoney(nTx.reduce((s, t) => s + t.amount, 0)), count: nTx.length };
    
    const updMonths = sortMonths([...cur.months, nMonth]);
    const currentOrder = cur.dashboardOrder;
    const newGlobalOrder: string[] = [];
    currentOrder.forEach(id => {
       newGlobalOrder.push(id);
       if (oldToNewAccMap.has(id)) newGlobalOrder.push(oldToNewAccMap.get(id)!);
    });
    nAcc.forEach(a => { if (!newGlobalOrder.includes(a.id)) newGlobalOrder.push(a.id); });
    const finalDashboardOrder = Array.from(new Set(newGlobalOrder));

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
     const targetMonthNorm = (target.month || "").toUpperCase().trim();
     const targetYear = target.year || "";
     
     const updTx = currentStateRef.current.transactions.filter(t => !((t.month || getMonthFromDateStr(t.date) || "").toUpperCase().trim() === targetMonthNorm && (t.year || getYearFromDateStr(t.date, targetYear)) === targetYear));
     const deletedAccIds = new Set(currentStateRef.current.accounts.filter(a => (a.month || "").toUpperCase().trim() === targetMonthNorm && a.year === targetYear).map(a => a.id));
     const updAcc = currentStateRef.current.accounts.filter(a => !deletedAccIds.has(a.id));
     const updDashboardOrder = currentStateRef.current.dashboardOrder.filter(oid => oid === BALANCE_CARD_ID || !deletedAccIds.has(oid));
     
     setMonths(updMonths);
     setTransactions(updTx);
     setAccounts(updAcc);
     setDashboardOrder(updDashboardOrder);
     if (activeMonthId === id) { const sorted = sortMonths(updMonths); if (sorted.length > 0) setActiveMonthId(sorted[sorted.length - 1].id); }
     if (currentUserEmail) { await Promise.all([hardDeleteMonth(id, target.month, targetYear), saveUserField(currentUserEmail, "dashboardOrder", updDashboardOrder)]); lastActionTimeRef.current = Date.now(); }
  }, [months, activeMonthId, currentUserEmail]);

  const handleSaveTransaction = useCallback((data: any) => { 
      const act = currentStateRef.current.months.find(m => m.id === activeMonthId);
      setTransactions(prev => {
         if (editingTransaction) {
             const upd = { ...editingTransaction, ...data };
             if(currentUserEmail) { upsertItem(currentUserEmail, 'transactions', upd); lastActionTimeRef.current = Date.now(); }
             return prev.map(t => t.id === editingTransaction.id ? upd : t);
         } else {
             const nTx = { id: generateUUID(), ...data, month: act?.month, year: act?.year, createdAt: new Date().toISOString() };
             if(currentUserEmail) { upsertItem(currentUserEmail, 'transactions', nTx); lastActionTimeRef.current = Date.now(); }
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
      if (currentUserEmail) { upsertItem(currentUserEmail, 'accounts', upd); lastActionTimeRef.current = Date.now(); }
      setEditingAccount(null);
    } else {
      const nAcc = { id: generateUUID(), name, balance, colorTheme: theme, month: act?.month, year: act?.year };
      const newOrder = [...dashboardOrder, nAcc.id];
      setAccounts(prev => [...prev, nAcc]);
      setDashboardOrder(newOrder); 
      if (currentUserEmail) { upsertItem(currentUserEmail, 'accounts', nAcc); saveUserField(currentUserEmail, 'dashboardOrder', newOrder); lastActionTimeRef.current = Date.now(); }
    }
  }, [editingAccount, activeMonthId, currentUserEmail, dashboardOrder]);

  const handleDeleteAccount = useCallback((id: string) => {
    const newOrder = dashboardOrder.filter(o => o !== id);
    setAccounts(p => p.filter(a => a.id !== id));
    setDashboardOrder(newOrder);
    if (currentUserEmail) { deleteItem(currentUserEmail, 'accounts', id); saveUserField(currentUserEmail, 'dashboardOrder', newOrder); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail, dashboardOrder]);

  const handleDeleteTransaction = useCallback((id: string) => { 
    setTransactions(p => p.filter(t => t.id !== id)); 
    if (currentUserEmail) { deleteItem(currentUserEmail, 'transactions', id); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleToggleStatus = useCallback((id: string) => {
    const tx = currentStateRef.current.transactions.find(t => t.id === id);
    if (!tx) return;
    const updatedTx = { ...tx, paid: !tx.paid };
    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    if (currentUserEmail) { upsertItem(currentUserEmail, 'transactions', updatedTx); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleTogglePaymentMethod = useCallback((id: string) => {
    const tx = currentStateRef.current.transactions.find(t => t.id === id);
    if (!tx) return;
    const updatedTx = { ...tx, paymentMethod: tx.paymentMethod === 'pix' ? 'card' : 'pix' } as Transaction;
    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    if (currentUserEmail) { upsertItem(currentUserEmail, 'transactions', updatedTx); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  // --- OPTIMIZED HANDLERS (Callback) ---
  const handleOpenAddTransaction = useCallback(() => setIsAddTransactionOpen(true), []);
  const handleOpenCalculator = useCallback(() => setIsCalculatorOpen(true), []);
  const handleOpenAddAccount = useCallback(() => setIsAddAccountOpen(true), []);
  const handleOpenProfile = useCallback(() => setIsProfileModalOpen(true), []);
  
  const handleEditAccount = useCallback((acc: Account) => {
    setEditingAccount(acc);
    setIsAddAccountOpen(true);
  }, []);

  const handleEditTransaction = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddTransactionOpen(true);
  }, []);

  const handleContactClick = useCallback((c: Contact) => {
    if (c.id === '1') setIsNotepadOpen(true);
    else if (c.id === '2') setIsCalendarOpen(true);
    else if (c.id === '3') {
       // Check prop inside component, but here we can check state ref or pass logic
       if (!currentStateRef.current.userProfile.isPro) setIsProModalOpen(true);
       else setIsAnalyticsOpen(true);
    }
  }, []);

  // --- VIEW HANDLERS ---
  const handleInvestmentAdd = useCallback((i: Omit<Investment, 'id'>) => {
     const n = { ...i, id: generateUUID() };
     setInvestments(p => [...p, n]);
     if (currentUserEmail) { upsertItem(currentUserEmail, 'investments', n); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleInvestmentEdit = useCallback((i: Investment) => {
     setInvestments(p => p.map(o => o.id === i.id ? i : o));
     if (currentUserEmail) { upsertItem(currentUserEmail, 'investments', i); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleInvestmentDelete = useCallback((id: string) => {
     setInvestments(p => p.filter(i => i.id !== id));
     if (currentUserEmail) { deleteItem(currentUserEmail, 'investments', id); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleInvestmentUpdateRate = useCallback((r: number) => {
     setCdiRate(r);
     if (currentUserEmail) { saveUserField(currentUserEmail, 'cdiRate', r); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleLongTermAdd = useCallback((i: Omit<LongTermTransaction, 'id' | 'installmentsPaid'>) => {
     const n = { ...i, id: generateUUID(), installmentsPaid: 0 };
     setLongTermTransactions(p => [...p, n]);
     if (currentUserEmail) { upsertItem(currentUserEmail, 'longTerm', n); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleLongTermEdit = useCallback((i: LongTermTransaction) => {
     setLongTermTransactions(p => p.map(o => o.id === i.id ? i : o));
     if (currentUserEmail) { upsertItem(currentUserEmail, 'longTerm', i); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleLongTermDelete = useCallback((id: string) => {
     setLongTermTransactions(p => p.filter(i => i.id !== id));
     if (currentUserEmail) { deleteItem(currentUserEmail, 'longTerm', id); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleGoHome = useCallback(() => setCurrentView('home'), []);
  const handleOpenPro = useCallback(() => setIsProModalOpen(true), []);

  const handleLogout = useCallback(async () => {
    setIsProfileModalOpen(false);
    setIsAddTransactionOpen(false);
    setIsAddAccountOpen(false);
    setIsCalculatorOpen(false);
    setIsNotepadOpen(false);
    setIsCalendarOpen(false);
    setIsNotificationOpen(false);
    setIsAnalyticsOpen(false);
    setIsProModalOpen(false);
    setIsDonationModalOpen(false);
    setCurrentView('home');
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    await supabase.auth.signOut();
    setCurrentUserEmail(null);
  }, []);

  const handleLoginSuccess = useCallback(async (email: string, name?: string) => {
    if (name) await registerUser(email, name, { months: [SYSTEM_INITIAL_MONTH] }); 
    else await loginUser(email);
    setIsProfileModalOpen(false);
    setCurrentView('home');
    setCurrentUserEmail(email); 
    saveData(STORAGE_KEYS.USER_SESSION, email); 
  }, []);

  const handleDragStart = useCallback((id: string) => { dragItem.current = id; }, []);
  const handleDragEnd = useCallback(() => { dragItem.current = null; }, []);
  
  const handleDragEnter = useCallback((tId: string) => {
      if (dragItem.current && dragItem.current !== tId) {
          const nO = [...currentStateRef.current.dashboardOrder];
          const dI = nO.indexOf(dragItem.current);
          const tI = nO.indexOf(tId);
          if (dI !== -1 && tI !== -1) {
              nO.splice(dI, 1);
              nO.splice(tI, 0, dragItem.current);
              setDashboardOrder(nO);
              if (currentUserEmail) {
                  saveUserField(currentUserEmail, 'dashboardOrder', nO);
                  lastActionTimeRef.current = Date.now();
              }
          }
      }
  }, [currentUserEmail]);

  const activeMonth = useMemo(() => months.find(m => m.id === activeMonthId) || months[0], [months, activeMonthId]);

  const filteredTx = useMemo(() => {
    if (!activeMonth) return [];
    const mName = (activeMonth.month || "").toUpperCase().trim();
    const mYear = activeMonth.year || "";
    return transactions.filter(t => 
        (t.month || getMonthFromDateStr(t.date) || "").toUpperCase().trim() === mName && 
        (t.year || getYearFromDateStr(t.date, mYear)) === mYear
    );
  }, [transactions, activeMonth]);

  const filteredAcc = useMemo(() => {
    if (!activeMonth) return [];
    const mName = (activeMonth.month || "").toUpperCase().trim();
    const mYear = activeMonth.year || "";
    return accounts.filter(a => (a.month || "").toUpperCase().trim() === mName && (a.year || "") === mYear);
  }, [accounts, activeMonth]);

  const dItems = useMemo(() => {
    const filteredAccIds = new Set(filteredAcc.map(a => a.id));
    const items: string[] = [];
    dashboardOrder.forEach(id => { if (id === BALANCE_CARD_ID || filteredAccIds.has(id)) items.push(id); });
    filteredAcc.forEach(a => { if (!items.includes(a.id)) items.push(a.id); });
    if (!items.includes(BALANCE_CARD_ID)) items.unshift(BALANCE_CARD_ID);
    return Array.from(new Set(items));
  }, [dashboardOrder, filteredAcc]);

  // LOGIN SCREEN
  if (!currentUserEmail) {
     return <LoginScreen onLogin={handleLoginSuccess} currentLang={appLanguage} onLanguageChange={handleChangeLanguage} />;
  }

  if (isLoadingData && !userProfile.name) return <SplashScreen />;

  return (
    <div key={currentUserEmail} ref={mainScrollRef} className={`h-full overflow-y-auto bg-[#0a0a0b] text-white px-2 pt-4 pb-32 font-sans selection:bg-accent selection:text-black no-scrollbar ${isAnyModalOpen ? 'overflow-hidden' : ''}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {currentView === 'home' ? (
          <>
            <div className="flex justify-between items-center mb-6 pl-1">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={handleOpenProfile}>
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full border-2 overflow-hidden shadow-lg ${userProfile.isPro ? 'border-yellow-500' : 'border-transparent group-hover:border-accent'}`}><img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /></div>
                  {userProfile.isPro && <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-[#0a0a0b]"><Crown className="w-3 h-3 text-black fill-black" /></div>}
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.welcome},</span>
                  <div className="flex items-center gap-1"><h1 className="text-white text-xl font-bold leading-none">{userProfile.name || 'Usuário'}</h1>{userProfile.isPro && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                
                {/* Language Selector */}
                <div className="relative">
                   <button 
                     onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                     className="p-3 bg-surface rounded-2xl hover:bg-surfaceLight transition-colors cursor-pointer active:scale-95 text-gray-400"
                   >
                      <Languages className="w-6 h-6" />
                   </button>
                   {isLangMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 bg-[#1c1c1e] border border-white/5 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50 w-28 animate-in fade-in zoom-in duration-200">
                         <button onClick={() => handleChangeLanguage('pt')} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${appLanguage === 'pt' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                            Português
                         </button>
                         <button onClick={() => handleChangeLanguage('en')} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${appLanguage === 'en' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                            English
                         </button>
                         <button onClick={() => handleChangeLanguage('es')} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${appLanguage === 'es' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                            Español
                         </button>
                      </div>
                   )}
                </div>

                <IconBell count={notifications.filter(n => !n.read).length} onClick={() => setIsNotificationOpen(true)} />
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-6">
               {dItems.map(id => {
                  if (id === BALANCE_CARD_ID) return <BalanceCard key={id} id={id} balance={(filteredAcc.reduce((a, b) => a + b.balance, 0) - filteredTx.reduce((a, b) => a + b.amount, 0))} label={t.balanceLabel} addButtonLabel={t.addBtn} onAddClick={handleOpenAddTransaction} onDuplicateClick={handleDuplicateMonth} onCalculatorClick={handleOpenCalculator} draggable onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} appLanguage={appLanguage} />;
                  const a = filteredAcc.find(x => x.id === id);
                  if (a) return <SecondaryCard key={a.id} account={a} onDelete={handleDeleteAccount} onEdit={handleEditAccount} draggable onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} appLanguage={appLanguage} />;
                  return null;
               })}
            </div>
            <ContactsRow contacts={mockContacts} onAddClick={handleOpenAddAccount} onContactClick={handleContactClick} isPro={!!userProfile.isPro} title={t.quickAccessTitle} appLanguage={appLanguage} />
            <TransactionSummary months={months} activeMonthId={activeMonthId} onSelectMonth={setActiveMonthId} onDeleteMonth={handleDeleteMonth} appLanguage={appLanguage} />
            <TransactionList 
              transactions={filteredTx} 
              onDelete={handleDeleteTransaction} 
              onEdit={handleEditTransaction} 
              onToggleStatus={handleToggleStatus} 
              onTogglePaymentMethod={handleTogglePaymentMethod} 
              title={t.billsTitle}
              appLanguage={appLanguage}
            />

            {!userProfile.isPro && (
              <div className="px-1 mt-6">
                
                {/* Donation Card */}
                <div
                  onClick={() => setIsDonationModalOpen(true)}
                  className="mb-4 block w-full bg-[#1c1c1e] border border-white/5 rounded-[1.5rem] p-4 relative overflow-hidden group active:scale-95 transition-all cursor-pointer"
                >
                  <div className="absolute -top-[1px] -right-[1px] bg-emerald-500/20 px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/10 z-10">
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{t.home?.support?.tag || "Apoie"}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-[1.2rem] bg-[#2c2c2e] flex items-center justify-center shrink-0">
                       <Heart className="w-6 h-6 text-emerald-500 fill-emerald-500/20" />
                    </div>

                    <div className="flex-1">
                       <h3 className="text-white font-bold text-sm">{t.home?.support?.title || "Apoie o Projeto"}</h3>
                       <p className="text-gray-400 text-xs mt-0.5">{t.home?.support?.subtitle || "Doe qualquer valor via Pix."}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Jeitto Card */}
                <a 
                  href="https://jeitto.onelink.me/QMGg/mcgv9w9n" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-[#1c1c1e] border border-white/5 rounded-[1.5rem] p-4 relative overflow-hidden group active:scale-95 transition-all mb-4"
                >
                  <div className="absolute -top-[1px] -right-[1px] bg-[#552d36] px-3 py-1 rounded-bl-xl border-l border-b border-[#f82f58]/20 z-10">
                     <span className="text-[10px] font-bold text-[#f82f58] uppercase tracking-wider">{t.home?.jeitto?.tag || "Indicação"}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <JeittoLogo />
                    <div className="flex-1">
                       <h3 className="text-white font-bold text-sm">{t.home?.jeitto?.title || "Limite Extra Disponível?"}</h3>
                       <p className="text-gray-400 text-xs mt-0.5">{t.home?.jeitto?.subtitle || "Baixe o Jeitto e confira sua aprovação."}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </a>
              </div>
            )}
          </>
      ) : currentView === 'settings' ? (
          <SettingsView currentThemeId={appTheme.id} onSaveTheme={t => { setAppTheme(t); saveData(STORAGE_KEYS.APP_THEME, t); if(currentUserEmail) { saveUserField(currentUserEmail, 'theme', t); lastActionTimeRef.current = Date.now(); } setCurrentView('home'); }} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />
      ) : currentView === 'long-term' ? (
          <LongTermView items={longTermTransactions} onAdd={handleLongTermAdd} onEdit={handleLongTermEdit} onDelete={handleLongTermDelete} appLanguage={appLanguage} />
      ) : (
          <InvestmentsView investments={investments} onAdd={handleInvestmentAdd} onEdit={handleInvestmentEdit} onDelete={handleInvestmentDelete} onBack={handleGoHome} cdiRate={cdiRate} onUpdateCdiRate={handleInvestmentUpdateRate} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />
      )}
      <BottomNav currentView={currentView} onChangeView={setCurrentView} labels={t.nav} />
      <AddTransactionModal isOpen={isAddTransactionOpen} onClose={() => { setIsAddTransactionOpen(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} activeMonthContext={{ monthIndex: MONTH_NAMES.indexOf((activeMonth.month || "").toUpperCase()), year: parseInt(activeMonth.year) }} appLanguage={appLanguage} />
      <AddAccountModal isOpen={isAddAccountOpen} onClose={() => { setIsAddAccountOpen(false); setEditingAccount(null); }} onSave={handleSaveAccount} accountToEdit={editingAccount} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />
      <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} appLanguage={appLanguage} />
      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={p => { setUserProfile(p); if(currentUserEmail) { saveUserField(currentUserEmail, 'profile', p); lastActionTimeRef.current = Date.now(); } }} onLogout={handleLogout} onDeleteAccount={() => {}} currentProfile={userProfile} appLanguage={appLanguage} onOpenProModal={handleOpenPro} />
      <NotepadModal isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)} initialContent={notepadContent} initialDrawing={notepadDrawing} onSave={(c, d) => { setNotepadContent(c); setNotepadDrawing(d); if(currentUserEmail) { saveUserField(currentUserEmail, 'notepadContent', c); saveUserField(currentUserEmail, 'notepadDrawing', d); lastActionTimeRef.current = Date.now(); } }} appLanguage={appLanguage} />
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} transactions={transactions} activeMonthContext={{ monthIndex: MONTH_NAMES.indexOf((activeMonth.month || "").toUpperCase()), year: parseInt(activeMonth.year) }} appLanguage={appLanguage} />
      <NotificationModal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} notifications={notifications} onMarkAllRead={() => { setNotifications([]); if(currentUserEmail) { saveCollection(currentUserEmail, 'notifications', []); lastActionTimeRef.current = Date.now(); } }} onDelete={id => { setNotifications(p => p.filter(n => n.id !== id)); if(currentUserEmail) { deleteItem(currentUserEmail, 'notifications', id); lastActionTimeRef.current = Date.now(); } }} currentUserEmail={currentUserEmail} appLanguage={appLanguage} />
      <Suspense fallback={null}>{isAnalyticsOpen && <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} transactions={transactions} months={months} appLanguage={appLanguage} />}</Suspense>
      <ProModal 
        isOpen={isProModalOpen} 
        onClose={() => setIsProModalOpen(false)} 
        onUpgrade={() => { 
           setUserProfile(p => ({...p, isPro: true})); 
           setIsProModalOpen(false); 
           if(currentUserEmail) { saveUserField(currentUserEmail, 'profile', { ...userProfile, isPro: true }); lastActionTimeRef.current = Date.now(); } 
        }}
        userEmail={currentUserEmail || undefined}
        userName={userProfile.name}
        appLanguage={appLanguage}
      />
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        userEmail={currentUserEmail || undefined}
        userName={userProfile.name}
        appLanguage={appLanguage}
      />
    </div>
  );
};

export default App;
