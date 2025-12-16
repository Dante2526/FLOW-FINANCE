import React, { useState } from 'react';
import { Plus, Copy, Calculator, GripVertical, Eye, EyeOff } from 'lucide-react';

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
  onDragEnd
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

  return (
    <div 
      data-card-id={id}
      className="relative w-full bg-accent rounded-[2.5rem] p-6 text-white flex flex-col justify-between min-h-[220px] shadow-lg shadow-accent/20"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
    >
      
      {/* Header of Card */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-white drop-shadow-sm tracking-wide">LUCRO</span>
          <button 
            onClick={toggleVisibility}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95 flex items-center justify-center backdrop-blur-sm"
            title={isVisible ? "Esconder saldo" : "Mostrar saldo"}
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
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-md">
            R$ {integerPart}<span className="text-3xl text-white">,{decimalPart}</span>
          </h1>
        ) : (
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-md opacity-80">
            R$ ••••
          </h1>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-3">
        {/* Add Button (Promoted to Primary - replaces Send) */}
        <button 
          onClick={onAddClick}
          className="flex-1 bg-[#121214] text-white h-16 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg"
        >
          <span className="text-lg font-medium">Adicionar</span>
          <Plus className="w-5 h-5" />
        </button>

        {/* Duplicate Button (Copy Icon) */}
        <button 
          onClick={onDuplicateClick}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
          title="Duplicar contas para o próximo mês"
        >
          <Copy className="w-6 h-6" />
        </button>

        <button 
          onClick={onCalculatorClick}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
        >
          <Calculator className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(BalanceCard);