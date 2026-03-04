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
      className="relative w-full md:col-span-2 bg-accent rounded-[2.5rem] p-6 text-white flex flex-col justify-between min-h-[220px] md:min-h-0 md:h-40 shadow-lg shadow-accent/20"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      {...props}
    >

      {/* Wrapper Interno Flex para Desktop */}
      <div className="flex flex-col md:flex-row md:items-center justify-between h-full gap-6 md:gap-4">

        {/* Lado Esquerdo (Desktop) / Topo (Mobile) - Header & Valor */}
        <div className="flex flex-col gap-2 md:gap-0 md:justify-center h-full">
          {/* Header of Card */}
          <div className="flex justify-between md:justify-start items-center w-full md:w-auto">
            <div className="flex items-center gap-3">
              <span className="text-lg font-extrabold text-white drop-shadow-sm tracking-wide md:mb-1">{label}</span>
              <button
                onClick={toggleVisibility}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95 flex items-center justify-center backdrop-blur-sm md:-mt-1"
                title={isVisible ? tCommon.hideBalance : tCommon.showBalance}
              >
                {isVisible ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
              </button>
            </div>

            {/* Drag Handle (Mobile Only) */}
            {draggable && (
              <div
                className="md:hidden p-2 -mr-2 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity touch-none"
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

          {/* Main Balance */}
          <div className="mt-1 md:mt-0">
            {isVisible ? (
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-md truncate md:leading-tight">
                {currencySymbol} {integerPart}<span className="text-3xl text-white">{separator}{decimalPart}</span>
              </h1>
            ) : (
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-md opacity-80 md:leading-tight">
                {currencySymbol} ••••
              </h1>
            )}
          </div>
        </div>

        {/* Lado Direito (Desktop) / Base (Mobile) - Botões e Drag Desk */}
        <div className="flex items-center gap-3 w-full md:w-auto mt-auto md:mt-0">
          {/* Add Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(); }}
            data-tour-id="add-button"
            className="flex-1 md:flex-none md:w-48 bg-[#121214] text-white h-16 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg px-2"
          >
            <span className="text-sm font-medium">{addButtonLabel}</span>
            <Plus className="w-5 h-5" />
          </button>

          {/* Duplicate Button (Copy Icon) */}
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicateClick(); }}
            data-tour-id="duplicate-button"
            className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg shrink-0"
            title={tCommon.duplicateMonth}
          >
            <Copy className="w-6 h-6" />
          </button>

          {/* Calculator Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onCalculatorClick(); }}
            data-tour-id="calculator-button"
            className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg shrink-0"
            title={tCalc.title}
          >
            <Calculator className="w-6 h-6" />
          </button>

          {/* Drag Handle (Desktop Only) */}
          {draggable && (
            <div
              className="hidden md:flex p-2 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
              draggable={true}
              onDragStart={handleDragStart}
              onDragEnd={onDragEnd}
            >
              <GripVertical className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default React.memo(BalanceCard);