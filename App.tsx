
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
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppTheme, AppView, LongTermTransaction, Investment, AppNotification, AppLanguage } from './types';
import { loadData, saveData, STORAGE_KEYS } from './services/storage';
import { TRANSLATIONS } from './i18n';
import { IconBell } from './components/Icons';
import { Crown, Languages } from 'lucide-react';

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
  const lower = dateStr.toLowerCase();
  if (lower.includes('hoje')) return MONTH_NAMES[new Date().getMonth()];
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
  return activeYearContext || new Date().getFullYear().toString();
};

const sortMonths = (list: MonthSummary[]) => [...list].sort((a, b) => {
    const yA = parseInt(a.year || "0"), yB = parseInt(b.year || "0");
    if (yA !== yB) return yA - yB;
    const idxA = MONTH_NAMES.indexOf((a.month || "").toUpperCase().trim());
    const idxB = MONTH_NAMES.indexOf((b.month || "").toUpperCase().trim());
    return idxA - idxB;
});

const SplashScreen = ({ text }: { text: string }) => (
  <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[100] animate-out fade-out duration-700">
    <div className="w-32 h-32 bg-[#1c1c1e] rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-black/20 mb-6">
       <FlowLogo className="w-24 h-24 text-accent" />
    </div>
    <div className="flex flex-col items-center gap-2">
       <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
       <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{text}</span>
    </div>
  </div>
);

