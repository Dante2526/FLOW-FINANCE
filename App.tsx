
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
import { Contact, Transaction, Account, CardTheme, MonthSummary, AppView } from './types';
import { IconBell } from './components/Icons';
import { Crown } from 'lucide-react';
import { loginUser, registerUser, deleteUser, VAPID_PUBLIC_KEY } from './services/supabase';
import { useFinance } from './contexts/FinancialContext';
import { getMonthFromDateStr, getYearFromDateStr, MONTH_NAMES, MONTH_SHORT_CODES, parseDateToISO } from './utils/dateUtils';

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
  // --- CONTEXT CONSUMPTION (UPDATED) ---
  const {
    userProfile, setUserProfile,
    transactions, // Data Only
    addTransaction, updateTransaction, deleteTransaction, bulkCreateTransactions,
    accounts, // Data Only
    addAccount, updateAccount, deleteAccount, bulkCreateAccounts,
    months, // Data Only
    addMonth, updateMonth, deleteMonth,
    longTermTransactions, // Data Only
    addLongTerm, updateLongTerm, deleteLongTerm,
    investments, // Data Only
    addInvestment, updateInvestment, deleteInvestment,
    notepadContent, saveNotepad,
    notepadDrawing, 
    notifications, // Data Only
    addNotification, deleteNotification, markAllNotificationsRead,
    cdiRate, setCdiRate,
    dashboardOrder, setDashboardOrder,
    appTheme, setAppTheme,
    activeMonthId, setActiveMonthId,
    isLoadingData,
    currentUserEmail,
    isSessionReady,
    login,
    logout,
    migrateLegacyData, // EXPORTED FUNCTION
    wipeLegacyData // NEW FUNCTION
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

  // --- COMPUTED DATA (DYNAMIC) ---
  
  // 1. Recalculate Month Totals dynamically based on transactions
  // This fixes the "R$ 0" issue by ignoring potentially stale DB totals
  const monthsWithTotals = useMemo(() => {
    return months.map(m => {
      const monthTotal = transactions
        .filter(t => {
           const txMonth = t.month || getMonthFromDateStr(t.date);
           const txYear = t.year || getYearFromDateStr(t.date, m.year);
           return txMonth === m.month && txYear === m.year;
        })
        .reduce((acc, t) => acc + t.amount, 0);
      
      return { ...m, total: monthTotal };
    });
  }, [months, transactions]);

  // 2. Active Month Summary
  const activeMonthSummary = useMemo(() => 
    monthsWithTotals.find(m => m.id === activeMonthId) || monthsWithTotals[0]
  , [monthsWithTotals, activeMonthId]);
  
  // 3. Filtered Data for Current View
  const filteredTransactions = useMemo(() => {
    if (!activeMonthSummary) return [];
    
    // Filter
    const filtered = transactions.filter(tx => {
      const txMonth = tx.month || getMonthFromDateStr(tx.date);
      const txYear = tx.year || getYearFromDateStr(tx.date, activeMonthSummary.year);
      return txMonth === activeMonthSummary.month && txYear === activeMonthSummary.year;
    });

    // Sort to prevent jumping: Date Ascending -> Name Ascending
    return filtered.sort((a, b) => {
        const yearInt = parseInt(activeMonthSummary.year);
        // Uses dateUtils helper to get comparable ISO strings (YYYY-MM-DD)
        const dateA = parseDateToISO(a.date, yearInt);
        const dateB = parseDateToISO(b.date, yearInt);
        
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.name.localeCompare(b.name);
    });
  }, [transactions, activeMonthSummary]);

  const filteredAccounts = useMemo(() => {
    if (!activeMonthSummary) return [];
    return accounts.filter(acc => {
      if (!acc.month && !acc.year) return true;
      return acc.month === activeMonthSummary.month && acc.year === activeMonthSummary.year;
    });
  }, [accounts, activeMonthSummary]);

  // 4. Dashboard Items Ordering
  const dashboardItems = useMemo(() => {
    const visibleAccountIds = new Set(filteredAccounts.map(a => a.id));
    const allAvailableIds = new Set([BALANCE_CARD_ID, ...filteredAccounts.map(a => a.id)]);
    
    const orderedList = dashboardOrder.filter(id => allAvailableIds.has(id));
    const savedSet = new Set(dashboardOrder);
    const orphans = [BALANCE_CARD_ID, ...filteredAccounts.map(a => a.id)].filter(id => !savedSet.has(id));
    
    return [...orderedList, ...orphans];
  }, [filteredAccounts, dashboardOrder]);

  // 5. Profit Balance Calculation (Original Logic)
  // Total de Contas (Receita/Reserva) - Total de Gastos (Independente se foi pago ou não)
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

  // --- HANDLERS (MEMOIZED & UPDATED FOR REACT QUERY) ---

  const handleLogin = useCallback(async (email: string, name?: string) => {
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
      
      login(email);

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
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsProfileModalOpen(false);
  }, [logout]);

  const handleDeleteUserAccount = useCallback(async () => {
    if (!currentUserEmail) return;
    if (window.confirm("ATENÇÃO: Você está prestes a excluir sua conta permanentemente.\n\nEsta ação é irreversível.")) {
       try {
          await deleteUser(currentUserEmail);
          await logout();
          setIsProfileModalOpen(false);
          alert("Conta excluída com sucesso.");
       } catch (error: any) {
          alert("Falha ao excluir conta: " + error.message);
       }
    }
  }, [currentUserEmail, logout]);

  const handleCardDragStart = useCallback((id: string) => { dragItem.current = id; }, []);
  const handleCardDragEnd = useCallback(() => { dragItem.current = null; }, []);
  const handleCardDragEnter = useCallback((targetId: string) => {
    if (dragItem.current && dragItem.current !== targetId) {
       const draggedId = dragItem.current;
       
       setDashboardOrder((prevOrder: string[]) => {
          const newOrder = [...prevOrder];
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
  }, [setDashboardOrder]);

  const handleDuplicateMonth = useCallback(() => {
    if (!activeMonthSummary) return;
    const currentSummary = activeMonthSummary;

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

    // Read current data needed for logic
    if (months.find(m => m.month === nextMonthName && m.year === nextYearInt.toString())) {
        alert(`O mês de ${nextMonthName} de ${nextYearInt} já existe!`);
        return;
    }

    // Prepare New Data
    const txToCopy = transactions.filter(tx => {
        const txMonth = tx.month || getMonthFromDateStr(tx.date);
        const txYear = tx.year || getYearFromDateStr(tx.date, currentSummary.year);
        return txMonth === currentSummary.month && txYear === currentSummary.year;
    });

    const newTxs = txToCopy.map(tx => {
        let newDateStr = '';
        if (tx.date.match(/^\d{4}-\d{2}-\d{2}/)) {
            const d = new Date(tx.date.split(' ')[0] + 'T00:00:00');
            d.setMonth(d.getMonth() + 1); 
            newDateStr = d.toISOString().split('T')[0];
        } else {
            newDateStr = `01 ${nextShortCode}`;
        }
        // Removing ID to let DB generate one
        const { id, ...rest } = tx;
        return {
            ...rest,
            date: newDateStr, paid: false,
            month: nextMonthName, year: nextYearInt.toString()
        };
    });

    const accToCopy = accounts.filter(acc => {
        if (!acc.month && !acc.year) return true;
        return acc.month === currentSummary.month && acc.year === currentSummary.year;
    });

    const newAccounts = accToCopy.map(acc => {
        const { id, ...rest } = acc;
        return {
           ...rest,
           month: nextMonthName, year: nextYearInt.toString()
        };
    });

    // Execute Mutations
    bulkCreateTransactions(newTxs);
    bulkCreateAccounts(newAccounts);
    
    // Create new Month
    // Note: We set total to 0 here because it will be dynamically calculated
    let newMonthId;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      newMonthId = crypto.randomUUID();
    } else {
      newMonthId = `m-${Date.now()}`;
    }

    addMonth({
        id: newMonthId,
        month: nextMonthName,
        year: nextYearInt.toString(),
        total: 0 // Will be calculated dynamically
    });
    
    // Immediate Switch (Stable ID makes this safe)
    setActiveMonthId(newMonthId);

  }, [activeMonthSummary, months, transactions, accounts, bulkCreateTransactions, bulkCreateAccounts, addMonth, setActiveMonthId]);

  const handleSaveTransaction = useCallback((txData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      updateTransaction({ ...txData, id: editingTransaction.id });
      setEditingTransaction(null);
    } else {
      const newTx = {
        ...txData,
        month: activeMonthSummary.month,
        year: activeMonthSummary.year
      };
      addTransaction(newTx);
    }
    // We removed manual month total updates because we now use dynamic calculation
  }, [editingTransaction, activeMonthSummary, updateTransaction, addTransaction]);

  const handleDeleteTransaction = useCallback((id: string) => {
    deleteTransaction(id);
  }, [deleteTransaction]);

  const handleDeleteMonth = useCallback((id: string) => {
    deleteMonth(id);
    // Fallback switch if active was deleted
    if (activeMonthId === id) {
       const remaining = months.filter(m => m.id !== id);
       if (remaining.length > 0) {
           setActiveMonthId(remaining[remaining.length - 1].id);
       }
    }
  }, [deleteMonth, months, setActiveMonthId, activeMonthId]);

  const handleProUpgrade = useCallback(() => {
    const amount = 7.00;
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + 30); 
    
    const newTx = {
        name: 'Assinatura PRO', amount, type: 'subscription', logoType: 'generic', 
        paymentMethod: 'pix', paid: true, date: now.toISOString().split('T')[0],
        month: activeMonthSummary.month, year: activeMonthSummary.year
    };
    
    addTransaction(newTx);
    setUserProfile((prev: any) => ({ ...prev, isPro: true, subscriptionExpiry: expiryDate.toISOString() }));
    setIsProModalOpen(false);
  }, [activeMonthSummary, addTransaction, setUserProfile]);

  const handleSaveAccount = useCallback((id: string | undefined, name: string, balance: number, theme: CardTheme) => {
    if (id) {
      updateAccount({ id, name, balance, colorTheme: theme });
      setEditingAccount(null);
    } else {
      // Create new account
      addAccount({ 
          name, balance, colorTheme: theme, 
          month: activeMonthSummary.month, year: activeMonthSummary.year 
      });
      // Order update handled implicitly
    }
  }, [activeMonthSummary, updateAccount, addAccount]);

  const handleToggleStatus = useCallback((id: string) => {
      const tx = transactions.find(t => t.id === id);
      if (tx) updateTransaction({ id, paid: !tx.paid });
  }, [transactions, updateTransaction]);

  const handleTogglePaymentMethod = useCallback((id: string) => {
      const tx = transactions.find(t => t.id === id);
      if (tx) updateTransaction({ id, paymentMethod: tx.paymentMethod === 'pix' ? 'card' : 'pix' });
  }, [transactions, updateTransaction]);

  const handleEditTransactionClick = useCallback((tx: Transaction) => {
      setEditingTransaction(tx);
      setIsAddTransactionOpen(true);
  }, []);
  
  const handleEditAccountClick = useCallback((acc: Account) => {
      setEditingAccount(acc);
      setIsAddAccountOpen(true);
  }, []);

  const handleDeleteAccount = useCallback((id: string) => {
      deleteAccount(id);
  }, [deleteAccount]);

  const handleContactClick = useCallback((c: Contact) => {
      if (c.id === '1') setIsNotepadOpen(true);
      if (c.id === '2') setIsCalendarOpen(true);
      if (c.id === '3') { 
          if (!userProfile.isPro) setIsProModalOpen(true); else setIsAnalyticsOpen(true); 
      }
  }, [userProfile.isPro]);

  // UI Modal Setters Wrappers
  const openAddTransaction = useCallback(() => setIsAddTransactionOpen(true), []);
  const openCalculator = useCallback(() => setIsCalculatorOpen(true), []);
  const openAddAccount = useCallback(() => setIsAddAccountOpen(true), []);
  const openProfile = useCallback(() => setIsProfileModalOpen(true), []);
  const openNotifications = useCallback(() => setIsNotificationOpen(true), []);
  const openProModal = useCallback(() => setIsProModalOpen(true), []);
  
  const closeAddTransaction = useCallback(() => { setIsAddTransactionOpen(false); setEditingTransaction(null); }, []);
  const closeAddAccount = useCallback(() => { setIsAddAccountOpen(false); setEditingAccount(null); }, []);
  const closeCalculator = useCallback(() => setIsCalculatorOpen(false), []);
  const closeProfile = useCallback(() => setIsProfileModalOpen(false), []);
  const closeNotepad = useCallback(() => setIsNotepadOpen(false), []);
  const closeCalendar = useCallback(() => setIsCalendarOpen(false), []);
  const closeNotification = useCallback(() => setIsNotificationOpen(false), []);
  const closeAnalytics = useCallback(() => setIsAnalyticsOpen(false), []);
  const closeProModal = useCallback(() => setIsProModalOpen(false), []);
  
  const handleNotepadSave = useCallback((c: string, d: string | null) => {
      saveNotepad(c, d);
  }, [saveNotepad]);

  const handleMarkAllRead = useCallback(() => {
      markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const handleDeleteNotification = useCallback((id: string) => {
      deleteNotification(id);
  }, [deleteNotification]);

  const handleSaveTheme = useCallback((theme: any) => {
      setAppTheme(theme);
      setCurrentView('home');
  }, [setAppTheme]);

  // Long Term Callbacks
  const handleLongTermAdd = useCallback((item: any) => {
      addLongTerm({ ...item, installmentsPaid: 0 });
  }, [addLongTerm]);

  const handleLongTermEdit = useCallback((item: any) => {
      updateLongTerm(item);
  }, [updateLongTerm]);

  const handleLongTermDelete = useCallback((id: string) => {
      deleteLongTerm(id);
  }, [deleteLongTerm]);

  // Investments Callbacks
  const handleInvestmentAdd = useCallback((inv: any) => {
      addInvestment(inv);
  }, [addInvestment]);

  const handleInvestmentEdit = useCallback((inv: any) => {
      updateInvestment(inv);
  }, [updateInvestment]);

  const handleInvestmentDelete = useCallback((id: string) => {
      deleteInvestment(id);
  }, [deleteInvestment]);

  const handleBackToHome = useCallback(() => setCurrentView('home'), []);


  // --- RENDER ---
  const shouldShowSplash = !isSessionReady || (currentUserEmail && isLoadingData && !userProfile.name);
  if (shouldShowSplash) return <SplashScreen />;
  if (!currentUserEmail) return <LoginScreen onLogin={handleLogin} />;
  
  const isAnyModalOpen = isAddTransactionOpen || isAddAccountOpen || isCalculatorOpen || isProfileModalOpen || isNotepadOpen || isCalendarOpen || isNotificationOpen || isAnalyticsOpen || isProModalOpen;

  return (
    <div className={`h-full overflow-y-auto bg-[#0a0a0b] text-white px-2 pt-4 pb-32 font-sans selection:bg-accent selection:text-black no-scrollbar ${isAnyModalOpen ? 'overflow-hidden' : ''}`} style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      
      {currentView === 'settings' && (
          <SettingsView 
            currentThemeId={appTheme.id}
            onSaveTheme={handleSaveTheme}
            isPro={!!userProfile.isPro}
            onOpenProModal={openProModal}
            onMigrateData={migrateLegacyData} // Pass the migration function here
            onWipeData={wipeLegacyData} // NEW: Pass wipe function
          />
      )}
      
      {currentView === 'long-term' && (
          <LongTermView 
            items={longTermTransactions}
            onAdd={handleLongTermAdd}
            onEdit={handleLongTermEdit}
            onDelete={handleLongTermDelete}
          />
      )}
      
      {currentView === 'investments' && (
          <InvestmentsView 
             investments={investments}
             onAdd={handleInvestmentAdd}
             onEdit={handleInvestmentEdit}
             onDelete={handleInvestmentDelete}
             onBack={handleBackToHome}
             cdiRate={cdiRate}
             onUpdateCdiRate={setCdiRate}
             isPro={!!userProfile.isPro}
             onOpenProModal={openProModal}
          />
      )}

      {currentView === 'home' && (
          <>
            <div className="flex justify-between items-center mb-6 pl-1">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={openProfile}>
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
                 <IconBell count={notifications.filter(n => !n.read).length} onClick={openNotifications} />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
               {dashboardItems.map((id) => {
                  if (id === BALANCE_CARD_ID) {
                     return (
                        <BalanceCard 
                            key={id} 
                            id={id} 
                            balance={profitBalance} 
                            onAddClick={openAddTransaction} 
                            onDuplicateClick={handleDuplicateMonth} 
                            onCalculatorClick={openCalculator} 
                            draggable 
                            onDragStart={handleCardDragStart} 
                            onDragEnter={handleCardDragEnter} 
                            onDragEnd={handleCardDragEnd} 
                        />
                     );
                  }
                  const account = filteredAccounts.find(a => a.id === id);
                  if (account) {
                     return (
                        <SecondaryCard 
                            key={account.id} 
                            account={account} 
                            onDelete={handleDeleteAccount} 
                            onEdit={handleEditAccountClick} 
                            draggable 
                            onDragStart={handleCardDragStart} 
                            onDragEnter={handleCardDragEnter} 
                            onDragEnd={handleCardDragEnd} 
                        />
                     );
                  }
                  return null;
               })}
            </div>

            <ContactsRow 
               contacts={MOCK_CONTACTS} 
               onAddClick={openAddAccount}
               onContactClick={handleContactClick}
               isPro={!!userProfile.isPro}
            />

            <TransactionSummary 
                months={monthsWithTotals} 
                activeMonthId={activeMonthId} 
                onSelectMonth={setActiveMonthId} 
                onDeleteMonth={handleDeleteMonth} 
            />
            <TransactionList 
              transactions={filteredTransactions} 
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransactionClick}
              onToggleStatus={handleToggleStatus}
              onTogglePaymentMethod={handleTogglePaymentMethod}
            />
          </>
      )}

      <BottomNav currentView={currentView} onChangeView={setCurrentView} />

      <AddTransactionModal isOpen={isAddTransactionOpen} onClose={closeAddTransaction} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} activeMonthContext={activeMonthContext} />
      <AddAccountModal isOpen={isAddAccountOpen} onClose={closeAddAccount} onSave={handleSaveAccount} accountToEdit={editingAccount} isPro={!!userProfile.isPro} onOpenProModal={openProModal} />
      <CalculatorModal isOpen={isCalculatorOpen} onClose={closeCalculator} />
      <EditProfileModal isOpen={isProfileModalOpen} onClose={closeProfile} onSave={setUserProfile} onLogout={handleLogout} onDeleteAccount={handleDeleteUserAccount} currentProfile={userProfile} />
      <NotepadModal isOpen={isNotepadOpen} onClose={closeNotepad} initialContent={notepadContent} initialDrawing={notepadDrawing} onSave={handleNotepadSave} />
      <CalendarModal isOpen={isCalendarOpen} onClose={closeCalendar} transactions={transactions} activeMonthContext={activeMonthContext} />
      <NotificationModal isOpen={isNotificationOpen} onClose={closeNotification} notifications={notifications} onMarkAllRead={handleMarkAllRead} onDelete={handleDeleteNotification} currentUserEmail={currentUserEmail} />
      <Suspense fallback={null}>
        {isAnalyticsOpen && <AnalyticsModal isOpen={isAnalyticsOpen} onClose={closeAnalytics} transactions={transactions} months={monthsWithTotals} />}
      </Suspense>
      <ProModal isOpen={isProModalOpen} onClose={closeProModal} onUpgrade={handleProUpgrade} />
    </div>
  );
};

export default App;
