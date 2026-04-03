import React, { useState, useRef } from 'react';
import { Transaction, AppLanguage } from '../types';
import { TransactionIcon } from './Icons';
import { Trash2, Edit2, Check, CreditCard, QrCode, RotateCcw } from 'lucide-react';
import { TRANSLATIONS, getLocale } from '../i18n';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onToggleStatus: (id: string) => void;
  onTogglePaymentMethod: (id: string) => void;
  title?: string;
  appLanguage: AppLanguage;
  onAddClick?: () => void;
}

// Helper to get today's date string in YYYY-MM-DD format, timezone-safe.
const getLocalISODateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr: string, todayLabel: string, locale: string) => {
  if (!dateStr) return '';

  const todayStr = getLocalISODateString();
  // Check if the date string (now guaranteed to be 'YYYY-MM-DD') is today.
  if (dateStr === todayStr) {
    return todayLabel;
  }

  // Handle legacy "Hoje" text for old data that hasn't been updated yet.
  if (dateStr.toLowerCase().includes(todayLabel.toLowerCase())) {
    return todayLabel;
  }

  // If not today, format the date for display.
  try {
    // TIMEZONE FIX: Construct date from parts to avoid UTC interpretation
    const parts = dateStr.split(' ')[0].split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // month is 0-indexed
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    if (isNaN(d.getTime())) return dateStr;
    // Force short month format
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' }).replace('.', '');
  } catch (e) {
    // Fallback for any other legacy format.
    return dateStr;
  }
};

interface SwipeableTransactionItemProps {
  tx: Transaction;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onToggleStatus: (id: string) => void;
  onTogglePaymentMethod: (id: string) => void;
  t: any; // Translation part
  locale: string;
  currencySymbol: string;
}