const App = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [months, setMonths] = useState<MonthSummary[]>([SYSTEM_INITIAL_MONTH]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [longTerm, setLongTerm] = useState<LongTermTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [theme, setTheme] = useState<AppTheme>(AVAILABLE_THEMES[0]);
  const [cdiRate, setCdiRate] = useState(11.25);
  const [notepadContent, setNotepadContent] = useState('');
  const [notepadDrawing, setNotepadDrawing] = useState<string | null>(null);
  const [lang, setLang] = useState<AppLanguage>('pt');

  // UI State
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeMonthId, setActiveMonthId] = useState<string>(SYSTEM_INITIAL_MONTH.id);
  const [activeMonthContext, setActiveMonthContext] = useState({ monthIndex: currentDate.getMonth(), year: currentDate.getFullYear() });

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAddAccOpen, setIsAddAccOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        handleLogin(session.user.email);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleLogin = async (email: string, name?: string) => {
    setLoading(true);
    try {
      if (name) {
        await registerUser(email, name, { cdiRate: 11.25 });
      } else {
        await loginUser(email);
      }
      setUserEmail(email);
      const data = await loadUserData(email);
      if (data) {
        setTransactions(data.transactions || []);
        setAccounts(data.accounts || []);
        setMonths(sortMonths(data.months?.length ? data.months : [SYSTEM_INITIAL_MONTH]));
        setInvestments(data.investments || []);
        setLongTerm(data.longTerm || []);
        setNotifications(data.notifications || []);
        if (data.profile) setProfile(data.profile);
        if (data.theme) setTheme(data.theme);
        setCdiRate(data.cdiRate);
        setNotepadContent(data.notepadContent);
        setNotepadDrawing(data.notepadDrawing);
        
        // Find active month
        const now = new Date();
        const mName = MONTH_NAMES[now.getMonth()];
        const mYear = now.getFullYear().toString();
        const currentMonth = data.months.find((m: any) => m.month === mName && m.year === mYear);
        if (currentMonth) setActiveMonthId(currentMonth.id);
      }
      
      subscribeToUserChanges(email, async () => {
         const newData = await loadUserData(email);
         if (newData) {
             setTransactions(newData.transactions);
             setAccounts(newData.accounts);
             setMonths(sortMonths(newData.months));
             setInvestments(newData.investments);
             setLongTerm(newData.longTerm);
             setNotifications(newData.notifications);
             setProfile(newData.profile);
         }
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao entrar na conta.');
    } finally {
      setLoading(false);
    }
  };

  const activeMonthTransactions = useMemo(() => {
    const activeMonth = months.find(m => m.id === activeMonthId);
    if (!activeMonth) return [];
    return transactions.filter(t => {
       const m = getMonthFromDateStr(t.date);
       const y = getYearFromDateStr(t.date, activeMonth.year);
       return m === activeMonth.month && y === activeMonth.year;
    });
  }, [transactions, months, activeMonthId]);

  const activeMonthBalance = useMemo(() => {
    const accTotal = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const billsTotal = activeMonthTransactions.reduce((acc, curr) => acc + (curr.paid ? 0 : curr.amount), 0);
    return accTotal - billsTotal;
  }, [accounts, activeMonthTransactions]);

  const handleSaveTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (!userEmail) return;
    const activeMonth = months.find(m => m.id === activeMonthId) || SYSTEM_INITIAL_MONTH;
    
    const newTx: Transaction = {
      ...tx,
      id: editingTx ? editingTx.id : generateUUID(),
      month: activeMonth.month,
      year: activeMonth.year
    };

    let updatedTxList = editingTx 
      ? transactions.map(t => t.id === editingTx.id ? newTx : t)
      : [newTx, ...transactions];
      
    setTransactions(updatedTxList);
    
    // Update Month Total
    const newTotal = updatedTxList
      .filter(t => t.month === activeMonth.month && t.year === activeMonth.year)
      .reduce((acc, t) => acc + t.amount, 0);
      
    const updatedMonths = months.map(m => m.id === activeMonth.id ? { ...m, total: newTotal, count: (m.count || 0) + (editingTx ? 0 : 1) } : m);
    setMonths(updatedMonths);
    
    await saveCollection(userEmail, 'transactions', updatedTxList);
    await saveCollection(userEmail, 'months', updatedMonths);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!userEmail) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    const updatedTxList = transactions.filter(t => t.id !== id);
    setTransactions(updatedTxList);
    
    const activeMonth = months.find(m => m.month === tx.month && m.year === tx.year);
    if (activeMonth) {
       const newTotal = updatedTxList
        .filter(t => t.month === activeMonth.month && t.year === activeMonth.year)
        .reduce((acc, t) => acc + t.amount, 0);
       
       const updatedMonths = months.map(m => m.id === activeMonth.id ? { ...m, total: newTotal, count: Math.max(0, (m.count || 0) - 1) } : m);
       setMonths(updatedMonths);
       await saveCollection(userEmail, 'months', updatedMonths);
    }
    await deleteItem(userEmail, 'transactions', id);
  };

  const handleSaveAccount = async (name: string, balance: number, theme: CardTheme) => {
    if (!userEmail) return;
    const activeMonth = months.find(m => m.id === activeMonthId) || SYSTEM_INITIAL_MONTH;
    
    const newAcc: Account = {
      id: editingAcc ? editingAcc.id : generateUUID(),
      name: name.toUpperCase(),
      balance,
      colorTheme: theme,
      month: activeMonth.month,
      year: activeMonth.year
    };

    const updatedAccList = editingAcc
      ? accounts.map(a => a.id === editingAcc.id ? newAcc : a)
      : [...accounts, newAcc];
      
    setAccounts(updatedAccList);
    await saveCollection(userEmail, 'accounts', updatedAccList);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!userEmail) return;
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    await deleteItem(userEmail, 'accounts', id);
  };

  const handleDuplicateMonth = async () => {
    if (!userEmail) return;
    const currentMonth = months.find(m => m.id === activeMonthId);
    if (!currentMonth) return;

    // Calculate next month
    const currDate = new Date();
    const currentMonthIndex = MONTH_NAMES.indexOf(currentMonth.month);
    let nextMonthIndex = currentMonthIndex + 1;
    let nextYear = parseInt(currentMonth.year);
    
    if (nextMonthIndex > 11) {
        nextMonthIndex = 0;
        nextYear++;
    }
    
    const nextMonthName = MONTH_NAMES[nextMonthIndex];
    
    // Check if exists
    if (months.some(m => m.month === nextMonthName && m.year === nextYear.toString())) {
       alert(TRANSLATIONS[lang].app.duplicateAlert.replace('{month}', nextMonthName));
       return;
    }

    const newMonth: MonthSummary = {
       id: generateUUID(),
       month: nextMonthName,
       year: nextYear.toString(),
       total: currentMonth.total,
       count: currentMonth.count
    };

    const newTransactions = activeMonthTransactions.map(t => ({
       ...t,
       id: generateUUID(),
       month: nextMonthName,
       year: nextYear.toString(),
       paid: false,
       date: t.date // Keep same date string, logic might need adjustment for specific dates
    }));

    const updatedMonths = [...months, newMonth];
    const updatedTx = [...transactions, ...newTransactions];

    setMonths(sortMonths(updatedMonths));
    setTransactions(updatedTx);
    setActiveMonthId(newMonth.id);
    setActiveMonthContext({ monthIndex: nextMonthIndex, year: nextYear });

    await saveCollection(userEmail, 'months', updatedMonths);
    await saveCollection(userEmail, 'transactions', updatedTx);
  };

  const handleDeleteMonth = async (id: string) => {
     if (!userEmail || months.length <= 1) return;
     const monthToDelete = months.find(m => m.id === id);
     if (!monthToDelete) return;

     await hardDeleteMonth(id, monthToDelete.month, monthToDelete.year);
     
     const updatedMonths = months.filter(m => m.id !== id);
     setMonths(updatedMonths);
     setTransactions(transactions.filter(t => !(t.month === monthToDelete.month && t.year === monthToDelete.year)));
     setAccounts(accounts.filter(a => !(a.month === monthToDelete.month && a.year === monthToDelete.year)));
     
     if (activeMonthId === id) {
        setActiveMonthId(updatedMonths[updatedMonths.length - 1].id);
     }
  };

  if (loading) return <SplashScreen text={TRANSLATIONS[lang].app.splash} />;
  
  if (!userEmail) return <LoginScreen onLogin={handleLogin} lang={lang} onLanguageChange={setLang} />;

  return (
    <div className={`min-h-[100dvh] bg-[#0a0a0b] text-white pb-24 select-none ${theme.id} animate-in fade-in duration-500`}>
      
      {currentView === 'home' && (
        <div className="p-6 pt-8 flex flex-col gap-6 max-w-md mx-auto">
          
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-3" onClick={() => setIsProfileOpen(true)}>
                <div className="w-12 h-12 rounded-full border-2 border-accent p-0.5 cursor-pointer relative">
                   <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                   {profile.isPro && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 border border-[#0a0a0b]">
                         <Crown className="w-3 h-3 text-black fill-black" />
                      </div>
                   )}
                </div>
                <div>
                   <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{TRANSLATIONS[lang].welcome}</p>
                   <h2 className="text-xl font-bold text-white leading-none">{profile.name}</h2>
                </div>
             </div>
             
             <div className="flex gap-2">
                {!profile.isPro && (
                   <button 
                     onClick={() => setIsProModalOpen(true)}
                     className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20"
                   >
                     <Crown className="w-3 h-3 fill-black" />
                     PRO
                   </button>
                )}
                <IconBell count={notifications.filter(n => !n.read).length} onClick={() => setIsNotifOpen(true)} />
             </div>
          </div>

          <BalanceCard 
            balance={activeMonthBalance} 
            label={TRANSLATIONS[lang].balanceLabel}
            onAddClick={() => { setEditingTx(null); setIsAddTxOpen(true); }}
            onDuplicateClick={handleDuplicateMonth}
            onCalculatorClick={() => setIsCalcOpen(true)}
            lang={lang}
          />
          
          {accounts.filter(a => a.month === (months.find(m => m.id === activeMonthId)?.month || '') && a.year === (months.find(m => m.id === activeMonthId)?.year || '')).map((acc) => (
             <SecondaryCard 
                key={acc.id} 
                account={acc} 
                onDelete={handleDeleteAccount} 
                onEdit={(a) => { setEditingAcc(a); setIsAddAccOpen(true); }}
                draggable
             />
          ))}

          <button 
             onClick={() => { setEditingAcc(null); setIsAddAccOpen(true); }}
             className="w-full py-4 border-2 border-dashed border-gray-700 rounded-[2rem] text-gray-500 font-bold hover:border-gray-500 hover:text-gray-400 transition-colors"
          >
             + {TRANSLATIONS[lang].addAccount.titleNew}
          </button>
          
          <TransactionSummary 
            months={months} 
            activeMonthId={activeMonthId} 
            onSelectMonth={(id) => {
               setActiveMonthId(id);
               const m = months.find(x => x.id === id);
               if (m) {
                  setActiveMonthContext({ 
                     monthIndex: MONTH_NAMES.indexOf(m.month), 
                     year: parseInt(m.year) 
                  });
               }
            }}
            onDeleteMonth={handleDeleteMonth}
            lang={lang}
          />

          <ContactsRow 
             contacts={MOCK_CONTACTS} 
             onAddClick={() => { setEditingAcc(null); setIsAddAccOpen(true); }}
             onContactClick={(c) => {
                if (c.id === '1') setIsNotepadOpen(true);
                else if (c.id === '2') setIsCalendarOpen(true);
                else if (c.id === '3') {
                   if (profile.isPro) setIsAnalyticsOpen(true);
                   else setIsProModalOpen(true);
                }
             }}
             isPro={profile.isPro}
             lang={lang}
          />

          <TransactionList 
             transactions={activeMonthTransactions} 
             onDelete={handleDeleteTransaction}
             onEdit={(tx) => { setEditingTx(tx); setIsAddTxOpen(true); }}
             onToggleStatus={async (id) => {
                const tx = transactions.find(t => t.id === id);
                if (tx && userEmail) {
                   const updated = { ...tx, paid: !tx.paid };
                   await handleSaveTransaction(updated);
                }
             }}
             onTogglePaymentMethod={async (id) => {
                const tx = transactions.find(t => t.id === id);
                if (tx && userEmail) {
                   const updated = { ...tx, paymentMethod: tx.paymentMethod === 'pix' ? 'card' : 'pix' };
                   await handleSaveTransaction(updated);
                }
             }}
             title={TRANSLATIONS[lang].billsTitle}
             lang={lang}
          />
        </div>
      )}

      {currentView === 'investments' && (
         <div className="p-6 pt-8 max-w-md mx-auto h-[calc(100dvh-6rem)]">
            <InvestmentsView 
               investments={investments}
               onAdd={async (inv) => {
                  const newInv = { ...inv, id: generateUUID() };
                  const updated = [...investments, newInv];
                  setInvestments(updated);
                  if (userEmail) await saveCollection(userEmail, 'investments', updated);
               }}
               onEdit={async (inv) => {
                  const updated = investments.map(i => i.id === inv.id ? inv : i);
                  setInvestments(updated);
                  if (userEmail) await saveCollection(userEmail, 'investments', updated);
               }}
               onDelete={async (id) => {
                  const updated = investments.filter(i => i.id !== id);
                  setInvestments(updated);
                  if (userEmail) await deleteItem(userEmail, 'investments', id);
               }}
               onBack={() => setCurrentView('home')}
               cdiRate={cdiRate}
               onUpdateCdiRate={async (rate) => {
                  setCdiRate(rate);
                  if (userEmail) await saveUserField(userEmail, 'cdiRate', rate);
               }}
               isPro={profile.isPro}
               onOpenProModal={() => setIsProModalOpen(true)}
               lang={lang}
            />
         </div>
      )}

      {currentView === 'long-term' && (
         <div className="p-6 pt-8 max-w-md mx-auto h-[calc(100dvh-6rem)]">
            <LongTermView 
               items={longTerm}
               onAdd={async (item) => {
                  const newItem = { ...item, id: generateUUID(), installmentsPaid: 0 };
                  const updated = [...longTerm, newItem];
                  setLongTerm(updated);
                  if (userEmail) await saveCollection(userEmail, 'longTerm', updated);
               }}
               onEdit={async (item) => {
                  const updated = longTerm.map(i => i.id === item.id ? item : i);
                  setLongTerm(updated);
                  if (userEmail) await saveCollection(userEmail, 'longTerm', updated);
               }}
               onDelete={async (id) => {
                  const updated = longTerm.filter(i => i.id !== id);
                  setLongTerm(updated);
                  if (userEmail) await deleteItem(userEmail, 'longTerm', id);
               }}
               lang={lang}
            />
         </div>
      )}

      {currentView === 'settings' && (
         <div className="p-6 pt-8 max-w-md mx-auto h-[calc(100dvh-6rem)]">
            <SettingsView 
               currentThemeId={theme.id}
               onSaveTheme={async (t) => {
                  setTheme(t);
                  if (userEmail) await saveUserField(userEmail, 'theme', t);
               }}
               isPro={profile.isPro || false}
               onOpenProModal={() => setIsProModalOpen(true)}
               lang={lang}
            />
         </div>
      )}

      <BottomNav 
         currentView={currentView} 
         onChangeView={setCurrentView} 
         labels={TRANSLATIONS[lang].nav}
      />

      <AddTransactionModal 
         isOpen={isAddTxOpen} 
         onClose={() => setIsAddTxOpen(false)} 
         onSave={handleSaveTransaction}
         transactionToEdit={editingTx}
         activeMonthContext={activeMonthContext}
         lang={lang}
      />

      <AddAccountModal 
         isOpen={isAddAccOpen} 
         onClose={() => setIsAddAccOpen(false)} 
         onSave={handleSaveAccount}
         accountToEdit={editingAcc}
         isPro={profile.isPro}
         onOpenProModal={() => setIsProModalOpen(true)}
         lang={lang}
      />

      <CalculatorModal 
         isOpen={isCalcOpen} 
         onClose={() => setIsCalcOpen(false)} 
         lang={lang}
      />
      
      <EditProfileModal 
         isOpen={isProfileOpen}
         onClose={() => setIsProfileOpen(false)}
         onSave={async (p) => {
            setProfile(p);
            if (userEmail) await saveUserField(userEmail, 'profile', p);
         }}
         onLogout={() => {
            setUserEmail(null);
            supabase.auth.signOut();
         }}
         onDeleteAccount={async () => {
             if (confirm("Tem certeza que deseja excluir sua conta permanentemente?")) {
                 if (userEmail) {
                    await deleteItem(userEmail, 'users', userEmail); // Logic handled in supabase service
                    setUserEmail(null);
                 }
             }
         }}
         currentProfile={profile}
         lang={lang}
      />

      <NotepadModal 
         isOpen={isNotepadOpen}
         onClose={() => setIsNotepadOpen(false)}
         initialContent={notepadContent}
         initialDrawing={notepadDrawing}
         onSave={async (content, drawing) => {
            setNotepadContent(content);
            setNotepadDrawing(drawing);
            if (userEmail) {
                await saveUserField(userEmail, 'notepadContent', content);
                await saveUserField(userEmail, 'notepadDrawing', drawing);
            }
         }}
         lang={lang}
      />

      <CalendarModal 
         isOpen={isCalendarOpen}
         onClose={() => setIsCalendarOpen(false)}
         transactions={transactions}
         activeMonthContext={activeMonthContext}
         lang={lang}
      />

      <NotificationModal 
         isOpen={isNotifOpen}
         onClose={() => setIsNotifOpen(false)}
         notifications={notifications}
         onMarkAllRead={async () => {
            const updated = notifications.map(n => ({ ...n, read: true }));
            setNotifications(updated);
            if (userEmail) await saveCollection(userEmail, 'notifications', updated);
         }}
         onDelete={async (id) => {
            const updated = notifications.filter(n => n.id !== id);
            setNotifications(updated);
            if (userEmail) await deleteItem(userEmail, 'notifications', id);
         }}
         currentUserEmail={userEmail}
         lang={lang}
      />
      
      <ProModal 
         isOpen={isProModalOpen}
         onClose={() => setIsProModalOpen(false)}
         onUpgrade={async () => {
             setProfile(prev => ({ ...prev, isPro: true }));
             setIsProModalOpen(false);
             // Confetti or success message?
         }}
         userEmail={userEmail || ''}
         userName={profile.name}
         lang={lang}
      />
      
      <Suspense fallback={null}>
         {isAnalyticsOpen && (
             <AnalyticsModal 
               isOpen={isAnalyticsOpen}
               onClose={() => setIsAnalyticsOpen(false)}
               transactions={transactions}
               months={months}
               lang={lang}
             />
         )}
      </Suspense>

    </div>
  );
};

export default App;
