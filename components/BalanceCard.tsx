
import React, { useState } from 'react';
import { Plus, Copy, Calculator, GripVertical, Eye, EyeOff } from 'lucide-react';
import { TRANSLATIONS } from '../i18n';
import { AppLanguage } from '../types';

interface Props {
  balance: number;
  label?: string;
  addButtonLabel?: string;
  onAddClick: () => void;
  onDuplicateClick: () => void;
  onCalculatorClick: () => void;
  id?: string;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnter?: (id: string) => void;
  onDragEnd?: () => void;
  lang?: AppLanguage;
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
  lang = 'pt'
}) => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      const saved = localStorage.getItem('flow_balance_visible');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const t = TRANSLATIONS[lang];

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem('flow_balance_visible', JSON.stringify(newState));
  };

  const formattedBalance = balance.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [integerPart, decimalPart] = formattedBalance.split(lang === 'en' ? '.' : ',');

  const handleDragStart = (e: React.DragEvent) => {
     if (onDragStart && id) onDragStart(id);
  };

  const handleDragEnter = (e: React.DragEvent) => {
     if (onDragEnter && id) onDragEnter(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation(); 
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
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-white drop-shadow-sm tracking-wide">{label}</span>
          <button 
            onClick={toggleVisibility}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95 flex items-center justify-center backdrop-blur-sm"
            title={isVisible ? t.balanceCard.hide : t.balanceCard.show}
          >
            {isVisible ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
          </button>
        </div>
        
        {draggable && (
           <div 
             className="p-2 -mt-2 -mr-2 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity touch-none"
             style={{ touchAction: 'none' }}
             draggable={true}
             onDragStart={handleDragStart}
             onDragEnd={onDragEnd}
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

      <div className="mt-2 mb-6">
        {isVisible ? (
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-md">
            {lang === 'en' ? '$' : 'R$'} {integerPart}<span className="text-3xl text-white">{lang === 'en' ? '.' : ','}{decimalPart}</span>
          </h1>
        ) : (
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-md opacity-80">
            {lang === 'en' ? '$' : 'R$'} ••••
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onAddClick(); }}
          className="flex-1 bg-[#121214] text-white h-16 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg"
        >
          <span className="text-lg font-medium">{addButtonLabel}</span>
          <Plus className="w-5 h-5" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onDuplicateClick(); }}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
          title={t.balanceCard.duplicate}
        >
          <Copy className="w-6 h-6" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onCalculatorClick(); }}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
        >
          <Calculator className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(BalanceCard);
