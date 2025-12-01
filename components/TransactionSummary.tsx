
import React from 'react';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { MonthSummary } from '../types';

interface Props {
  months: MonthSummary[];
  activeMonthId: string;
  onSelectMonth: (id: string) => void;
  onDeleteMonth: (id: string) => void;
}

const TransactionSummary: React.FC<Props> = ({ months, activeMonthId, onSelectMonth, onDeleteMonth }) => {
  return (
    <div className="mt-8 mb-2">
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-2 -mx-2 items-center">
        
        {months.map((item) => {
          const isActive = item.id === activeMonthId;
          
          return (
            <div 
              key={item.id}
              onClick={() => onSelectMonth(item.id)}
              className={`relative flex-shrink-0 w-36 h-24 rounded-[2rem] shadow-lg shadow-accent/20 transition-all duration-300 isolate cursor-pointer overflow-hidden ${
                isActive 
                  ? 'opacity-100 scale-100 ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0b]' 
                  : 'opacity-50 scale-95'
              }`}
            >
               {/* Content Container (Background) */}
               <div className="absolute inset-0 bg-accent z-0">
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
               </div>

               {/* Delete/Action Button - Explicitly on top */}
               {isActive && months.length > 1 ? (
                 <button 
                   type="button"
                   onClick={(e) => {
                     e.stopPropagation();
                     e.preventDefault(); 
                     onDeleteMonth(item.id);
                   }}
                   className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-transform"
                   title="Deletar Mês"
                 >
                   <div className="w-8 h-8 rounded-full bg-red-600 shadow-sm flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-white" />
                   </div>
                 </button>
               ) : (
                 <div className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center pointer-events-none z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isActive ? 'bg-white text-accent' : 'bg-white/20 text-white'}`}>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                 </div>
               )}

            </div>
          );
        })}

      </div>
    </div>
  );
};

export default TransactionSummary;
