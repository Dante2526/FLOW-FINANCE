
import React, { useRef, useEffect, useState } from 'react';
import { ArrowUpRight, Trash2, X, Check } from 'lucide-react';
import { MonthSummary } from '../types';

interface Props {
  months: MonthSummary[];
  activeMonthId: string;
  onSelectMonth: (id: string) => void;
  onDeleteMonth: (id: string) => void;
}

interface MonthCardProps {
  item: MonthSummary;
  isActive: boolean;
  canDelete: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

// MEMOIZED ATOMIC COMPONENT
const MonthCard = React.memo<MonthCardProps>(({ item, isActive, canDelete, onSelect, onDelete }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  // Reset confirmation state if active month changes
  useEffect(() => {
    if (!isActive) setIsConfirming(false);
  }, [isActive]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  return (
    <div 
      data-month-id={item.id}
      onClick={() => !isConfirming && onSelect(item.id)}
      className={`relative flex-shrink-0 w-36 h-24 rounded-[2rem] shadow-lg shadow-accent/20 transition-all duration-300 isolate cursor-pointer overflow-hidden snap-center ${
        isActive 
          ? 'opacity-100 scale-100 ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0b]' 
          : 'opacity-50 scale-95'
      }`}
    >
        {/* Content Container (Background) */}
        <div className={`absolute inset-0 transition-colors duration-300 z-0 ${isConfirming ? 'bg-red-600' : 'bg-accent'}`}>
          
          {isConfirming ? (
             // --- CONFIRMATION STATE ---
             <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                <span className="text-white font-bold text-xs uppercase mb-2">Apagar Mês?</span>
                <div className="flex gap-3">
                   <button 
                     onClick={handleCancelDelete}
                     className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors"
                   >
                      <X className="w-4 h-4 text-white" strokeWidth={3} />
                   </button>
                   <button 
                     onClick={handleConfirmDelete}
                     className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                   >
                      <Check className="w-4 h-4" strokeWidth={4} />
                   </button>
                </div>
             </div>
          ) : (
             // --- NORMAL STATE ---
             <>
                {/* Decorative Background Shape */}
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full blur-xl pointer-events-none" />
                
                {/* Year Badge */}
                <span className={`absolute top-4 left-4 font-bold text-[10px] tracking-wider border px-1.5 py-0.5 rounded-md transition-colors pointer-events-none ${
                  isActive ? 'text-white/90 border-white/50' : 'text-white/60 border-white/20'
                }`}>
                  {item.year}
                </span>

                {/* Bottom Content (Month & Total) */}
                <div className="absolute bottom-4 left-4 flex flex-col pointer-events-none">
                  <h3 className="text-white font-black text-sm tracking-wide uppercase leading-none mb-1">
                    {item.month}
                  </h3>
                  <span className="text-white font-bold text-sm opacity-90 leading-none">
                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
             </>
          )}
        </div>

        {/* Delete/Action Button - Explicitly on top */}
        {!isConfirming && isActive && canDelete ? (
          <button 
            type="button"
            onClick={handleDeleteClick}
            className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-transform"
            title="Deletar Mês"
          >
            <div className="w-8 h-8 rounded-full bg-red-600 shadow-sm flex items-center justify-center border-2 border-transparent hover:border-white/20">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
          </button>
        ) : !isConfirming && (
          <div className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center pointer-events-none z-10">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isActive ? 'bg-white text-accent' : 'bg-white/20 text-white'}`}>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        )}
    </div>
  );
});

const TransactionSummary: React.FC<Props> = ({ months, activeMonthId, onSelectMonth, onDeleteMonth }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active month
  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector(`[data-month-id="${activeMonthId}"]`) as HTMLElement;
      
      if (activeElement) {
        // Use scrollIntoView with 'nearest' block to prevent vertical scrolling of the whole page
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', 
          inline: 'center'
        });
      }
    }
  }, [activeMonthId, months.length]);

  return (
    <div className="mt-8 mb-2">
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-2 -mx-2 items-center snap-x snap-mandatory relative"
      >
        {months.map((item) => (
          <MonthCard 
            key={item.id}
            item={item}
            isActive={item.id === activeMonthId}
            canDelete={months.length > 1}
            onSelect={onSelectMonth}
            onDelete={onDeleteMonth}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TransactionSummary);
