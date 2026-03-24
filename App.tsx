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
import Tutorial from './components/Tutorial';
import { TutorialStep } from './components/Tutorial';
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppTheme, AppView, LongTermTransaction, Investment, AppNotification, AppLanguage } from './types';
import { loadData, saveData, STORAGE_KEYS } from './services/storage';
import { TRANSLATIONS, getBrowserLanguage, getLocale } from './i18n';
import { IconBell, JeittoLogo } from './components/Icons';
import { Crown, Languages, ExternalLink, Zap, Heart, Copy, Check, ChevronRight, HelpCircle } from 'lucide-react';

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
  'Feb': 'FEVEREIRO', 'Apr': 'ABRIL', 'May': 'MAIO', 'Aug': 'AGOSTO', 'Sep': 'SETEMBRO', 'Oct': 'OCTUBRE', 'Dec': 'DEZEMBRO',
  // ES
  'Ene': 'JANEIRO', 'Dic': 'DEZEMBRO'
};

const generateUUID = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | 0).toString(16));
const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

const currentDate = new Date();
const SYSTEM_INITIAL_MONTH: MonthSummary = { id: '00000000-0000-0000-0000-000000000001', month: MONTH_NAMES[currentDate.getMonth()], year: currentDate.getFullYear().toString(), total: 0, count: 0 };

const INITIAL_PROFILE: UserProfile = { name: '', subtitle: '', avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix', isPro: false };
const BALANCE_CARD_ID = 'balance-card';

const getLocalISODateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return '';

  // Primary path for 'YYYY-MM-DD'
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const monthIndex = parseInt(dateStr.split('-')[1], 10) - 1;
    return MONTH_NAMES[monthIndex];
  }

  // Legacy path for 'DD Mmm' format
  const parts = dateStr.split(' ');
  if (parts.length >= 2) {
    const code = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
    return SHORT_CODE_TO_FULL[code] || '';
  }

  // Legacy path for 'hoje'
  if (dateStr.toLowerCase().includes('hoje')) {
    return MONTH_NAMES[new Date().getMonth()];
  }

  return '';
};

const getYearFromDateStr = (dateStr: string, activeYearContext?: string): string => {
  if (!dateStr) return activeYearContext || new Date().getFullYear().toString();

  // Primary path for 'YYYY-MM-DD'
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr.split('-')[0];
  }

  // Legacy path for 'hoje'
  if (dateStr.toLowerCase().includes('hoje')) {
    return new Date().getFullYear().toString();
  }

  return activeYearContext || new Date().getFullYear().toString();
};

const sortMonths = (list: MonthSummary[]) => [...list].sort((a, b) => {
  const yA = parseInt(a.year || "0"), yB = parseInt(b.year || "0");
  if (yA !== yB) return yA - yB;
  const idxA = MONTH_NAMES.indexOf((a.month || "").toUpperCase().trim());
  const idxB = MONTH_NAMES.indexOf((b.month || "").toUpperCase().trim());
  return idxA - idxB;
});