// MEMOIZED ATOMIC COMPONENT
const SwipeableTransactionItem = React.memo<SwipeableTransactionItemProps>(({
  tx,
  index,
  onDelete,
  onEdit,
  onToggleStatus,
  onTogglePaymentMethod,
  t,
  locale,
  currencySymbol
}) => {
  const [offsetX, setOffsetX] = useState(0);

  // Refs to track gestures without re-renders
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null); // Track vertical start
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const interactionType = useRef<'scroll' | 'swipe' | null>(null); // Lock direction

  // Touch Handlers (Mobile - Uses absolute coordinates X)
  const handleTouchStart = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    startOffset.current = offsetX;
    isDragging.current = true;
    interactionType.current = null;
  };

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
    if (interactionType.current === 'scroll') return;

    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;

    if (interactionType.current === null) {
      // Need a decent threshold to decide intentionality on mobile touch screens
      if (Math.abs(diffX) < 15 && Math.abs(diffY) < 15) return;

      // Strict rule: horizontal movement MUST be clearly greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY) * 1.5) interactionType.current = 'swipe';
      else { interactionType.current = 'scroll'; return; }
    }

    if (interactionType.current === 'swipe') {
      const newOffset = startOffset.current + diffX; // No artificial speed multiplier for pure touch
      if (newOffset > 100) setOffsetX(100);
      else if (newOffset < -100) setOffsetX(-100);
      else setOffsetX(newOffset);
    }
  };

  // Mouse Handlers (Desktop - Uses relative movementX for flawless dragging inside Grid)
  const handleMouseStart = () => {
    isDragging.current = true;
  };

  const handleMouseMove = (movementX: number) => {
    if (!isDragging.current) return;

    // movementX is the exact delta of mouse movement since last frame. Just add it.
    // Let's multiply by 1.5 to keep it fast
    setOffsetX((prev) => {
      let newOffset = prev + (movementX * 1.5);
      if (newOffset > 100) return 100;
      if (newOffset < -100) return -100;
      return newOffset;
    });
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startX.current = null;
    startY.current = null;
    interactionType.current = null;

    // Snap logic - extremely magnetic threshold
    if (offsetX < -10) {
      setOffsetX(-85); // Delete
    } else if (offsetX > 10) {
      setOffsetX(85); // Edit
    } else {
      setOffsetX(0);
    }
  };

  // Bindings
  const onTouchStart = (e: React.TouchEvent) => handleTouchStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleTouchMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  const onMouseDown = (e: React.MouseEvent) => handleMouseStart();
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      // Only prevent default if we are SWIPING. If scrolling, allow default.
      if (interactionType.current === 'swipe') {
        e.preventDefault();
      }
      handleMouseMove(e.movementX);
    }
  };
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => {
    if (isDragging.current) handleEnd();
  };

  const handleClick = () => {
    // If swiped open, close it
    if (offsetX !== 0) {
      setOffsetX(0);
      return;
    }
  };

  return (
    <div
      data-tour-id={`transaction-item-${index}`}
      className="relative mb-3 h-24 rounded-2xl bg-[#1c1c1e] overflow-hidden select-none cursor-grab active:cursor-grabbing will-change-transform"
      style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
    >
      {/* Background (Buttons) */}
      <div className={`absolute inset-0 flex justify-between rounded-2xl transition-all duration-200 ${offsetX === 0 ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>

        {/* Left Side (Edit) - Visible when swiping Right (positive offset) */}
        <button
          onClick={() => {
            onEdit(tx);
            setOffsetX(0);
          }}
          className="w-20 h-full flex items-center justify-center bg-yellow-600 text-white hover:bg-yellow-700 transition-colors pl-2"
          title={t.actions.edit}
        >
          <Edit2 className="w-6 h-6" />
        </button>

        {/* Right Side (Delete) - Visible when swiping Left (negative offset) */}
        <button
          onClick={() => onDelete(tx.id)}
          className="w-20 h-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors pr-2"
          title={t.actions.delete}
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      {/* Foreground (Card) */}
      <div
        className={`relative bg-[#1c1c1e] h-full px-4 flex items-center justify-between gap-4 border border-white/5 shadow-lg shadow-black/20 touch-pan-y z-10 rounded-2xl ${!isDragging.current ? 'transition-transform duration-200 ease-out' : ''
          }`}
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        <div className="flex items-center gap-3 pointer-events-none flex-1 min-w-0">
          {/* Logo */}
          <div className="relative scale-90 shrink-0">
            <TransactionIcon type={tx.logoType} />
          </div>

          {/* Info */}
          <div className="pointer-events-auto flex flex-col items-start justify-center h-full pt-1 min-w-0 w-full">
            <span className={`font-bold text-sm transition-colors block leading-none mb-1 whitespace-nowrap overflow-hidden w-full ${tx.paid ? 'text-white/60 line-through decoration-white/30' : 'text-white'}`}>
              {tx.name}
            </span>

            {/* Date Display (Tiny) */}
            {!tx.paid && (
              <span className="text-[10px] text-gray-500 font-medium uppercase whitespace-nowrap overflow-hidden w-full">
                {t.due} <span className="text-gray-400">{formatDateDisplay(tx.date, t.today, locale)}</span>
              </span>
            )}

            {/* Payment Method Badge - Clickable - ONLY VISIBLE IF PAID */}
            {tx.paid && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePaymentMethod(tx.id);
                }}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase cursor-pointer hover:opacity-80 active:scale-95 transition-all select-none ${tx.paymentMethod === 'pix'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                {tx.paymentMethod === 'pix' ? <QrCode className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                {tx.paymentMethod === 'pix' ? t.methods.pix : t.methods.card}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Group: Amount + Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Amount & Badge */}
          <div className="flex flex-col items-end gap-0.5 pointer-events-none mr-1">
            <span className={`text-base font-bold tabular-nums transition-colors ${tx.paid ? 'text-white/50' : 'text-white'}`}>
              {currencySymbol} {tx.amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>

            <div className={`px-1.5 py-px rounded-full text-[8px] font-bold uppercase tracking-wide transition-opacity ${tx.paid ? 'opacity-50' : 'opacity-100'
              } ${tx.type === 'subscription'
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                : 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20'
              }`}>
              {t.types[tx.type] || tx.type}
            </div>
          </div>

          {/* Paid Toggle Button - Kept on card face for quick access */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent affecting swipe
              onToggleStatus(tx.id);
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on button click
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 cursor-pointer active:scale-95 ${tx.paid
              ? 'bg-green-500 border-green-500'
              : 'bg-transparent border-gray-600 hover:border-gray-400'
              }`}
          >
            {tx.paid && <Check className="w-4 h-4 text-black" strokeWidth={4} />}
          </button>
        </div>
      </div>
    </div>
  );
});

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, onToggleStatus, onTogglePaymentMethod, title, appLanguage, onAddClick }) => {
  const t = TRANSLATIONS[appLanguage].transactionList;
  const tRoot = TRANSLATIONS[appLanguage];
  const locale = getLocale(appLanguage);
  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  const unpaidCount = transactions.filter(tx => !tx.paid).length;

  return (
    <div className="mt-6 flex flex-col" data-tour-id="transaction-list">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#1c1c1e] rounded-2xl px-4 py-3 flex items-center gap-3 border border-white/5 shadow-lg shadow-black/20">
          <h2 className="text-xl font-medium text-gray-400">{title || t.billsTitle}</h2>
          {transactions.length > 0 && (
            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full transition-colors ${unpaidCount > 0 ? 'bg-accent/15 text-accent' : 'bg-green-500/10 text-green-500'}`}>
              {unpaidCount}
            </span>
          )}
        </div>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="bg-[#1c1c1e] rounded-2xl px-4 py-3 flex items-center justify-center gap-2 border border-white/5 shadow-lg shadow-black/20 hover:bg-[#2c2c2e] transition-all active:scale-95 cursor-pointer group"
            data-tour-id="add-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="text-gray-400 font-medium text-sm group-hover:text-white transition-colors">{tRoot.addBtn}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        {transactions.map((tx, index) => (
          <SwipeableTransactionItem
            key={tx.id}
            tx={tx}
            index={index}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onTogglePaymentMethod={onTogglePaymentMethod}
            t={t}
            locale={locale}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TransactionList);
