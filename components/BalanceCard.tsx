import React, { useState } from 'react';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { AppLanguage } from '../types';
import { TRANSLATIONS, getLocale } from '../i18n';

interface Props {
  balance: number;
  label: string;
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
  label,
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
      className="relative w-full md:col-span-2 md:max-w-2xl md:mx-auto bg-accent rounded-[2.5rem] p-6 text-white h-40 shadow-lg shadow-accent/20 select-none"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      {...props}
    >
      <div className="flex h-full items-center justify-between">
        
        {/* Left Side - Header & Main Balance */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-extrabold text-white drop-shadow-sm tracking-wide uppercase">{label}</span>
            <button
              onClick={toggleVisibility}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95 flex items-center justify-center backdrop-blur-sm"
              title={isVisible ? tCommon.hideBalance : tCommon.showBalance}
            >
              {isVisible ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
            </button>
          </div>

          <div>
            {isVisible ? (
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-md truncate leading-tight">
                {currencySymbol} {integerPart}<span className="text-3xl text-white">{separator}{decimalPart}</span>
              </h1>
            ) : (
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-md opacity-80 leading-tight">
                {currencySymbol} ••••
              </h1>
            )}
          </div>
        </div>

        {/* Right Side - Drag Handle */}
        {draggable && (
          <div
            className="drag-handle p-4 -mr-4 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity touch-none"
            style={{ touchAction: 'none' }}
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onMouseDown={(e) => e.stopPropagation()} 
            onTouchStart={(e) => {
              e.stopPropagation();
              if (onDragStart && id) onDragStart(id);
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
              handleTouchMove(e);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (onDragEnd) onDragEnd();
            }}
          >
            <GripVertical className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(BalanceCard);