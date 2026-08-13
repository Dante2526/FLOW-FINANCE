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
import { Crown, Languages, ExternalLink, Zap, Heart, Copy, Check, ChevronRight, HelpCircle, CalendarClock, X, Plus, Landmark, Bell } from 'lucide-react';

import { loginUser, registerUser, loadUserData, saveCollection, saveUserField, subscribeToUserChanges, supabase, upsertItem, upsertBatch, deleteItem, hardDeleteMonth } from './services/supabase';
import { applyYieldToAll } from './services/investmentYield';

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

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}/;

const getMonthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return '';

  // Primary path for 'YYYY-MM-DD'
  if (ISO_DATE_REGEX.test(dateStr)) {
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
  if (ISO_DATE_REGEX.test(dateStr)) {
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
  const [autoCreatedMonthName, setAutoCreatedMonthName] = useState<string | null>(null);

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
  const hasAutoCheckedMonthRef = useRef<boolean>(false);
  const syncDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef<boolean>(false);
  const lastFocusSyncTimeRef = useRef<number>(0);

  // Robust translation retrieval with fallback
  const t = TRANSLATIONS[appLanguage] || TRANSLATIONS['pt'];

  // Dynamic Contacts with Translations
  const mockContacts = useMemo(() => [
    { id: '1', name: t.notepad?.title || 'Notepad', imageUrl: '' },
    { id: '2', name: t.calendar?.title || 'Calendar', imageUrl: '' },
    { id: '3', name: t.analytics?.title || 'Analytics', imageUrl: '' }
  ], [t]);

  // Memoized months with updated total/count to avoid double-renders from state-synced useEffect
  const enrichedMonths = useMemo(() => {
    return months.map(m => {
      const mName = (m.month || "").toUpperCase().trim();
      const mYear = m.year || "";
      const mTx = transactions.filter(t =>
        (t.month || getMonthFromDateStr(t.date) || "").toUpperCase().trim() === mName &&
        (t.year || getYearFromDateStr(t.date, mYear)) === mYear
      );
      const total = roundMoney(mTx.reduce((s, t) => s + t.amount, 0)), count = mTx.length;
      return { ...m, total, count };
    });
  }, [months, transactions]);

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

    const executeSync = () => {
      const syncStartTime = Date.now();
      // Block sync if a user action happened recently to prevent race conditions.
      if (syncStartTime - lastActionTimeRef.current < 5000) {
        return;
      }

      // Mutex: prevent concurrent sync executions
      if (isSyncingRef.current) {
        return;
      }
      isSyncingRef.current = true;

      loadUserData(currentUserEmail)
        .then(data => {
          if (data) {
            // After fetching, check again. If an action happened DURING the fetch, discard stale data.
            if (lastActionTimeRef.current > syncStartTime) {
              console.warn("Stale sync data detected after user action. Discarding.");
              return;
            }
            applyData(data);
          }
        })
        .catch(err => {
          console.error("Erro durante a sincronização de dados:", err);
        })
        .finally(() => {
          isSyncingRef.current = false;
        });
    };

    // Debounce de 800ms para eventos Realtime (consolida rajadas de alterações)
    const handleRealtimeUpdate = () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
      syncDebounceTimerRef.current = setTimeout(() => {
        syncDebounceTimerRef.current = null;
        executeSync();
      }, 800);
    };

    // Throttle de 60s para o evento focus da janela (evita recargas ao trocar de aba)
    const handleWindowFocus = () => {
      const now = Date.now();
      const FOCUS_COOLDOWN_MS = 60 * 1000;

      if (now - lastFocusSyncTimeRef.current < FOCUS_COOLDOWN_MS) {
        return;
      }

      lastFocusSyncTimeRef.current = now;
      executeSync();
    };

    const unsubscribe = subscribeToUserChanges(currentUserEmail, handleRealtimeUpdate);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
        syncDebounceTimerRef.current = null;
      }
      unsubscribe();
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [currentUserEmail, isSessionReady]);

  // SYSTEM: Check for bills due today and generate notifications
  const systemNotifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isLoadingData) return;

    const todayStr = getLocalISODateString();
    const now = new Date();
    const nowTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const locale = getLocale(appLanguage);
    const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

    const dueTodayTransactions = transactions.filter(t => !t.paid && t.date === todayStr);
    if (dueTodayTransactions.length === 0) return;

    setNotifications(prevNotifications => {
      const missingNotifs: AppNotification[] = [];

      dueTodayTransactions.forEach(t => {
        const notifId = t.id;
        const exists = prevNotifications.some(n => n.id === notifId || n.id === `bill-due-${t.id}`);
        const isDismissed = dismissedNotifIds.includes(notifId) || dismissedNotifIds.includes(`bill-due-${t.id}`);

        if (!exists && !isDismissed) {
          const formattedValue = t.amount.toLocaleString(locale, { minimumFractionDigits: 2 });

          const systemTranslations = TRANSLATIONS[appLanguage]?.notifications?.system || TRANSLATIONS['pt'].notifications.system;

          const title = systemTranslations.billDueTitle;
          const message = systemTranslations.billDueMessage
            .replace('{name}', t.name)
            .replace('{value}', `${currencySymbol} ${formattedValue}`);
          const dateStr = systemTranslations.todayAt.replace('{time}', nowTime);

          const newNotif: AppNotification = {
            id: notifId,
            title: title,
            message: message,
            date: dateStr,
            read: false,
            type: 'alert'
          };

          missingNotifs.push(newNotif);

          // TRIGGER SYSTEM NOTIFICATION
          if (Notification.permission === 'granted' && !systemNotifiedRef.current.has(notifId) && !systemNotifiedRef.current.has(`bill-due-${t.id}`)) {
            systemNotifiedRef.current.add(notifId);
            systemNotifiedRef.current.add(`bill-due-${t.id}`);

            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                  body: message,
                  icon: '/icon-192x192.png',
                  badge: '/notification-icon.png', 
                  vibrate: [100, 50, 100],
                  tag: `bill-due-${t.id}`,
                  data: { url: '/' }
                } as any);
              });
            } else {
              new Notification(title, { body: message, tag: `bill-due-${t.id}` } as any);
            }
          }
        }
      });

      if (missingNotifs.length === 0) return prevNotifications;

      if (currentUserEmail) {
        Promise.all(missingNotifs.map(n => upsertItem(currentUserEmail!, 'notifications', n)))
          .then(() => lastActionTimeRef.current = Date.now());
      }

      return [...missingNotifs, ...prevNotifications];
    });
  }, [transactions, isLoadingData, currentUserEmail, appLanguage, dismissedNotifIds]);

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
        if (currentStateRef.current.currentView === 'home') {
          handleStartTutorial();
        }
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
        if (currentStateRef.current.currentView === 'investments') {
          setIsInvestmentsTutorialOpen(true);
        }
      }
    }
  }, [currentView, isLoadingData, currentUserEmail]);


  const applyData = useCallback((data: any) => {
    if (data.profile) setUserProfile(data.profile);
    if (data.transactions) setTransactions(data.transactions);
    if (data.accounts) setAccounts(data.accounts);
    if (data.investments) {
      // Apply pending yield to investments on load
      const rate = data.cdiRate !== undefined ? data.cdiRate : currentStateRef.current.cdiRate;
      const { investments: yieldedInvestments, hasChanges } = applyYieldToAll(data.investments, rate);
      setInvestments(yieldedInvestments);
      // Persist updated amounts to Supabase if yield was applied
      if (hasChanges) {
        const email = currentStateRef.current.currentUserEmail;
        if (email) {
          Promise.all(yieldedInvestments
            .filter((inv: any, i: number) => inv !== data.investments[i])
            .map((inv: any) => upsertItem(email, 'investments', inv))
          ).then(() => { lastActionTimeRef.current = Date.now(); });
        }
      }
    }
    if (data.longTerm) setLongTermTransactions(data.longTerm);
    if (data.notifications) {
      const dedupedMap = new Map<string, AppNotification>();
      (data.notifications as AppNotification[]).forEach(n => {
        if (!dedupedMap.has(n.id)) {
          dedupedMap.set(n.id, n);
        }
      });
      setNotifications(Array.from(dedupedMap.values()));
    }
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

  const handleToggleAutoCreateMonth = useCallback((val: boolean) => {
    setUserProfile(prev => ({ ...prev, autoCreateMonth: val }));
    const email = currentStateRef.current.currentUserEmail;
    if (email) {
      saveUserField(email, 'profile', { ...currentStateRef.current.userProfile, autoCreateMonth: val });
    }
  }, []);

  const handleDuplicateMonth = useCallback(async (targetId?: string, isAutoRun?: boolean) => {
    const cur = currentStateRef.current;
    if (isAutoRun && typeof targetId !== 'string') return;
    const act = cur.months.find(m => m.id === (typeof targetId === 'string' ? targetId : activeMonthId)) || cur.months[0];
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
      if (isAutoRun) return; // Silent abort if already exists
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
      const { count, total, ...nMonthData } = nMonth;
      const savePromises: Promise<any>[] = [
        upsertItem(currentUserEmail, "months", nMonthData),
        saveUserField(currentUserEmail, "dashboardOrder", finalDashboardOrder)
      ];
      if (nTx.length > 0) {
        savePromises.push(upsertBatch(currentUserEmail, "transactions", nTx));
      }
      if (nAcc.length > 0) {
        savePromises.push(upsertBatch(currentUserEmail, "accounts", nAcc));
      }
      await Promise.all(savePromises);
      lastActionTimeRef.current = Date.now();
    }
    
    if (isAutoRun) {
      setAutoCreatedMonthName(`${nName} ${nYrS}`);
    }
  }, [activeMonthId, currentUserEmail]);

  // AUTO CREATE MONTH EFFECT
  useEffect(() => {
    const cur = currentStateRef.current;
    if (isLoadingData || !cur.userProfile.autoCreateMonth || !cur.userProfile.isPro || hasAutoCheckedMonthRef.current || cur.months.length === 0) return;

    hasAutoCheckedMonthRef.current = true; // Só roda uma vez por boot do app

    let maxYear = 0;
    let maxMonthIdx = -1;
    let latestMonthObj: MonthSummary | null = null;

    cur.months.forEach(m => {
        const y = parseInt(m.year || "0");
        const idx = MONTH_NAMES.indexOf((m.month || "").trim().toUpperCase());
        if (y > maxYear || (y === maxYear && idx > maxMonthIdx)) {
            maxYear = y;
            maxMonthIdx = idx;
            latestMonthObj = m;
        }
    });

    if (!latestMonthObj) return;

    const today = new Date();
    const currYear = today.getFullYear();
    const currMonthIdx = today.getMonth();

    if (maxYear < currYear || (maxYear === currYear && maxMonthIdx < currMonthIdx)) {
        // Automaticamente gera a partir do MÊS MAIS RECENTE da conta
        handleDuplicateMonth(latestMonthObj.id, true);
    }
  }, [isLoadingData, handleDuplicateMonth]);

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
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const n = { ...i, id: generateUUID(), lastYieldDate: todayStr };
    setInvestments(p => [...p, n]);
    if (currentUserEmail) { upsertItem(currentUserEmail, 'investments', n); lastActionTimeRef.current = Date.now(); }
  }, [currentUserEmail]);

  const handleInvestmentEdit = useCallback((i: Investment) => {
    // If the amount was manually changed, reset lastYieldDate to prevent double-yield
    const oldInv = currentStateRef.current.investments.find(o => o.id === i.id);
    let updated = i;
    if (oldInv && oldInv.amount !== i.amount) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      updated = { ...i, lastYieldDate: todayStr };
    }
    setInvestments(p => p.map(o => o.id === updated.id ? updated : o));
    if (currentUserEmail) { upsertItem(currentUserEmail, 'investments', updated); lastActionTimeRef.current = Date.now(); }
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
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

  }, [appLanguage]);

  const handleDragStart = useCallback((id: string) => { dragItem.current = id; }, []);
  const handleDragEnd = useCallback(() => { dragItem.current = null; }, []);

  const handleDragEnter = useCallback((tId: string) => {
    if (dragItem.current && dragItem.current !== tId) {
      const nO = [...currentStateRef.current.dashboardOrder];
      // FIX: Ensure BALANCE_CARD_ID is in the order list before attempting to swap
      if (!nO.includes(BALANCE_CARD_ID)) { nO.unshift(BALANCE_CARD_ID); }

      const act = currentStateRef.current.months.find(m => m.id === currentStateRef.current.activeMonthId);
      if (act) {
        const mName = (act.month || "").toUpperCase().trim();
        const mYear = act.year || "";
        const fAcc = currentStateRef.current.accounts.filter(a => (a.month || "").toUpperCase().trim() === mName && (a.year || "") === mYear);
        fAcc.forEach(a => { if (!nO.includes(a.id)) nO.push(a.id); });
      }

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
  const currentBalance = useMemo(() => {
    return filteredAcc.reduce((a, b) => a + b.balance, 0) - filteredTx.reduce((a, b) => a + b.amount, 0);
  }, [filteredAcc, filteredTx]);

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
      {autoCreatedMonthName && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-5 fade-in duration-300 w-[92%] max-w-sm">
          <div className="bg-[#0f0f11]/85 backdrop-blur-xl border border-white/[0.08] text-white px-5 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden group before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-gradient-to-b before:from-accent before:to-accent/30 before:rounded-l-3xl">
            {/* Background Accent Glow */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent/25 to-accent/5 border border-accent/25 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
               <CalendarClock className="w-[22px] h-[22px] text-accent animate-pulse" />
            </div>
            <div className="flex-1 pr-6">
              <p className="text-sm font-semibold tracking-wide text-white/95 leading-tight">{t.settings?.autoMonthCreatedToast || '💳 Mês Criado Automaticamente!'}</p>
              <p className="text-[11px] text-white/60 mt-1 line-clamp-2 leading-relaxed">{t.settings?.autoMonthCreatedExplain}</p>
              <div className="mt-2.5 flex">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-accent/15 text-accent border border-accent/20 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                  </span>
                  {autoCreatedMonthName}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setAutoCreatedMonthName(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center pointer-events-auto cursor-pointer text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
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
          {!userProfile.pushSubscription && (
            <div className="mb-4 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-3 rounded-full shrink-0">
                  <Bell className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">
                    {appLanguage === 'pt' ? 'Ative as Notificações' : appLanguage === 'en' ? 'Enable Notifications' : 'Activar Notificaciones'}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {appLanguage === 'pt' ? 'Reative os alertas para continuar recebendo avisos.' : appLanguage === 'en' ? 'Re-enable alerts to continue receiving notifications.' : 'Vuelva a activar las alertas para seguir recibiendo notificaciones.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsNotificationOpen(true)} 
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-[1.5rem] text-xs whitespace-nowrap transition-colors w-full sm:w-auto shadow-md"
              >
                {appLanguage === 'pt' ? 'Ativar Agora' : appLanguage === 'en' ? 'Enable Now' : 'Activar Ahora'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-6">
            {dItems.map(id => {
              if (id === BALANCE_CARD_ID) return (
                <BalanceCard key={id} id={id} data-tour-id="balance-card" balance={currentBalance} label={t.balanceLabel} draggable onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} appLanguage={appLanguage} />
              );
              const a = filteredAcc.find(x => x.id === id);
              if (a) return <SecondaryCard key={a.id} account={a} onDelete={handleDeleteAccount} onEdit={handleEditAccount} draggable onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} appLanguage={appLanguage} />;
              return null;
            })}

            {/* Novo Cartão de Nova Fonte de Renda */}
            <div className="md:col-span-2 md:max-w-2xl md:mx-auto w-full bg-[#161618] rounded-[2rem] p-4 flex items-center justify-between shadow-lg h-auto min-h-[5rem]">
              <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase ml-2">{t.common?.addSource || "Nova Fonte de Renda"}</span>
              <button
                onClick={handleOpenAddAccount}
                className="w-12 h-12 rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-sm active:scale-95 transition-transform group"
                data-tour-id="add-income-source"
              >
                <Landmark className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors" />
              </button>
            </div>
          </div>
          <ContactsRow contacts={mockContacts} onCalculatorClick={handleOpenCalculator} onContactClick={handleContactClick} isPro={!!userProfile.isPro} title={t.quickAccessTitle} appLanguage={appLanguage} />
          <TransactionSummary months={enrichedMonths} activeMonthId={activeMonthId} onSelectMonth={setActiveMonthId} onDeleteMonth={handleDeleteMonth} onDuplicateMonth={() => handleDuplicateMonth()} appLanguage={appLanguage} />
          <TransactionList
            transactions={transactionsForList}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            onToggleStatus={handleToggleStatus}
            onTogglePaymentMethod={handleTogglePaymentMethod}
            title={t.billsTitle}
            appLanguage={appLanguage}
            onAddClick={handleOpenAddTransaction}
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
        <SettingsView currentThemeId={appTheme.id} onSaveTheme={handleSaveTheme} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} autoCreateMonth={userProfile.autoCreateMonth} onToggleAutoCreateMonth={handleToggleAutoCreateMonth} />
      ) : currentView === 'long-term' ? (
        <LongTermView items={longTermTransactions} onAdd={handleLongTermAdd} onEdit={handleLongTermEdit} onDelete={handleLongTermDelete} appLanguage={appLanguage} isPro={!!userProfile.isPro} />
      ) : (
        <InvestmentsView investments={investments} onAdd={handleInvestmentAdd} onEdit={handleInvestmentEdit} onDelete={handleInvestmentDelete} onBack={handleGoHome} cdiRate={cdiRate} onUpdateCdiRate={handleInvestmentUpdateRate} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />
      )}
      <BottomNav currentView={currentView} onChangeView={setCurrentView} labels={t.nav || { home: 'INÍCIO', invest: 'INVEST', wallet: 'CARTEIRA', config: 'CONFIG' }} />
      {isAddTransactionOpen && <AddTransactionModal isOpen={isAddTransactionOpen} onClose={handleCloseAddTransaction} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} activeMonthContext={activeMonthContext} appLanguage={appLanguage} />}
      {isAddAccountOpen && <AddAccountModal isOpen={isAddAccountOpen} onClose={handleCloseAddAccount} onSave={handleSaveAccount} accountToEdit={editingAccount} isPro={!!userProfile.isPro} onOpenProModal={handleOpenPro} appLanguage={appLanguage} />}
      {isCalculatorOpen && <CalculatorModal isOpen={isCalculatorOpen} onClose={handleCloseCalculator} appLanguage={appLanguage} />}
      {isProfileModalOpen && <EditProfileModal isOpen={isProfileModalOpen} onClose={handleCloseProfileModal} onSave={handleSaveProfile} onLogout={handleLogout} onDeleteAccount={noop} currentProfile={userProfile} appLanguage={appLanguage} onOpenProModal={handleOpenPro} />}
      {isNotepadOpen && (
        <NotepadModal
          isOpen={isNotepadOpen}
          onClose={handleCloseNotepad}
          initialContent={activeMonth?.notepadContent || ''}
          initialDrawing={activeMonth?.notepadDrawing || null}
          onSave={handleSaveNotepad}
          appLanguage={appLanguage}
        />
      )}
      {isCalendarOpen && <CalendarModal isOpen={isCalendarOpen} onClose={handleCloseCalendar} transactions={transactions} activeMonthContext={activeMonthContext} appLanguage={appLanguage} />}
      {isNotificationOpen && (
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
      )}
      <Suspense fallback={null}>{isAnalyticsOpen && <AnalyticsModal isOpen={isAnalyticsOpen} onClose={handleCloseAnalytics} transactions={transactions} months={enrichedMonths} appLanguage={appLanguage} />}</Suspense>
      {isProModalOpen && (
        <ProModal
          isOpen={isProModalOpen}
          onClose={handleCloseProModal}
          onUpgrade={handleProUpgrade}
          userEmail={currentUserEmail || undefined}
          userName={userProfile.name}
          appLanguage={appLanguage}
        />
      )}
      {isDonationModalOpen && (
        <DonationModal
          isOpen={isDonationModalOpen}
          onClose={handleCloseDonation}
          userEmail={currentUserEmail || undefined}
          userName={userProfile.name}
          appLanguage={appLanguage}
        />
      )}
      {isTutorialActive && currentView === 'home' && (
        <Tutorial
          isOpen={isTutorialActive && currentView === 'home'}
          currentStep={tutorialStep}
          onClose={handleCloseTutorial}
          onNext={handleTutorialNext}
          onPrev={handleTutorialPrev}
          steps={TUTORIAL_STEPS}
          labels={tutorialLabels}
        />
      )}
      {isInvestmentsTutorialOpen && currentView === 'investments' && (
        <Tutorial
          isOpen={isInvestmentsTutorialOpen && currentView === 'investments'}
          currentStep={0}
          onClose={handleCloseInvestmentsTutorial}
          onNext={handleCloseInvestmentsTutorial}
          onPrev={noop}
          steps={INVESTMENTS_TUTORIAL_STEPS}
          labels={tutorialLabels}
        />
      )}
    </div>
  );
};

export default App;
