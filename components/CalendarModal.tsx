
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, Check } from 'lucide-react';
import { Transaction, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  activeMonthContext?: { monthIndex: number; year: number };
  lang: AppLanguage;
}

export const CalendarModal: React.FC<Props> = ({ isOpen, onClose, transactions = [], activeMonthContext, lang }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (isOpen) {
      if (activeMonthContext) {
        const newViewDate = new Date(activeMonthContext.year, activeMonthContext.monthIndex, 1);
        setViewDate(newViewDate);
        setSelectedDate(newViewDate);
      } else {
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

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const weekDays = lang === 'pt' 
    ? ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    : lang === 'es'
        ? ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
        : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const currentDay = new Date().getDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const isCurrentMonth = currentMonth === viewDate.getMonth() && currentYear === viewDate.getFullYear();

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const parseTransactionDate = (dateStr: string, currentViewDate: Date): Date | null => {
    if (!dateStr) return null;
    const lower = dateStr.toLowerCase();
    const now = new Date();
    
    if (lower.includes('hoje')) {
      return now;
    }

    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(dateStr.split(' ')[0] + 'T00:00:00'); 
    }

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
           if (currentViewDate.getMonth() === txMonthIndex) {
              txYear = currentViewDate.getFullYear();
           }
           return new Date(txYear, txMonthIndex, day);
       }
    }
    return null;
  };

  const dayStatusMap = useMemo(() => {
      const map = new Map<number, { count: number; hasUnpaid: boolean; hasSubscription: boolean }>();
      const targetMonth = viewDate.getMonth();
      const targetYear = viewDate.getFullYear();

      transactions.forEach(t => {
          const d = parseTransactionDate(t.date, viewDate);
          if (!d) return;

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

  const selectedDayTransactions = useMemo(() => {
      return transactions.filter(t => {
        const d = parseTransactionDate(t.date, viewDate);
        if (!d) return false;
        return d.getDate() === selectedDate.getDate() && 
                d.getMonth() === selectedDate.getMonth() && 
                d.getFullYear() === selectedDate.getFullYear();
      });
  }, [selectedDate, transactions, viewDate]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/5 relative flex flex-col max-h-[90dvh] overflow-hidden">
        
        <div className="flex justify-between items-center p-7 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center border border-white/5">
                <CalendarIcon className="w-5 h-5 text-red-500" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-none">{t.calendar.title}</h2>
                <p className="text-[10px] text-gray-400 mt-1">{t.calendar.subtitle}</p>
             </div>
          </div>
          
          <button onClick={() => onClose()} className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 pb-6 shrink-0">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => handlePrevMonth()} className="p-2 hover:bg-white/5 rounded-full active:scale-95 transition-transform">
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <span className="text-base font-bold text-white uppercase tracking-wider select-none">
                    {viewDate.toLocaleString(lang === 'pt' ? 'pt-BR' : (lang === 'es' ? 'es-ES' : 'en-US'), { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => handleNextMonth()} className="p-2 hover:bg-white/5 rounded-full active:scale-95 transition-transform">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-y-3 gap-x-1 mb-4 select-none">
                {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-gray-500 uppercase tracking-wide">
                        {d}
                    </div>
                ))}
                
                {days.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const status = dayStatusMap.get(day);
                    const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth();
                    const isToday = isCurrentMonth && day === currentDay;

                    return (
                        <div key={i} className="flex justify-center flex-col items-center relative h-9">
                            <button 
                                onClick={() => handleDayClick(day)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all relative z-10 ${
                                    isSelected 
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 scale-105' 
                                        : isToday 
                                            ? 'bg-white/10 text-white border border-white/20'
                                            : 'text-gray-300 hover:bg-white/5'
                                }`}
                            >
                                {day}
                            </button>
                            {status && !isSelected && (
                                <div className="absolute bottom-0 flex gap-1">
                                    <div className={`w-1 h-1 rounded-full ${status.hasSubscription ? 'bg-purple-500' : 'bg-cyan-400'}`} />
                                    {status.count > 1 && <div className="w-1 h-1 rounded-full bg-gray-500" />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="mt-0 bg-[#2c2c2e]/30 rounded-t-[2.5rem] border-t border-white/5 px-6 pt-6 pb-16 flex flex-col flex-1 min-h-[150px] overflow-y-auto no-scrollbar">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 shrink-0">
                {selectedDate.toLocaleDateString(lang === 'pt' ? 'pt-BR' : (lang === 'es' ? 'es-ES' : 'en-US'), { day: '2-digit', month: 'long' })}
                <span className="h-px flex-1 bg-white/10"></span>
            </h3>
            
            <div className="flex flex-col gap-2">
                {selectedDayTransactions.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-8 opacity-40">
                         <AlertCircle className="w-8 h-8 text-gray-500 mb-2" />
                         <span className="text-xs text-gray-500 font-medium">{t.calendar.empty}</span>
                     </div>
                ) : (
                    selectedDayTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#1c1c1e] border border-white/5 shadow-sm shrink-0">
                            <div className={`w-1 h-8 rounded-full ${
                                tx.paid ? 'bg-green-500' : (tx.type === 'subscription' ? 'bg-purple-500' : 'bg-cyan-400')
                            }`} />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${tx.paid ? 'text-gray-500 line-through' : 'text-white'}`}>
                                    {tx.name}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase">{tx.type === 'subscription' ? t.addTransaction.typeSub : t.addTransaction.typePurchase}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-bold block whitespace-nowrap ${tx.paid ? 'text-gray-500' : 'text-white'}`}>
                                    R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                                {tx.paid && <span className="text-[10px] text-green-500 font-bold flex items-center justify-end gap-1"><Check className="w-3 h-3" /> {t.calendar.paid}</span>}
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
