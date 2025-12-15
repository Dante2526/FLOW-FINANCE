
import React, { useState, useMemo, Suspense, useCallback, useRef } from 'react';
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
import SettingsView from './components/SettingsView';
import LongTermView from './components/LongTermView';
import InvestmentsView from './components/InvestmentsView';
import LoginScreen, { FlowLogo } from './components/LoginScreen';
import ProModal from './components/ProModal'; 
import { Contact, Transaction, Account, CardTheme, MonthSummary, UserProfile, AppView } from './types';
import { IconBell } from './components/Icons';
import { Crown } from 'lucide-react';
import { loginUser, registerUser, deleteUser, VAPID_PUBLIC_KEY } from './services/supabase';
import { useFinance } from './contexts/FinancialContext';
import { getMonthFromDateStr, getYearFromDateStr, sortMonths, MONTH_NAMES, MONTH_SHORT_CODES } from './utils/dateUtils';

// Lazy Load Heavy Components
const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal'));

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

const SYSTEM_INITIAL_MONTH: MonthSummary = {
  id: '1',
  month: MONTH_NAMES[new Date().getMonth()],
  year: new Date().getFullYear().toString(),
  total: 0
};

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Notas', imageUrl: '' }, 
  { id: '2', name: 'Calendário', imageUrl: '' }, 
  { id: '3', name: 'Análise', imageUrl: '' }, 
];

const BALANCE_CARD_ID = 'balance-card';

const SplashScreen = () => (
  <div className="fixed inset-0 bg-[#0a0a0b] flex items-center justify-center z-[100] animate-out fade-out duration-700">
    <div className="w-32 h-32 bg-[#1c1c1e] rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-black/20">
       <FlowLogo className="w-24 h-24 text-accent" />
    </div>
  </div>
);

