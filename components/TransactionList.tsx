import React, { useState, useRef } from 'react';
import { Transaction, AppLanguage } from '../types';
import { TransactionIcon } from './Icons';
import { Trash2, Edit2, Check } from 'lucide-react';
import { TRANSLATIONS, getLocale } from '../i18n';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onToggleStatus: (id: string) => void;
  onTogglePaymentMethod: (id: string) => void;
  title?: string;
  appLanguage: AppLanguage;
}

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
  if (dateStr === todayStr) return todayLabel;
  if (dateStr.toLowerCase().includes(todayLabel.toLowerCase())) return todayLabel;
  try {
    const parts = dateStr.split(' ')[0].split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return dateStr; 
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' }).replace('.', '');
  } catch (e) {
    return dateStr;
  }
};

interface SwipeableTransactionItemProps {
  tx: Transaction;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onToggleStatus: (id: string) => void;
  t: any;
  locale: string;
  currencySymbol: string;
}

const SwipeableTransactionItem = React.memo<SwipeableTransactionItemProps>(({ 
  tx, 
  index,
  onDelete,
  onEdit,
  onToggleStatus,
  t,
  locale,
  currencySymbol
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const interactionType = useRef<'scroll' | 'swipe' | null>(null);

  const handleStart = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    startOffset.current = offsetX;
    isDragging.current = true;
    interactionType.current = null;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
    if (interactionType.current === 'scroll') return;
    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;
    if (interactionType.current === null) {
      if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) return;
      if (Math.abs(diffY) > Math.abs(diffX)) {
        interactionType.current = 'scroll';
        return;
      } else {
        interactionType.current = 'swipe';
      }
    }
    if (interactionType.current === 'swipe') {
      const newOffset = startOffset.current + diffX;
      if (newOffset > 100) setOffsetX(100);
      else if (newOffset < -100) setOffsetX(-100);
      else setOffsetX(newOffset);
    }
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startX.current = null;
    startY.current = null;
    interactionType.current = null;
    if (offsetX < -40) setOffsetX(-80);
    else if (offsetX > 40) setOffsetX(80);
    else setOffsetX(0);
  };

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      if (interactionType.current === 'swipe') e.preventDefault();
      handleMove(e.clientX, e.clientY);
    }
  };
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging.current) handleEnd(); };
  const handleClick = () => { if (offsetX !== 0) setOffsetX(0); };

  return (
    <div data-tour-id={`transaction-item-${index}`} className="relative sm:aspect-[10/12] rounded-2xl bg-[#1c1c1e] overflow-hidden select-none cursor-grab active:cursor-grabbing will-change-transform">
      <div className={`absolute inset-0 flex justify-between rounded-2xl transition-all duration-200 ${offsetX === 0 ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
         <button onClick={() => { onEdit(tx); setOffsetX(0); }} className="w-20 h-full flex items-center justify-center bg-yellow-600 text-white hover:bg-yellow-700 transition-colors pl-2" title={t.actions.edit}>
          <Edit2 className="w-6 h-6" />
        </button>
        <button onClick={() => onDelete(tx.id)} className="w-20 h-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors pr-2" title={t.actions.delete}>
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      <div 
        className="relative bg-[#1c1c1e] h-full p-4 flex flex-col justify-between border border-white/5 shadow-lg shadow-black/20 touch-pan-y transition-transform duration-200 ease-out z-10 rounded-2xl"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave} onClick={handleClick}
      >
        <div className="flex justify-between items-start">
            <div className="scale-90 -ml-2 -mt-1">
                <TransactionIcon type={tx.logoType} />
            </div>
            
            <button
                onClick={(e) => { e.stopPropagation(); onToggleStatus(tx.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                    tx.paid 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-transparent border-gray-600 hover:border-gray-400'
                }`}
            >
                {tx.paid && <Check className="w-3 h-3 text-black" strokeWidth={4} />}
            </button>
        </div>

        <div className="mt-auto">
            <h3 className={`font-bold text-lg text-white uppercase truncate transition-colors ${tx.paid ? 'text-white/60 line-through' : 'text-white'}`}>
                {tx.name}
            </h3>
            {!tx.paid && (
                <span className="text-xs text-gray-500 font-medium uppercase">
                    {t.due} <span className="text-gray-400">{formatDateDisplay(tx.date, t.today, locale)}</span>
                </span>
            )}

            <div className="flex justify-between items-end mt-2">
                <span className={`text-xl font-bold tabular-nums transition-colors ${tx.paid ? 'text-white/50' : 'text-white'}`}>
                    {currencySymbol} {tx.amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-opacity ${
                    tx.paid ? 'opacity-50' : 'opacity-100'
                    } ${
                    tx.type === 'subscription' 
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                        : 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20'
                    }`}>
                    {t.types[tx.type] || tx.type}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
});

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, onToggleStatus, onTogglePaymentMethod, title, appLanguage }) => {
  const t = TRANSLATIONS[appLanguage];
  const locale = getLocale(appLanguage);
  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  return (
    <div className="mt-6 flex flex-col" data-tour-id="transaction-list">
      <h2 className="text-xl font-medium text-gray-400 mb-4 pl-1">{title || t.billsTitle}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {transactions.map((tx, index) => (
          <SwipeableTransactionItem 
            key={tx.id} 
            tx={tx} 
            index={index}
            onDelete={onDelete} 
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            t={t.transactionList}
            locale={locale}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TransactionList);