const SplashScreen = () => {
  const lang = loadData(STORAGE_KEYS.APP_LANGUAGE, getBrowserLanguage());
  const tCommon = (TRANSLATIONS[lang] || TRANSLATIONS['pt']).common;

  return (
    <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[100] animate-out fade-out duration-700">
      <div className="w-32 h-32 bg-[#1c1c1e] rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-black/20 mb-6">
        <FlowLogo className="w-24 h-24 text-accent" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">{tCommon.splashVersion}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => !!loadData(STORAGE_KEYS.USER_SESSION, null));
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  // Use browser detection as fallback for initial language, validating against known keys
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => {
    const saved = loadData(STORAGE_KEYS.APP_LANGUAGE, getBrowserLanguage());
    return (['pt', 'en', 'es'].includes(saved)) ? saved : 'pt';
  });
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

  // Tutorial State now lives in App.tsx
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isInvestmentsTutorialOpen, setIsInvestmentsTutorialOpen] = useState(false);

  const isAnyModalOpen = isAddTransactionOpen || isAddAccountOpen || isCalculatorOpen || isProfileModalOpen || isNotepadOpen || isCalendarOpen || isNotificationOpen || isAnalyticsOpen || isProModalOpen || isDonationModalOpen || isTutorialActive || isInvestmentsTutorialOpen;

  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [months, setMonths] = useState<MonthSummary[]>([SYSTEM_INITIAL_MONTH]);
  const [longTermTransactions, setLongTermTransactions] = useState<LongTermTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [cdiRate, setCdiRate] = useState<number>(11.25);
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([BALANCE_CARD_ID]);
  const [appTheme, setAppTheme] = useState<AppTheme>(() => loadData(STORAGE_KEYS.APP_THEME, AVAILABLE_THEMES[0]));
  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Persistent dismissed notifications
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    const todayStr = getLocalISODateString();
    const stored = loadData<{ date: string; ids: string[] }>(STORAGE_KEYS.DISMISSED_NOTIFICATIONS, { date: '', ids: [] });
    if (stored.date === todayStr) {
      return stored.ids;
    }
    return []; // It's a new day, start fresh.
  });

  const dragItem = useRef<string | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const lastActionTimeRef = useRef<number>(0);

  // Robust translation retrieval with fallback
  const t = TRANSLATIONS[appLanguage] || TRANSLATIONS['pt'];

  // Dynamic Contacts with Translations
  const mockContacts = useMemo(() => [
    { id: '1', name: t.notepad?.title || 'Notepad', imageUrl: '' },
    { id: '2', name: t.calendar?.title || 'Calendar', imageUrl: '' },
    { id: '3', name: t.analytics?.title || 'Analytics', imageUrl: '' }
  ], [t]);

  const currentStateRef = useRef({ transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, cdiRate, dashboardOrder, appLanguage, currentView, currentUserEmail, activeMonthId, editingAccount, editingTransaction });
  useEffect(() => { currentStateRef.current = { transactions, accounts, investments, longTermTransactions, notifications, userProfile, appTheme, months, cdiRate, dashboardOrder, appLanguage, currentView, currentUserEmail, activeMonthId, editingAccount, editingTransaction }; });

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

  // Persist dismissed notifications
  useEffect(() => {
    const todayStr = getLocalISODateString();
    saveData(STORAGE_KEYS.DISMISSED_NOTIFICATIONS, { date: todayStr, ids: dismissedNotifIds });
  }, [dismissedNotifIds]);

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
      const syncStartTime = Date.now();
      // Block sync if a user action happened recently to prevent race conditions.
      if (syncStartTime - lastActionTimeRef.current < 5000) {
        return;
      }

      loadUserData(currentUserEmail).then(data => {
        if (data) {
          // After fetching, check again. If an action happened DURING the fetch, discard stale data.
          if (lastActionTimeRef.current > syncStartTime) {
            console.warn("Stale sync data detected after user action. Discarding.");
            return;
          }
          applyData(data);
        }
      });
    };
    const unsubscribe = subscribeToUserChanges(currentUserEmail, handleSync);
    window.addEventListener('focus', handleSync);
    return () => { unsubscribe(); window.removeEventListener('focus', handleSync); };
  }, [currentUserEmail, isSessionReady]);

  // SYSTEM: Check for bills due today and generate notifications
  useEffect(() => {
    if (isLoadingData) return;

    const todayStr = getLocalISODateString();
    const now = new Date();
    const nowTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const missingNotifs: AppNotification[] = [];

    const locale = getLocale(appLanguage);
    const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

    transactions.forEach(t => {
      if (t.paid) return;

      // The check is now a simple and reliable string comparison.
      // t.date is 'YYYY-MM-DD', and so is todayStr.
      const isToday = t.date === todayStr;

      if (isToday) {
        const notifId = t.id;
        const exists = notifications.some(n => n.id === notifId);
        const isDismissed = dismissedNotifIds.includes(notifId);

        if (!exists && !isDismissed) {
          const formattedValue = t.amount.toLocaleString(locale, { minimumFractionDigits: 2 });

          const systemT = TRANSLATIONS[appLanguage]?.notifications?.system || TRANSLATIONS['pt'].notifications.system;

          const title = systemT.billDueTitle;
          const message = systemT.billDueMessage
            .replace('{name}', t.name)
            .replace('{value}', `${currencySymbol} ${formattedValue}`);
          const dateStr = systemT.todayAt.replace('{time}', nowTime);

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
        Promise.all(missingNotifs.map(n => upsertItem(currentUserEmail!, 'notifications', n)))
          .then(() => lastActionTimeRef.current = Date.now());
      }
    }
  }, [transactions, notifications, isLoadingData, currentUserEmail, appLanguage, dismissedNotifIds]);

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

  // --- TUTORIAL LOGIC ---
  const handleStartTutorial = useCallback(() => {
    setTutorialStep(0);
    setIsTutorialActive(true);
  }, []);

  const handleTutorialNext = useCallback(() => setTutorialStep(prev => prev + 1), []);
  const handleTutorialPrev = useCallback(() => setTutorialStep(prev => prev - 1), []);

  const handleCloseTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setTutorialStep(0);
    if (currentUserEmail) {
      saveData(`${STORAGE_KEYS.TUTORIAL_COMPLETED}_${currentUserEmail}`, true);
    }
  }, [currentUserEmail]);

  useEffect(() => {
    if (!isLoadingData && currentUserEmail) {
      const tutorialCompleted = loadData(`${STORAGE_KEYS.TUTORIAL_COMPLETED}_${currentUserEmail}`, false);
      if (!tutorialCompleted) {
        setTimeout(() => {
          if (currentStateRef.current.currentView === 'home') {
            handleStartTutorial();
          }
        }, 500);
      }
    }
  }, [isLoadingData, currentUserEmail, handleStartTutorial]);

  const handleCloseInvestmentsTutorial = useCallback(() => {
    setIsInvestmentsTutorialOpen(false);
    const email = currentStateRef.current.currentUserEmail;
    if (email) {
      saveData(`${STORAGE_KEYS.TUTORIAL_COMPLETED}_investments_${email}`, true);
    }
  }, []);

  const handleRestartTutorials = useCallback(() => {
    if (!currentUserEmail) return;
    saveData(`${STORAGE_KEYS.TUTORIAL_COMPLETED}_${currentUserEmail}`, false);
    saveData(`${STORAGE_KEYS.TUTORIAL_COMPLETED}_investments_${currentUserEmail}`, false);
    handleStartTutorial();
  }, [currentUserEmail, handleStartTutorial]);

  const TUTORIAL_STEPS: TutorialStep[] = useMemo(() => {
    return [
      { element: '[data-tour-id="profile-header"]', title: t.tutorial.steps[0].title, content: t.tutorial.steps[0].content, position: 'bottom' },
      { element: '[data-tour-id="header-actions"]', title: t.tutorial.steps[1].title, content: t.tutorial.steps[1].content, position: 'bottom' },
      { element: '[data-tour-id="balance-card"]', title: t.tutorial.steps[2].title, content: t.tutorial.steps[2].content, position: 'bottom' },
      { element: '[data-tour-id="add-button"]', title: t.tutorial.steps[3].title, content: t.tutorial.steps[3].content, position: 'bottom' },
      { element: '[data-tour-id="duplicate-button"]', title: t.tutorial.steps[4].title, content: t.tutorial.steps[4].content, position: 'bottom' },
      { element: '[data-tour-id="calculator-button"]', title: t.tutorial.steps[5].title, content: t.tutorial.steps[5].content, position: 'bottom' },
      { element: '[data-tour-id="quick-access"]', title: t.tutorial.steps[6].title, content: t.tutorial.steps[6].content, position: 'bottom' },
      { element: '[data-tour-id="month-switcher"]', title: t.tutorial.steps[7].title, content: t.tutorial.steps[7].content, position: 'bottom' },
      {
        element: filteredTx.length > 0 ? '[data-tour-id="transaction-item-0"]' : '[data-tour-id="transaction-list"]',
        title: t.tutorial.steps[8].title,
        content: t.tutorial.steps[8].content,
        position: 'top'
      },
      { element: '[data-tour-id="bottom-nav"]', title: t.tutorial.steps[9].title, content: t.tutorial.steps[9].content, position: 'top' },
    ];
  }, [t.tutorial.steps, filteredTx]);

  const INVESTMENTS_TUTORIAL_STEPS: TutorialStep[] = useMemo(() => [
    { element: '[data-tour-id="investments-header"]', title: t.tutorial.investmentsSteps[0].title, content: t.tutorial.investmentsSteps[0].content, position: 'bottom' },
    { element: '[data-tour-id="investments-cdi-rate"]', title: t.tutorial.investmentsSteps[1].title, content: t.tutorial.investmentsSteps[1].content, position: 'bottom' },
    { element: '[data-tour-id="investments-main-card"]', title: t.tutorial.investmentsSteps[2].title, content: t.tutorial.investmentsSteps[2].content, position: 'bottom' },
    { element: '[data-tour-id="investments-list"]', title: t.tutorial.investmentsSteps[3].title, content: t.tutorial.investmentsSteps[3].content, position: 'top' },
    { element: '[data-tour-id="investments-add-button"]', title: t.tutorial.investmentsSteps[4].title, content: t.tutorial.investmentsSteps[4].content, position: 'left' },
  ], [t.tutorial.investmentsSteps]);

  // Investments Tutorial Logic
  useEffect(() => {
    if (currentView === 'investments' && !isLoadingData && currentUserEmail) {
      const tutorialCompleted = loadData(`${STORAGE_KEYS.TUTORIAL_COMPLETED}_investments_${currentUserEmail}`, false);
      if (!tutorialCompleted) {
        setTimeout(() => {
          if (currentStateRef.current.currentView === 'investments') {
            setIsInvestmentsTutorialOpen(true);
          }
        }, 500);
      }
    }
  }, [currentView, isLoadingData, currentUserEmail]);


  const applyData = useCallback((data: any) => {
    if (data.profile) setUserProfile(data.profile);
    if (data.transactions) setTransactions(data.transactions);
    if (data.accounts) setAccounts(data.accounts);
    if (data.investments) setInvestments(data.investments);
    if (data.longTerm) setLongTermTransactions(data.longTerm);
    if (data.notifications) setNotifications(data.notifications);
    if (data.theme) { setAppTheme(data.theme); saveData(STORAGE_KEYS.APP_THEME, data.theme); }
    if (data.months && data.months.length > 0) {
      const sorted = sortMonths(data.months);
      setMonths(sorted);
      setActiveMonthId(prev => {
        if (prev === SYSTEM_INITIAL_MONTH.id || !sorted.find(m => m.id === prev)) return sorted[sorted.length - 1].id;
        return prev;
      });
    }
    if (data.cdiRate !== undefined) setCdiRate(data.cdiRate);
    if (data.dashboardOrder) setDashboardOrder(data.dashboardOrder);

    if (data.appLanguage && ['pt', 'en', 'es'].includes(data.appLanguage)) {
      setAppLanguage(data.appLanguage);
      saveData(STORAGE_KEYS.APP_LANGUAGE, data.appLanguage);
    }
  }, []);

  const handleChangeLanguage = useCallback((lang: AppLanguage) => {
    setAppLanguage(lang);
    saveData(STORAGE_KEYS.APP_LANGUAGE, lang);
    setIsLangMenuOpen(false);

    const email = currentStateRef.current.currentUserEmail;
    if (email) {
      saveUserField(email, 'appLanguage', lang);
      lastActionTimeRef.current = Date.now();
    }
  }, []);

  const handleDuplicateMonth = useCallback(async () => {
    const cur = currentStateRef.current;
    const act = cur.months.find(m => m.id === activeMonthId) || cur.months[0];
    if (!act) return;

    const actMonthNorm = (act.month || "").trim().toUpperCase();
    const actYear = act.year || "";

    let currentIdx = MONTH_NAMES.indexOf(actMonthNorm);
    if (currentIdx === -1) currentIdx = 0;

    let nIdx = currentIdx + 1;
    let nYr = parseInt(actYear) || new Date().getFullYear();

    if (nIdx > 11) { nIdx = 0; nYr += 1; }

    const nName = MONTH_NAMES[nIdx];
    const nYrS = nYr.toString();

    if (cur.months.find(m => (m.month || "").toUpperCase().trim() === nName && m.year === nYrS)) {
      const currentLang = cur.appLanguage;
      const tCommon = (TRANSLATIONS[currentLang] || TRANSLATIONS['pt']).common;
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

    const nTx: Transaction[] = sourceTx.map((t, i) => {
      let originalDate = new Date();
      if (t.date.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = t.date.split(' ')[0].split('-');
        originalDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else if (t.date.toLowerCase().includes('hoje')) { // Legacy "hoje"
        originalDate = new Date();
      } else {
        const parts = t.date.split(' ');
        if (parts.length >= 2) {
          const day = parseInt(parts[0], 10);
          const code = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
          const fullMonth = SHORT_CODE_TO_FULL[code];
          const monthIdx = MONTH_NAMES.indexOf(fullMonth);
          if (monthIdx !== -1) {
            originalDate = new Date(parseInt(actYear), monthIdx, day);
          }
        }
      }

      const targetDate = new Date(originalDate);
      const originalDay = targetDate.getDate();
      targetDate.setMonth(targetDate.getMonth() + 1);
      if (targetDate.getDate() !== originalDay) {
        targetDate.setDate(0);
      }

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
    const cur = currentStateRef.current;
    if (cur.months.length <= 1) return;
    const target = cur.months.find(m => m.id === id);
    if (!target) return;
    lastActionTimeRef.current = Date.now();
    const updMonths = cur.months.filter(m => m.id !== id);
    const targetMonthNorm = (target.month || "").toUpperCase().trim();
    const targetYear = target.year || "";

    const updTx = cur.transactions.filter(t => !((t.month || getMonthFromDateStr(t.date) || "").toUpperCase().trim() === targetMonthNorm && (t.year || getYearFromDateStr(t.date, targetYear)) === targetYear));
    const deletedAccIds = new Set(cur.accounts.filter(a => (a.month || "").toUpperCase().trim() === targetMonthNorm && a.year === targetYear).map(a => a.id));
    const updAcc = cur.accounts.filter(a => !deletedAccIds.has(a.id));
    const updDashboardOrder = cur.dashboardOrder.filter(oid => oid === BALANCE_CARD_ID || !deletedAccIds.has(oid));

    setMonths(updMonths);
    setTransactions(updTx);
    setAccounts(updAcc);
    setDashboardOrder(updDashboardOrder);
    setActiveMonthId(prev => prev === id ? (sortMonths(updMonths).length > 0 ? sortMonths(updMonths)[sortMonths(updMonths).length - 1].id : prev) : prev);
    const email = currentStateRef.current.currentUserEmail;
    if (email) { await Promise.all([hardDeleteMonth(id, target.month, targetYear), saveUserField(email, "dashboardOrder", updDashboardOrder)]); lastActionTimeRef.current = Date.now(); }
  }, []);

  const handleSaveTransaction = useCallback((data: any) => {
    const cur = currentStateRef.current;
    const act = cur.months.find(m => m.id === cur.activeMonthId);
    const editingTx = cur.editingTransaction;
    const email = cur.currentUserEmail;
    setTransactions(prev => {
      if (editingTx) {
        const upd = { ...editingTx, ...data };
        if (email) { upsertItem(email, 'transactions', upd); lastActionTimeRef.current = Date.now(); }
        return prev.map(t => t.id === editingTx.id ? upd : t);
      } else {
        const nTx = { id: generateUUID(), ...data, month: act?.month, year: act?.year, createdAt: new Date().toISOString() };
        if (email) { upsertItem(email, 'transactions', nTx); lastActionTimeRef.current = Date.now(); }
        return [nTx, ...prev];
      }
    });
    setEditingTransaction(null);
  }, []);

  const handleSaveAccount = useCallback((name: string, balance: number, theme: CardTheme) => {
    const cur = currentStateRef.current;
    const act = cur.months.find(m => m.id === cur.activeMonthId);
    const email = cur.currentUserEmail;
    if (cur.editingAccount) {
      const upd = { ...cur.editingAccount, name, balance, colorTheme: theme };
      setAccounts(prev => prev.map(a => a.id === cur.editingAccount!.id ? upd : a));
      if (email) { upsertItem(email, 'accounts', upd); lastActionTimeRef.current = Date.now(); }
      setEditingAccount(null);
    } else {
      const nAcc = { id: generateUUID(), name, balance, colorTheme: theme, month: act?.month, year: act?.year };
      const newOrder = [...cur.dashboardOrder, nAcc.id];
      setAccounts(prev => [...prev, nAcc]);
      setDashboardOrder(newOrder);
      if (email) { upsertItem(email, 'accounts', nAcc); saveUserField(email, 'dashboardOrder', newOrder); lastActionTimeRef.current = Date.now(); }
    }
  }, []);

  const handleDeleteAccount = useCallback((id: string) => {
    const cur = currentStateRef.current;
    const newOrder = cur.dashboardOrder.filter(o => o !== id);
    setAccounts(p => p.filter(a => a.id !== id));
    setDashboardOrder(newOrder);
    const email = cur.currentUserEmail;
    if (email) { deleteItem(email, 'accounts', id); saveUserField(email, 'dashboardOrder', newOrder); lastActionTimeRef.current = Date.now(); }
  }, []);

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
    if (name) {
      await registerUser(email, name, { months: [SYSTEM_INITIAL_MONTH], language: appLanguage });
    } else {
      await loginUser(email);
    }

    setCurrentUserEmail(email);
    saveData(STORAGE_KEYS.USER_SESSION, email);

    setIsProfileModalOpen(false);
    setCurrentView('home');

    // UX: Request permission after UI settles on home screen
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }, 1000);

  }, [appLanguage]);

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
        const email = currentStateRef.current.currentUserEmail;
        if (email) {
          saveUserField(email, 'dashboardOrder', nO);
          lastActionTimeRef.current = Date.now();
        }
      }
    }
  }, []);

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

  // --- STABLE COMPUTED VALUES ---
  const unreadNotifCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const tutorialLabels = useMemo(() => ({
    next: t.tutorial.next,
    prev: t.tutorial.prev,
    finish: t.tutorial.finish,
    skip: t.tutorial.skip,
  }), [t.tutorial.next, t.tutorial.prev, t.tutorial.finish, t.tutorial.skip]);

  const activeMonthContext = useMemo(() => ({
    monthIndex: MONTH_NAMES.indexOf((activeMonth.month || '').toUpperCase()),
    year: parseInt(activeMonth.year),
  }), [activeMonth.month, activeMonth.year]);

  // --- STABLE MODAL CALLBACKS ---
  const handleCloseAddTransaction = useCallback(() => { setIsAddTransactionOpen(false); setEditingTransaction(null); }, []);
  const handleCloseAddAccount = useCallback(() => { setIsAddAccountOpen(false); setEditingAccount(null); }, []);
  const handleCloseCalculator = useCallback(() => setIsCalculatorOpen(false), []);
  const handleCloseProfileModal = useCallback(() => setIsProfileModalOpen(false), []);
  const handleCloseNotepad = useCallback(() => setIsNotepadOpen(false), []);
  const handleCloseCalendar = useCallback(() => setIsCalendarOpen(false), []);
  const handleCloseNotification = useCallback(() => setIsNotificationOpen(false), []);
  const handleCloseAnalytics = useCallback(() => setIsAnalyticsOpen(false), []);
  const handleCloseProModal = useCallback(() => setIsProModalOpen(false), []);
  const handleCloseDonation = useCallback(() => setIsDonationModalOpen(false), []);
  const handleOpenDonation = useCallback(() => setIsDonationModalOpen(true), []);
  const handleOpenNotification = useCallback(() => setIsNotificationOpen(true), []);
  const noop = useCallback(() => { }, []);

  const handleSaveTheme = useCallback((theme: AppTheme) => {
    setAppTheme(theme);
    saveData(STORAGE_KEYS.APP_THEME, theme);
    const email = currentStateRef.current.currentUserEmail;
    if (email) { saveUserField(email, 'theme', theme); lastActionTimeRef.current = Date.now(); }
    setCurrentView('home');
  }, []);

  const handleSaveProfile = useCallback((p: UserProfile) => {
    setUserProfile(p);
    const email = currentStateRef.current.currentUserEmail;
    if (email) { saveUserField(email, 'profile', p); lastActionTimeRef.current = Date.now(); }
  }, []);

  const handleProUpgrade = useCallback(() => {
    setUserProfile(p => ({ ...p, isPro: true }));
    setIsProModalOpen(false);
    const cur = currentStateRef.current;
    const email = cur.currentUserEmail;
    if (email) { saveUserField(email, 'profile', { ...cur.userProfile, isPro: true }); lastActionTimeRef.current = Date.now(); }
  }, []);

  const handleSaveNotepad = useCallback((c: string, d: any) => {
    const cur = currentStateRef.current;
    setMonths(prev => {
      const updatedMonths = prev.map(m =>
        m.id === cur.activeMonthId ? { ...m, notepadContent: c, notepadDrawing: d } : m
      );
      const email = cur.currentUserEmail;
      if (email) {
        const monthToSave = updatedMonths.find(m => m.id === cur.activeMonthId);
        if (monthToSave) {
          const { count, ...restOfMonth } = monthToSave as any;
          upsertItem(email, 'months', restOfMonth);
          lastActionTimeRef.current = Date.now();
        }
      }
      return updatedMonths;
    });
  }, []);

  const handleMarkAllRead = useCallback(() => {
    const cur = currentStateRef.current;
    const idsToDismiss = cur.notifications.map(n => n.id);
    setDismissedNotifIds(prev => [...new Set([...prev, ...idsToDismiss])]);
    setNotifications([]);
    const email = cur.currentUserEmail;
    if (email) { saveCollection(email, 'notifications', []); lastActionTimeRef.current = Date.now(); }
  }, []);

  const handleDeleteNotification = useCallback((id: string) => {
    setDismissedNotifIds(prev => [...new Set([...prev, id])]);
    setNotifications(p => p.filter(n => n.id !== id));
    const email = currentStateRef.current.currentUserEmail;
    if (email) { deleteItem(email, 'notifications', id); lastActionTimeRef.current = Date.now(); }
  }, []);

  const fakeTransactionForTutorial: Transaction = useMemo(() => ({
    id: 'tutorial-fake-tx',
    name: 'CAFÉ DA MANHÃ',
    date: getLocalISODateString(), // Use standardized date
    amount: 15.50,
    type: 'purchase',
    logoType: 'food',
    paid: false,
    paymentMethod: 'card'
  }), [t.transactionList.today]);

  // Dynamic Transaction List for Tutorial
  const transactionListStepIndex = 8;
  let transactionsForList = filteredTx;
  if (isTutorialActive && tutorialStep === transactionListStepIndex && filteredTx.length === 0) {
    transactionsForList = [fakeTransactionForTutorial];
  }

  // LOGIN SCREEN
  if (!currentUserEmail) {
    return <LoginScreen onLogin={handleLoginSuccess} currentLang={appLanguage} onLanguageChange={handleChangeLanguage} />;
  }

  if (isLoadingData && !userProfile.name) return <SplashScreen />;

  return (
    <div key={currentUserEmail} ref={mainScrollRef} className={`h-full overflow-y-auto bg-[#0a0a0b] text-white px-2 pt-4 pb-[11.5rem] font-sans selection:bg-accent selection:text-black no-scrollbar ${isAnyModalOpen ? 'overflow-hidden' : ''}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {currentView === 'home' ? (
        <>
          <div className="flex justify-between items-center mb-6 pl-1">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleOpenProfile} data-tour-id="profile-header">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full border-2 overflow-hidden shadow-lg ${userProfile.isPro ? 'border-yellow-500' : 'border-transparent group-hover:border-accent'}`}><img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /></div>
                {userProfile.isPro && <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-[#0a0a0b]"><Crown className="w-3 h-3 text-black fill-black" /></div>}
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.welcome},</span>
                <div className="flex items-center gap-1"><h1 className="text-white text-xl font-bold leading-none">{userProfile.name || t.common?.defaultUser || 'User'}</h1>{userProfile.isPro && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}</div>
              </div>
            </div>
            <div className="flex items-center gap-2" data-tour-id="header-actions">

              <div className="relative" data-tour-id="language-selector">
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

              <button
                onClick={handleRestartTutorials}
                className="p-3 bg-surface rounded-2xl hover:bg-surfaceLight transition-colors cursor-pointer active:scale-95 text-gray-400"
                title={t.common.restartTutorial}
              >
                <HelpCircle className="w-6 h-6" />
              </button>

              <IconBell count={unreadNotifCount} onClick={handleOpenNotification} data-tour-id="notification-bell" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-6">
            {dItems.map(id => {
              if (id === BALANCE_CARD_ID) return (
                <BalanceCard key={id} id={id} data-tour-id="balance-card" balance={(filteredAcc.reduce((a, b) => a + b.balance, 0) - filteredTx.reduce((a, b) => a + b.amount, 0))} label={t.balanceLabel} addButtonLabel={t.addBtn} onAddClick={handleOpenAddTransaction} onDuplicateClick={handleDuplicateMonth} onCalculatorClick={handleOpenCalculator} draggable onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} appLanguage={appLanguage} />
              );
              const a = filteredAcc.find(x => x.id === id);
              if (a) return <SecondaryCard key={a.id} account={a} onDelete={handleDeleteAccount} onEdit={handleEditAccount} draggable onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} appLanguage={appLanguage} />;
              return null;
            })}
          </div>
          <ContactsRow contacts={mockContacts} onAddClick={handleOpenAddAccount} onContactClick={handleContactClick} isPro={!!userProfile.isPro} title={t.quickAccessTitle} appLanguage={appLanguage} />
          <TransactionSummary months={months} activeMonthId={activeMonthId} onSelectMonth={setActiveMonthId} onDeleteMonth={handleDeleteMonth} appLanguage={appLanguage} />
          <TransactionList
            transactions={transactionsForList}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            onToggleStatus={handleToggleStatus}
            onTogglePaymentMethod={handleTogglePaymentMethod}
            title={t.billsTitle}
            appLanguage={appLanguage}
          />

          {!userProfile.isPro && (
            <div className="px-1 mt-6">

              <div
                onClick={handleOpenDonation}
                className="mb-4 block w-full bg-[#1c1c1e] border border-white/5 rounded-[1.5rem] p-4 relative overflow-hidden group active:scale-95 transition-all cursor-pointer"
              >
                <div className="absolute -top-[1px] -right-[1px] bg-emerald-500/20 px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/10 z-10">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{t.home?.support?.tag || "Apoie"}</span>
                </div>

                <div className="flex items-center gap-4">
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
        <SettingsView currentThemeId={appTheme.id} onSaveTheme={handleSaveTheme} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />
      ) : currentView === 'long-term' ? (
        <LongTermView items={longTermTransactions} onAdd={handleLongTermAdd} onEdit={handleLongTermEdit} onDelete={handleLongTermDelete} appLanguage={appLanguage} isPro={!!userProfile.isPro} />
      ) : (
        <InvestmentsView investments={investments} onAdd={handleInvestmentAdd} onEdit={handleInvestmentEdit} onDelete={handleInvestmentDelete} onBack={handleGoHome} cdiRate={cdiRate} onUpdateCdiRate={handleInvestmentUpdateRate} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />
      )}
      <BottomNav currentView={currentView} onChangeView={setCurrentView} labels={t.nav || { home: 'INÍCIO', invest: 'INVEST', wallet: 'CARTEIRA', config: 'CONFIG' }} />
      <AddTransactionModal isOpen={isAddTransactionOpen} onClose={handleCloseAddTransaction} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} activeMonthContext={activeMonthContext} appLanguage={appLanguage} />
      <AddAccountModal isOpen={isAddAccountOpen} onClose={handleCloseAddAccount} onSave={handleSaveAccount} accountToEdit={editingAccount} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />
      <CalculatorModal isOpen={isCalculatorOpen} onClose={handleCloseCalculator} appLanguage={appLanguage} />
      <EditProfileModal isOpen={isProfileModalOpen} onClose={handleCloseProfileModal} onSave={handleSaveProfile} onLogout={handleLogout} onDeleteAccount={noop} currentProfile={userProfile} appLanguage={appLanguage} onOpenProModal={handleOpenPro} />
      <NotepadModal
        isOpen={isNotepadOpen}
        onClose={handleCloseNotepad}
        initialContent={activeMonth?.notepadContent || ''}
        initialDrawing={activeMonth?.notepadDrawing || null}
        onSave={handleSaveNotepad}
        appLanguage={appLanguage}
      />
      <CalendarModal isOpen={isCalendarOpen} onClose={handleCloseCalendar} transactions={transactions} activeMonthContext={activeMonthContext} appLanguage={appLanguage} />
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={handleCloseNotification}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDeleteNotification}
        currentUserEmail={currentUserEmail}
        appLanguage={appLanguage}
        isSubscribedOnBackend={!!userProfile.pushSubscription}
      />
      <Suspense fallback={null}>{isAnalyticsOpen && <AnalyticsModal isOpen={isAnalyticsOpen} onClose={handleCloseAnalytics} transactions={transactions} months={months} appLanguage={appLanguage} />}</Suspense>
      <ProModal
        isOpen={isProModalOpen}
        onClose={handleCloseProModal}
        onUpgrade={handleProUpgrade}
        userEmail={currentUserEmail || undefined}
        userName={userProfile.name}
        appLanguage={appLanguage}
      />
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={handleCloseDonation}
        userEmail={currentUserEmail || undefined}
        userName={userProfile.name}
        appLanguage={appLanguage}
      />
      <Tutorial
        isOpen={isTutorialActive && currentView === 'home'}
        currentStep={tutorialStep}
        onClose={handleCloseTutorial}
        onNext={handleTutorialNext}
        onPrev={handleTutorialPrev}
        steps={TUTORIAL_STEPS}
        labels={tutorialLabels}
      />
      <Tutorial
        isOpen={isInvestmentsTutorialOpen && currentView === 'investments'}
        currentStep={0}
        onClose={handleCloseInvestmentsTutorial}
        onNext={handleCloseInvestmentsTutorial}
        onPrev={noop}
        steps={INVESTMENTS_TUTORIAL_STEPS}
        labels={tutorialLabels}
      />
    </div>
  );
};

export default App;