const App: React.FC = () => {
  // --- CONTEXT CONSUMPTION ---
  const {
    userProfile, setUserProfile,
    transactions, setTransactions,
    accounts, setAccounts,
    months, setMonths,
    longTermTransactions, setLongTermTransactions,
    investments, setInvestments,
    notepadContent, setNotepadContent,
    notepadDrawing, setNotepadDrawing,
    notifications, setNotifications,
    cdiRate, setCdiRate,
    dashboardOrder, setDashboardOrder,
    appTheme, setAppTheme,
    activeMonthId, setActiveMonthId,
    isLoadingData,
    currentUserEmail,
    isSessionReady,
    login,
    logout
  } = useFinance();

  // --- VIEW & MODAL STATE ---
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
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- DRAG AND DROP REFS ---
  const dragItem = useRef<string | null>(null);

  // --- COMPUTED DATA ---
  const activeMonthSummary = useMemo(() => months.find(m => m.id === activeMonthId) || months[0], [months, activeMonthId]);
  
  const filteredTransactions = useMemo(() => {
    if (!activeMonthSummary) return [];
    return transactions.filter(tx => {
      const txMonth = tx.month || getMonthFromDateStr(tx.date);
      const txYear = tx.year || getYearFromDateStr(tx.date, activeMonthSummary.year);
      return txMonth === activeMonthSummary.month && txYear === activeMonthSummary.year;
    });
  }, [transactions, activeMonthSummary]);

  const filteredAccounts = useMemo(() => {
    if (!activeMonthSummary) return [];
    return accounts.filter(acc => {
      if (!acc.month && !acc.year) return true;
      return acc.month === activeMonthSummary.month && acc.year === activeMonthSummary.year;
    });
  }, [accounts, activeMonthSummary]);

  const dashboardItems = useMemo(() => {
    // 1. Identify all IDs that SHOULD be visible
    const visibleAccountIds = new Set(filteredAccounts.map(a => a.id));
    const allAvailableIds = new Set([BALANCE_CARD_ID, ...filteredAccounts.map(a => a.id)]);
    
    // 2. Filter the saved order to include only valid/visible IDs
    const orderedList = dashboardOrder.filter(id => allAvailableIds.has(id));
    
    // 3. Find "Orphans" (new accounts not yet in the saved order)
    const savedSet = new Set(dashboardOrder);
    const orphans = [BALANCE_CARD_ID, ...filteredAccounts.map(a => a.id)].filter(id => !savedSet.has(id));
    
    // 4. Combine: Ordered items first, then new items appended at the end
    return [...orderedList, ...orphans];
  }, [filteredAccounts, dashboardOrder]);

  const profitBalance = useMemo(() => {
    const totalAccounts = filteredAccounts.reduce((acc, account) => acc + account.balance, 0);
    const totalExpenses = filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    return totalAccounts - totalExpenses;
  }, [filteredAccounts, filteredTransactions]);

  const activeMonthContext = useMemo(() => {
     if (!activeMonthSummary) return undefined;
     return {
       monthIndex: MONTH_NAMES.indexOf(activeMonthSummary.month),
       year: parseInt(activeMonthSummary.year)
     };
  }, [activeMonthSummary]);

  // --- HANDLERS ---

  const handleLogin = async (email: string, name?: string) => {
    try {
      let permissionGranted = false;
      if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          permissionGranted = permission === 'granted';
      } else if ('Notification' in window && Notification.permission === 'granted') {
          permissionGranted = true;
      }

      if (name) {
        await registerUser(email, name, { months: [SYSTEM_INITIAL_MONTH], cdiRate: 11.25 });
      } else {
        await loginUser(email);
      }
      
      login(email); // Update Context

      if (permissionGranted && 'serviceWorker' in navigator) {
         navigator.serviceWorker.ready.then(async (registration) => {
             let subscription = await registration.pushManager.getSubscription();
             if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
             }
         }).catch(console.error);
      }
    } catch (error) {
       console.error("Login failed:", error);
       throw error; 
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileModalOpen(false);
  };

  const handleDeleteUserAccount = async () => {
    if (!currentUserEmail) return;
    if (window.confirm("ATENÇÃO: Você está prestes a excluir sua conta permanentemente.\n\nEsta ação é irreversível.")) {
       try {
          await deleteUser(currentUserEmail);
          await handleLogout();
          alert("Conta excluída com sucesso.");
       } catch (error: any) {
          alert("Falha ao excluir conta: " + error.message);
       }
    }
  };

  const handleCardDragStart = useCallback((id: string) => { dragItem.current = id; }, []);
  const handleCardDragEnd = useCallback(() => { dragItem.current = null; }, []);
  const handleCardDragEnter = useCallback((targetId: string) => {
    if (dragItem.current && dragItem.current !== targetId) {
       const draggedId = dragItem.current;
       
       setDashboardOrder(prevOrder => {
          // Work with the full persisted list, not just visible items
          const newOrder = [...prevOrder];
          
          // Ensure both items are in the list (handle orphans being dragged for the first time)
          if (!newOrder.includes(draggedId)) newOrder.push(draggedId);
          if (!newOrder.includes(targetId)) newOrder.push(targetId);

          const draggedIndex = newOrder.indexOf(draggedId);
          const targetIndex = newOrder.indexOf(targetId);

          if (draggedIndex !== -1 && targetIndex !== -1) {
             newOrder.splice(draggedIndex, 1);
             newOrder.splice(targetIndex, 0, draggedId);
          }
          return newOrder;
       });
    }
  }, []);

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

    if (months.find(m => m.month === nextMonthName && m.year === nextYearInt.toString())) {
      alert(`O mês de ${nextMonthName} de ${nextYearInt} já existe!`);
      return;
    }

    const newTxs: Transaction[] = filteredTransactions.map(tx => {
       let newDateStr = '';
       if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
           const d = new Date(tx.date.split(' ')[0] + 'T00:00:00');
           d.setMonth(d.getMonth() + 1); 
           newDateStr = d.toISOString().split('T')[0];
       } else {
           newDateStr = `01 ${nextShortCode}`;
       }
       return {
         ...tx, id: Date.now().toString() + Math.random(),
         date: newDateStr, paid: false,
         month: nextMonthName, year: nextYearInt.toString()
       };
    });

    const newAccounts: Account[] = filteredAccounts.map(acc => ({
       ...acc, id: Date.now().toString() + Math.random(),
       month: nextMonthName, year: nextYearInt.toString()
    }));

    const newMonthSummary: MonthSummary = {
      id: Date.now().toString(),
      month: nextMonthName,
      year: nextYearInt.toString(),
      total: newTxs.reduce((acc, t) => acc + t.amount, 0)
    };

    setMonths(sortMonths([...months, newMonthSummary]));
    setTransactions(prev => [...newTxs, ...prev]); 
    setAccounts(prev => [...prev, ...newAccounts]);
    setActiveMonthId(newMonthSummary.id);
    
    // Auto-append new accounts to dashboard order
    setDashboardOrder(prev => [...prev, ...newAccounts.map(a => a.id)]);
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, ...txData } : t));
      const oldMonth = editingTransaction.month || getMonthFromDateStr(editingTransaction.date);
      const oldYear = editingTransaction.year || getYearFromDateStr(editingTransaction.date, activeMonthSummary.year);
      setMonths(prev => prev.map(m => {
          if (m.month === oldMonth && m.year === oldYear) return { ...m, total: m.total - editingTransaction.amount + txData.amount };
          return m;
      }));
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
        if (m.month === activeMonthSummary.month && m.year === activeMonthSummary.year) return { ...m, total: m.total + newTx.amount };
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
        if (m.month === txMonth && m.year === txYear) return { ...m, total: m.total - tx.amount };
        return m;
      }));
    }
  };

  const handleDeleteMonth = (id: string) => {
    if (months.length <= 1) return;
    const monthToDelete = months.find(m => m.id === id);
    if (!monthToDelete) return;
    setTransactions(prev => prev.filter(tx => !(tx.month === monthToDelete.month && tx.year === monthToDelete.year)));
    setAccounts(prev => prev.filter(acc => !(acc.month === monthToDelete.month && acc.year === monthToDelete.year)));
    const newMonths = months.filter(m => m.id !== id);
    setMonths(newMonths);
    setActiveMonthId(newMonths[newMonths.length - 1].id);
  };

  const handleProUpgrade = () => {
    const amount = 7.00;
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + 30); 
    const newTx: Transaction = {
        id: Date.now().toString(),
        name: 'Assinatura PRO', amount, type: 'subscription', logoType: 'generic', 
        paymentMethod: 'pix', paid: true, date: now.toISOString().split('T')[0],
        month: activeMonthSummary.month, year: activeMonthSummary.year
    };
    setTransactions(prev => [newTx, ...prev]);
    setMonths(prev => prev.map(m => {
        if (m.month === activeMonthSummary.month && m.year === activeMonthSummary.year) return { ...m, total: m.total + amount };
        return m;
    }));
    setUserProfile({ ...userProfile, isPro: true, subscriptionExpiry: expiryDate.toISOString() });
    setIsProModalOpen(false);
  };

  const handleSaveAccount = (id: string | undefined, name: string, balance: number, theme: CardTheme) => {
    if (id) {
      setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, name, balance, colorTheme: theme } : acc));
      setEditingAccount(null);
    } else {
      const newId = Date.now().toString();
      const newAccount: Account = { id: newId, name, balance, colorTheme: theme, month: activeMonthSummary.month, year: activeMonthSummary.year };
      setAccounts(prev => [...prev, newAccount]);
      setDashboardOrder(prev => [...prev, newId]);
    }
  };

  // --- RENDER ---
  const shouldShowSplash = !isSessionReady || (currentUserEmail && isLoadingData && !userProfile.name);
  if (shouldShowSplash) return <SplashScreen />;
  if (!currentUserEmail) return <LoginScreen onLogin={handleLogin} />;
  
  if (isLoadingData && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium animate-pulse">Sincronizando dados...</p>
      </div>
    );
  }

  const isAnyModalOpen = isAddTransactionOpen || isAddAccountOpen || isCalculatorOpen || isProfileModalOpen || isNotepadOpen || isCalendarOpen || isNotificationOpen || isAnalyticsOpen || isProModalOpen;

  return (
    <div className={`h-full overflow-y-auto bg-[#0a0a0b] text-white px-2 pt-4 pb-32 font-sans selection:bg-accent selection:text-black no-scrollbar ${isAnyModalOpen ? 'overflow-hidden' : ''}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      
      {currentView === 'settings' && (
          <SettingsView 
            currentThemeId={appTheme.id}
            onSaveTheme={(theme) => { setAppTheme(theme); setCurrentView('home'); }}
            isPro={!!userProfile.isPro}
            onOpenProModal={() => setIsProModalOpen(true)}
          />
      )}
      
      {currentView === 'long-term' && (
          <LongTermView 
            items={longTermTransactions}
            onAdd={(item) => setLongTermTransactions(prev => [...prev, { ...item, id: Date.now().toString(), installmentsPaid: 0 }])}
            onEdit={(item) => setLongTermTransactions(prev => prev.map(i => i.id === item.id ? item : i))}
            onDelete={(id) => setLongTermTransactions(prev => prev.filter(i => i.id !== id))}
          />
      )}
      
      {currentView === 'investments' && (
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
      )}

      {currentView === 'home' && (
          <>
            <div className="flex justify-between items-center mb-6 pl-1">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
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
                 <IconBell count={notifications.filter(n => !n.read).length} onClick={() => setIsNotificationOpen(true)} />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
               {dashboardItems.map((id) => {
                  if (id === BALANCE_CARD_ID) {
                     return (
                        <BalanceCard key={id} id={id} balance={profitBalance} onAddClick={() => setIsAddTransactionOpen(true)} onDuplicateClick={handleDuplicateMonth} onCalculatorClick={() => setIsCalculatorOpen(true)} draggable onDragStart={handleCardDragStart} onDragEnter={handleCardDragEnter} onDragEnd={handleCardDragEnd} />
                     );
                  }
                  const account = filteredAccounts.find(a => a.id === id);
                  if (account) {
                     return (
                        <SecondaryCard key={account.id} account={account} onDelete={(id) => setAccounts(prev => prev.filter(a => a.id !== id))} onEdit={(acc) => { setEditingAccount(acc); setIsAddAccountOpen(true); }} draggable onDragStart={handleCardDragStart} onDragEnter={handleCardDragEnter} onDragEnd={handleCardDragEnd} />
                     );
                  }
                  return null;
               })}
            </div>

            <ContactsRow 
               contacts={MOCK_CONTACTS} 
               onAddClick={() => setIsAddAccountOpen(true)}
               onContactClick={(c) => {
                  if (c.id === '1') setIsNotepadOpen(true);
                  if (c.id === '2') setIsCalendarOpen(true);
                  if (c.id === '3') { if (!userProfile.isPro) setIsProModalOpen(true); else setIsAnalyticsOpen(true); }
               }}
               isPro={!!userProfile.isPro}
            />

            <TransactionSummary months={months} activeMonthId={activeMonthId} onSelectMonth={setActiveMonthId} onDeleteMonth={handleDeleteMonth} />
            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction}
              onEdit={(tx) => { setEditingTransaction(tx); setIsAddTransactionOpen(true); }}
              onToggleStatus={(id) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, paid: !t.paid } : t))}
              onTogglePaymentMethod={(id) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, paymentMethod: t.paymentMethod === 'pix' ? 'card' : 'pix' } : t))}
            />
          </>
      )}

      <BottomNav currentView={currentView} onChangeView={setCurrentView} />

      <AddTransactionModal isOpen={isAddTransactionOpen} onClose={() => { setIsAddTransactionOpen(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} activeMonthContext={activeMonthContext} />
      <AddAccountModal isOpen={isAddAccountOpen} onClose={() => { setIsAddAccountOpen(false); setEditingAccount(null); }} onSave={handleSaveAccount} accountToEdit={editingAccount} isPro={!!userProfile.isPro} onOpenProModal={() => setIsProModalOpen(true)} />
      <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
      <EditProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={setUserProfile} onLogout={handleLogout} onDeleteAccount={handleDeleteUserAccount} currentProfile={userProfile} />
      <NotepadModal isOpen={isNotepadOpen} onClose={() => setIsNotepadOpen(false)} initialContent={notepadContent} initialDrawing={notepadDrawing} onSave={(c, d) => { setNotepadContent(c); setNotepadDrawing(d); }} />
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} transactions={transactions} activeMonthContext={activeMonthContext} />
      <NotificationModal isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} notifications={notifications} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} onDelete={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} currentUserEmail={currentUserEmail} />
      <Suspense fallback={null}>
        {isAnalyticsOpen && <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} transactions={transactions} months={months} />}
      </Suspense>
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} onUpgrade={handleProUpgrade} />
    </div>
  );
};

export default App;
