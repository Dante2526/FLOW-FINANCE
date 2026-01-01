
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, Check, RotateCcw } from 'lucide-react';
import { Transaction } from '../types';
import { TransactionIcon } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  activeMonthContext?: { monthIndex: number; year: number };
}

export const CalendarModal: React.FC<Props> = ({ isOpen, onClose, transactions = [], activeMonthContext }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Sync view with active month context when opening
  useEffect(() => {
    if (isOpen) {
      if (activeMonthContext) {
        // Set view to the 1st of the active month
        const newViewDate = new Date(activeMonthContext.year, activeMonthContext.monthIndex, 1);
        setViewDate(newViewDate);
        
        // If the active month is the current real month, select Today. Otherwise select the 1st.
        const now = new Date();
        if (now.getMonth() === activeMonthContext.monthIndex && now.getFullYear() === activeMonthContext.year) {
            setSelectedDate(now);
        } else {
            setSelectedDate(newViewDate);
        }
      } else {
        // Fallback to today
        const now = new Date();
        setViewDate(now);
        setSelectedDate(now);
      }
    }
  }, [isOpen, activeMonthContext]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(now);
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  
  const currentDay = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const isCurrentMonth = currentMonth === viewDate.getMonth() && currentYear === viewDate.getFullYear();

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  // Generate days array
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // --- Helper to parse transaction dates ROBUSTLY ---
  const parseTransactionDate = (dateStr: string, currentViewDate: Date): Date | null => {
    if (!dateStr) return null;
    const lower = dateStr.toLowerCase();
    const now = new Date();
    
    // Case 1: "Hoje ..."
    if (lower.includes('hoje')) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }

    // Case 2: ISO String "YYYY-MM-DD"
    // IMPORTANT: Parse parts manually to avoid Timezone offset issues (UTC vs Local)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = dateStr.split(' ')[0].split('-');
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        const d = parseInt(parts[2]);
        // Set time to noon to avoid daylight saving shifts
        return new Date(y, m, d, 12, 0, 0); 
    }

    // Case 3: "DD Mmm" (e.g. "24 Jan")
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
       const day = parseInt(parts[0]);
       const monthStr = parts[1].toLowerCase().slice(0, 3);
       
       const months: {[key: string]: number} = {
           'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
           'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
       };
       
       if (months[monthStr] !== undefined && !isNaN(day)) {
           const txMonthIndex = months[monthStr];
           let txYear = now.getFullYear();
           
           // Heuristic: If we are viewing a specific year in the modal, try to match it
           if (currentViewDate.getMonth() === txMonthIndex) {
              txYear = currentViewDate.getFullYear();
           }

           return new Date(txYear, txMonthIndex, day, 12, 0, 0);
       }
    }

    return null;
  };

  // --- DAY STATUS MAP ---
  const dayStatusMap = useMemo(() => {
      const map = new Map<number, { count: number; hasUnpaid: boolean; hasSubscription: boolean }>();
      const targetMonth = viewDate.getMonth();
      const targetYear = viewDate.getFullYear();

      transactions.forEach(t => {
          const d = parseTransactionDate(t.date, viewDate);
          if (!d) return;

          // Check if transaction belongs to the currently viewed month
          if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
              const day = d.getDate();
              
              const current = map.get(day) || { count: 0, hasUnpaid: false, hasSubscription: false };
              
              current.count += 1;
              if (!t.paid) current.hasUnpaid = true;
              if (t.type === 'subscription') current.hasSubscription = true;
              
              map.set(day, current);
          }
      });

      return map;
  }, [transactions, viewDate]);

  // Filter transactions for the list (Selected Day)
  const selectedDayTransactions = useMemo(() => {
      return transactions.filter(t => {
        const d = parseTransactionDate(t.date, viewDate);
        if (!d) return false;
        return d.getDate() === selectedDate.getDate() && 
                d.getMonth() === selectedDate.getMonth() && 
                d.getFullYear() === selectedDate.getFullYear();
      });
  }, [selectedDate, transactions, viewDate]);

  // Format the selected date for display header
  const headerDateStr = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/5 relative flex flex-col max-h-[90dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center border border-white/5">
                <CalendarIcon className="w-5 h-5 text-red-500" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-none">Calendário</h2>
                <p className="text-[10px] text-gray-400 mt-1">Agenda Financeira</p>
             </div>
          </div>
          
          <div className="flex gap-2">
            <button 
                onClick={handleGoToToday}
                className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Ir para Hoje"
            >
                <RotateCcw className="w-4 h-4 text-gray-400" />
            </button>
            <button 
                onClick={() => onClose()} 
                className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Area */}
        <div className="px-6 pb-4 shrink-0">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-4 bg-[#2c2c2e]/50 p-2 rounded-2xl">
                <button 
                    onClick={() => handlePrevMonth()}
                    className="p-2 hover:bg-white/10 rounded-xl active:scale-95 transition-transform"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <span className="text-sm font-bold text-white uppercase tracking-wider select-none">
                    {viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                    onClick={() => handleNextMonth()}
                    className="p-2 hover:bg-white/10 rounded-xl active:scale-95 transition-transform"
                >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-2 select-none">
                {/* Weekday Headers */}
                {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-gray-500 uppercase tracking-wide h-6 flex items-center justify-center">
                        {d}
                    </div>
                ))}
                
                {/* Days */}
                {days.map((day, i) => {
                    if (!day) return <div key={i} />;

                    const status = dayStatusMap.get(day);
                    const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth();
                    const isToday = isCurrentMonth && day === currentDay;

                    return (
                        <div key={i} className="flex justify-center flex-col items-center relative h-10">
                            <button 
                                onClick={() => handleDayClick(day)}
                                className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold transition-all relative z-10 ${
                                    isSelected 
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 scale-110 ring-2 ring-[#1c1c1e]' 
                                        : isToday 
                                            ? 'bg-white text-black border border-white'
                                            : 'text-gray-300 hover:bg-white/10'
                                }`}
                            >
                                {day}
                            </button>
                                
                            {/* Transaction Indicator Dots */}
                            {status && !isSelected && (
                                <div className="absolute -bottom-1 flex gap-0.5">
                                    {/* Red dot if unpaid, Green if all paid */}
                                    <div className={`w-1.5 h-1.5 rounded-full ring-2 ring-[#1c1c1e] ${
                                        status.hasUnpaid 
                                            ? (status.hasSubscription ? 'bg-purple-500' : 'bg-red-500') 
                                            : 'bg-green-500'
                                    }`} />
                                    {status.count > 1 && <div className="w-1.5 h-1.5 rounded-full bg-gray-600 ring-2 ring-[#1c1c1e]" />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Selected Day List */}
        <div className="mt-0 bg-[#2c2c2e]/30 rounded-t-[2.5rem] border-t border-white/5 px-6 pt-6 pb-6 flex flex-col flex-1 min-h-[100px] overflow-y-auto no-scrollbar">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 shrink-0">
                <span className="capitalize">{headerDateStr}</span>
                <span className="h-px flex-1 bg-white/10"></span>
            </h3>
            
            <div className="flex flex-col gap-2 pb-6">
                {selectedDayTransactions.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-6 opacity-40">
                         <AlertCircle className="w-8 h-8 text-gray-500 mb-2" />
                         <span className="text-xs text-gray-500 font-medium">Nada agendado para este dia.</span>
                     </div>
                ) : (
                    selectedDayTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#1c1c1e] border border-white/5 shadow-sm shrink-0">
                            {/* Icon Wrapper */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 scale-90">
                                <TransactionIcon type={tx.logoType} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${tx.paid ? 'text-gray-500 line-through decoration-gray-600' : 'text-white'}`}>
                                    {tx.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tx.type === 'subscription' ? 'bg-purple-500' : 'bg-cyan-500'}`} />
                                    <p className="text-[10px] text-gray-500 uppercase">{tx.type === 'subscription' ? 'Assinatura' : 'Compra'}</p>
                                </div>
                            </div>
                            
                            <div className="text-right flex flex-col items-end">
                                <span className={`text-sm font-bold block whitespace-nowrap ${tx.paid ? 'text-gray-500' : 'text-white'}`}>
                                    R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {tx.paid ? (
                                    <span className="text-[9px] text-green-500 font-bold flex items-center justify-end gap-1 mt-0.5 bg-green-500/10 px-1.5 py-0.5 rounded-md">
                                        <Check className="w-2.5 h-2.5" /> PAGO
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-red-400 font-bold flex items-center justify-end gap-1 mt-0.5 bg-red-500/10 px-1.5 py-0.5 rounded-md">
                                        PENDENTE
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

      </div>
    </div>
    </div>
  );
};
