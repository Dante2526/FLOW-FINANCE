import React, { useRef, useEffect, useState } from 'react';
import { ArrowUpRight, Trash2, X, Check, Copy } from 'lucide-react';
import { MonthSummary, AppLanguage } from '../types';
import { TRANSLATIONS, getLocale } from '../i18n';

interface Props {
  months: MonthSummary[];
  activeMonthId: string;
  onSelectMonth: (id: string) => void;
  onDeleteMonth: (id: string) => void;
  onDuplicateMonth?: () => void;
  appLanguage: AppLanguage;
}

interface MonthCardProps {
  item: MonthSummary;
  isActive: boolean;
  canDelete: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate?: () => void;
  appLanguage: AppLanguage;
}

// Map mapping internal DB values (PT-BR) to Translation Keys
const PT_TO_KEY_MAP: Record<string, string> = {
  'JANEIRO': 'jan', 'FEVEREIRO': 'fev', 'MARÇO': 'mar', 'ABRIL': 'abr', 'MAIO': 'mai', 'JUNHO': 'jun',
  'JULHO': 'jul', 'AGOSTO': 'ago', 'SETEMBRO': 'set', 'OUTUBRO': 'out', 'NOVEMBRO': 'nov', 'DEZEMBRO': 'dez'
};

const getMonthDisplayName = (dbName: string, lang: AppLanguage): string => {
  if (!dbName) return '';
  const key = PT_TO_KEY_MAP[dbName.toUpperCase().trim()];
  if (key) {
    // Access translation safely
    const translated = TRANSLATIONS[lang]?.months?.[key as keyof typeof TRANSLATIONS['pt']['months']];
    return translated || dbName;
  }
  return dbName;
};

