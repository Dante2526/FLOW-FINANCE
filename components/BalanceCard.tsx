
import React, { useState } from 'react';
import { Plus, Copy, Calculator, GripVertical, Eye, EyeOff } from 'lucide-react';
import { AppTheme } from '../types';

interface Props {
  balance: number;
  onAddClick: () => void;
  onDuplicateClick: () => void;
  onCalculatorClick: () => void;
  // DnD Props
  id?: string;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnter?: (id: string) => void;
  onDragEnd?: () => void;
  theme?: AppTheme;
}

const BalanceCard: React.FC<Props> = ({ 
  balance, 
  onAddClick, 
  onDuplicateClick, 
  onCalculatorClick,
  id = 'balance-card',
  draggable,
  onDragStart,
  onDragEnter,
  onDragEnd,
  theme
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

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem('flow_balance_visible', JSON.stringify(newState));
  };

  // Format the balance to maintain the visual style (large integer, smaller decimals)
  const formattedBalance = balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [integerPart, decimalPart] = formattedBalance.split(',');

  // Native DnD Handlers
  const handleDragStart = (e: React.DragEvent) => {
     if (onDragStart && id) onDragStart(id);
  };

  const handleDragEnter = (e: React.DragEvent) => {
     if (onDragEnter && id) onDragEnter(id);
  };

  // Touch Handler for Mobile Drag Simulation
  const handleTouchMove = (e: React.TouchEvent) => {
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

  // Dynamic Styles based on Theme
  const dynamicStyle = theme ? {
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
    boxShadow: `0 20px 50px -12px ${theme.primary}66` // 66 hex is approx 40% opacity
  } : {};

  const baseClasses = "relative w-full rounded-[2.5rem] p-6 text-white flex flex-col justify-between min-h-[240px] overflow-hidden group transition-all duration-500";
  const defaultClasses = "bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 shadow-2xl shadow-orange-900/40";

  return (
    <div 
      data-card-id={id}
      className={theme ? baseClasses : `${baseClasses} ${defaultClasses}`}
      style={dynamicStyle}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
    >
      {/* Decorative background elements for depth */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* Header of Card */}
      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
            <span className="text-xs font-bold text-white tracking-widest uppercase">Saldo Atual</span>
          </div>
          <button 
            onClick={toggleVisibility}
            className="p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95 flex items-center justify-center"
            title={isVisible ? "Esconder saldo" : "Mostrar saldo"}
          >
            {isVisible ? <Eye className="w-5 h-5 text-white/90" /> : <EyeOff className="w-5 h-5 text-white/90" />}
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

      {/* Main Balance with Improved Typography */}
      <div className="mt-4 mb-8 z-10">
        {isVisible ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-medium text-white/80 font-sans">R$</span>
            <h1 className="text-6xl font-black tracking-tighter drop-shadow-sm text-white">
              {integerPart}<span className="text-4xl text-white/80 font-bold">,{decimalPart}</span>
            </h1>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5 animate-pulse">
            <span className="text-2xl font-medium text-white/80">R$</span>
             <h1 className="text-6xl font-black tracking-tight drop-shadow-md opacity-50 translate-y-2">
              ••••••
            </h1>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-3 z-10">
        {/* Add Button (Promoted to Primary) */}
        <button 
          onClick={onAddClick}
          className="flex-1 bg-[#0a0a0b]/90 backdrop-blur-md text-white h-14 rounded-[1.25rem] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 border border-white/5 group-hover:border-white/10"
        >
          <Plus className="w-5 h-5 text-accent" />
          <span className="text-sm font-bold tracking-wide">Nova Conta</span>
        </button>

        {/* Duplicate Button */}
        <button 
          onClick={onDuplicateClick}
          className="w-14 h-14 bg-[#0a0a0b]/40 backdrop-blur-md text-white rounded-[1.25rem] flex items-center justify-center hover:bg-[#0a0a0b]/60 transition-all shadow-lg active:scale-95 border border-white/10"
          title="Duplicar contas para o próximo mês"
        >
          <Copy className="w-5 h-5" />
        </button>

        {/* Calculator Button */}
        <button 
          onClick={onCalculatorClick}
          className="w-14 h-14 bg-[#0a0a0b]/40 backdrop-blur-md text-white rounded-[1.25rem] flex items-center justify-center hover:bg-[#0a0a0b]/60 transition-all shadow-lg active:scale-95 border border-white/10"
        >
          <Calculator className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(BalanceCard);
