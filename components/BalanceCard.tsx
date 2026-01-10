import React, { useState } from 'react';
import { Plus, Copy, Calculator, GripVertical, Eye, EyeOff } from 'lucide-react';
import { AppLanguage } from '../types';
import { TRANSLATIONS, getLocale } from '../i18n';

interface Props {
  balance: number;
  label?: string;
  addButtonLabel?: string;
  onAddClick: () => void;
  onDuplicateClick: () => void;
  onCalculatorClick: () => void;
  // DnD Props
  id?: string;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnter?: (id: string) => void;
  onDragEnd?: () => void;
  appLanguage?: AppLanguage;
  [key: string]: any; // To accept data-* attributes
}

const BalanceCard: React.FC<Props> = ({ 
  balance, 
  label = 'LUCRO',
  addButtonLabel = 'Adicionar',
  onAddClick, 
  onDuplicateClick, 
  onCalculatorClick,
  id = 'balance-card',
  draggable,
  onDragStart,
  onDragEnter,
  onDragEnd,
  appLanguage = 'pt',
  ...props
}) => {
  // State for balance visibility
  const [isVisible, setIsVisible] = useState(() => {
    try {
      const saved = localStorage.getItem('flow_balance_visible');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const tCommon = TRANSLATIONS[appLanguage].common;
  const tCalc = TRANSLATIONS[appLanguage].calculator;

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem('flow_balance_visible', JSON.stringify(newState));
  };

  // Format the balance to maintain the visual style (large integer, smaller decimals)
  const locale = getLocale(appLanguage as AppLanguage);
  
  // Handling for very large numbers to prevent UI breakage
  const safeBalance = Math.abs(balance) > 999999999 ? 999999999 : balance;
  
  const formattedBalance = safeBalance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Determine separator based on locale
  const separator = locale === 'en-US' ? '.' : ',';
  const parts = formattedBalance.split(separator);
  const integerPart = parts[0];
  const decimalPart = parts[1] || '00';
  
  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  // Native DnD Handlers
  const handleDragStart = (e: React.DragEvent) => {
     if (onDragStart && id) onDragStart(id);
  };

  const handleDragEnter = (e: React.DragEvent) => {
     if (onDragEnter && id) onDragEnter(id);
  };

  // Touch Handler for Mobile Drag Simulation
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation(); // Stop scrolling interference
    
    // Rely on touch-action: none for scroll prevention
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardRow = element?.closest('[data-card-id]');
    
    if (cardRow) {
      const targetId = cardRow.getAttribute('data-card-id');
      if (targetId && targetId !== id && onDragEnter) {
         onDragEnter(targetId);
      }
    }
  };

  return (
    <div 
      data-card-id={id}
      className="relative w-full bg-accent rounded-[2.5rem] p-6 text-white flex flex-col justify-between min-h-[220px] shadow-lg shadow-accent/20"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      {...props}
    >
      
      {/* Header of Card */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-white drop-shadow-sm tracking-wide">{label}</span>
          <button 
            onClick={toggleVisibility}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95 flex items-center justify-center backdrop-blur-sm"
            title={isVisible ? tCommon.hideBalance : tCommon.showBalance}
          >
            {isVisible ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
          </button>
        </div>
        
        {/* Drag Handle */}
        {draggable && (
           <div 
             className="p-2 -mt-2 -mr-2 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity touch-none"
             style={{ touchAction: 'none' }}
             draggable={true}
             onDragStart={handleDragStart}
             onDragEnd={onDragEnd}
             // Manual Touch Handlers for Mobile
             onTouchStart={(e) => {
                e.stopPropagation();
                if (onDragStart && id) onDragStart(id);
             }}
             onTouchMove={handleTouchMove}
             onTouchEnd={(e) => {
                e.stopPropagation();
                if (onDragEnd) onDragEnd();
             }}
           >
             <GripVertical className="w-6 h-6 text-white" />
           </div>
        )}
      </div>

      {/* Main Balance */}
      <div className="mt-2 mb-6">
        {isVisible ? (
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-md truncate">
            {currencySymbol} {integerPart}<span className="text-3xl text-white">{separator}{decimalPart}</span>
          </h1>
        ) : (
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-md opacity-80">
            {currencySymbol} ••••
          </h1>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-3">
        {/* Add Button (Promoted to Primary - replaces Send) */}
        <button 
          onClick={(e) => { e.stopPropagation(); onAddClick(); }}
          data-tour-id="add-button"
          className="flex-1 bg-[#121214] text-white h-16 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg"
        >
          <span className="text-lg font-medium">{addButtonLabel}</span>
          <Plus className="w-5 h-5" />
        </button>

        {/* Duplicate Button (Copy Icon) */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDuplicateClick(); }}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
          title={tCommon.duplicateMonth}
        >
          <Copy className="w-6 h-6" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onCalculatorClick(); }}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
          title={tCalc.title}
        >
          <Calculator className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(BalanceCard);