// MEMOIZED ATOMIC COMPONENT
const MonthCard = React.memo<MonthCardProps>(({ item, isActive, canDelete, onSelect, onDelete, onDuplicate, appLanguage }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);

  const tCommon = TRANSLATIONS[appLanguage].common;

  // Reset confirmation state if active month changes
  useEffect(() => {
    if (!isActive) {
      setIsConfirming(false);
      setSwipeX(0);
    }
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

  // Swipe handlers for duplicate action
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive || isConfirming || !onDuplicate) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    directionLocked.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;

    const diffX = e.touches[0].clientX - startX.current;
    const diffY = e.touches[0].clientY - startY.current;

    // Lock direction on first significant movement
    if (directionLocked.current === null) {
      if (Math.abs(diffX) < 8 && Math.abs(diffY) < 8) return;
      directionLocked.current = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
    }

    if (directionLocked.current === 'vertical') return;

    // Only allow swiping left (negative)
    const clampedX = Math.min(0, Math.max(-80, diffX));
    setSwipeX(clampedX);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    startX.current = null;
    startY.current = null;
    directionLocked.current = null;

    // Snap: if swiped far enough, lock open; otherwise snap back
    if (swipeX < -40) {
      setSwipeX(-80);
    } else {
      setSwipeX(0);
    }
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive || isConfirming || !onDuplicate) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    isDragging.current = true;
    directionLocked.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || startX.current === null) return;
    
    const diffX = e.clientX - startX.current;
    const diffY = e.clientY - (startY.current || 0);

    if (directionLocked.current === null) {
      if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) return;
      directionLocked.current = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
    }

    if (directionLocked.current === 'vertical') return;

    e.preventDefault();
    const clampedX = Math.min(0, Math.max(-80, diffX));
    setSwipeX(clampedX);
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startX.current = null;
    startY.current = null;
    directionLocked.current = null;

    if (swipeX < -40) {
      setSwipeX(-80);
    } else {
      setSwipeX(0);
    }
  };

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate();
      setSwipeX(0);
    }
  };

  const displayName = getMonthDisplayName(item.month, appLanguage);
  const locale = getLocale(appLanguage);
  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  return (
    <div 
      data-month-id={item.id}
      className={`relative flex-shrink-0 w-36 h-24 rounded-[2rem] transition-all duration-300 isolate cursor-pointer snap-center ${
        isActive ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
      }`}
      style={{ overflow: 'visible' }}
    >
        {/* Duplicate Action (revealed on swipe) */}
        {isActive && onDuplicate && (
          <div className="absolute inset-y-0 right-0 w-24 -mr-2 z-0 flex items-center justify-end pr-2">
             <button
               onClick={handleDuplicateClick}
               data-tour-id="duplicate-button"
               className="w-16 h-16 rounded-[1.2rem] bg-[#1a1a1d] flex flex-col items-center justify-center gap-1 shadow-inner border border-white/[0.03] transition-all duration-300 hover:bg-[#2c2c2e] active:scale-95"
               style={{ 
                 opacity: swipeX < -20 ? 1 : 0, 
                 transform: `rotate(${swipeX < -40 ? 0 : 15}deg) scale(${swipeX < -40 ? 1 : 0.8})`,
                 pointerEvents: swipeX < -30 ? 'auto' : 'none' 
               }}
               title={tCommon.duplicateMonth}
             >
               <Copy className="w-5 h-5 text-accent" strokeWidth={2.5} />
               <span className="text-[8px] font-bold text-accent uppercase tracking-wider">Duplicar</span>
             </button>
          </div>
        )}

        {/* Content Container (Foreground - slides) */}
        <div 
          className={`absolute inset-0 rounded-[2rem] overflow-hidden z-10 ${
            isConfirming ? 'bg-red-600' : 'bg-accent'
          } ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0b] shadow-lg shadow-accent/20' : ''}`}
          style={{ 
            transform: `translateX(${swipeX}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s'
          }}
          onClick={() => {
            if (swipeX !== 0) {
              setSwipeX(0);
              return;
            }
            if (!isConfirming) onSelect(item.id);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          
          {isConfirming ? (
             // --- CONFIRMATION STATE ---
             <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                <span className="text-white font-bold text-xs uppercase mb-2">{tCommon.confirmDeleteMonth}</span>
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
                <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
                   <span className={`font-bold text-[10px] tracking-wider border px-1.5 py-0.5 rounded-md transition-colors w-fit ${
                     isActive ? 'text-white/90 border-white/50' : 'text-white/60 border-white/20'
                   }`}>
                     {item.year}
                   </span>
                </div>

                {/* Bottom Content (Month & Total) */}
                <div className="absolute bottom-4 left-4 flex flex-col pointer-events-none">
                  <h3 className="text-white font-black text-sm tracking-wide uppercase leading-none mb-1">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm opacity-90 leading-none">
                        {currencySymbol} {item.total.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-white/60'}`}>
                        {item.count || 0}
                    </span>
                  </div>
                </div>
             </>
          )}
        </div>

        {/* Delete/Action Button - Explicitly on top */}
        {!isConfirming && isActive && swipeX === 0 && canDelete ? (
          <button 
            type="button"
            onClick={handleDeleteClick}
            className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-transform"
            title={tCommon.deleteMonthTitle}
          >
            <div className="w-8 h-8 rounded-full bg-red-600 shadow-sm flex items-center justify-center border-2 border-transparent hover:border-white/20">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
          </button>
        ) : !isConfirming && swipeX === 0 && (
          <div className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center pointer-events-none z-10">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isActive ? 'bg-white text-accent' : 'bg-white/20 text-white'}`}>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        )}
    </div>
  );
});

const TransactionSummary: React.FC<Props> = ({ months, activeMonthId, onSelectMonth, onDeleteMonth, onDuplicateMonth, appLanguage }) => {
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
    <div className="mt-8 mb-2" data-tour-id="month-switcher">
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
            onDuplicate={onDuplicateMonth}
            appLanguage={appLanguage}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TransactionSummary);