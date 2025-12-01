import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { TransactionIcon } from './Icons';
import { Trash2, Edit2, Check, CreditCard, QrCode } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onToggleStatus: (id: string) => void;
  onTogglePaymentMethod: (id: string) => void;
}

const typeTranslation = {
  purchase: 'Compra',
  subscription: 'Assinatura',
  transfer: 'Transferência'
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.toLowerCase().includes('hoje')) return 'Hoje';
  
  // Handle ISO YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const d = new Date(dateStr.split(' ')[0] + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }
  
  // Handle "24 Jan"
  return dateStr;
};

interface SwipeableTransactionItemProps {
  tx: Transaction;
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  onToggleStatus: (id: string) => void;
  onTogglePaymentMethod: (id: string) => void;
}

const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({ 
  tx, 
  onDelete,
  onEdit,
  onToggleStatus,
  onTogglePaymentMethod
}) => {
  const [offsetX, setOffsetX] = useState(0);
  
  // Refs to track gestures without re-renders
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null); // Track vertical start
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const interactionType = useRef<'scroll' | 'swipe' | null>(null); // Lock direction

  // Unified Handler Logic
  const handleStart = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    startOffset.current = offsetX;
    isDragging.current = true;
    interactionType.current = null; // Reset lock
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
    
    // If we already decided this is a SCROLL action, stop here and let browser handle it
    if (interactionType.current === 'scroll') return;

    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;

    // Direction Locking Logic
    if (interactionType.current === null) {
      // Need a small threshold to decide
      if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) return;

      // If vertical movement is greater than horizontal, it's a SCROLL
      if (Math.abs(diffY) > Math.abs(diffX)) {
        interactionType.current = 'scroll';
        return;
      } else {
        // Otherwise, it's a SWIPE
        interactionType.current = 'swipe';
      }
    }

    // Only proceed if we are in SWIPE mode
    if (interactionType.current === 'swipe') {
      const newOffset = startOffset.current + diffX;
      
      // Clamp values
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

    // Snap logic
    if (offsetX < -40) {
      setOffsetX(-80);
    } else if (offsetX > 40) {
      setOffsetX(80);
    } else {
      setOffsetX(0);
    }
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  // Mouse Handlers
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      // Only prevent default if we are SWIPING. If scrolling, allow default.
      if (interactionType.current === 'swipe') {
        e.preventDefault(); 
      }
      handleMove(e.clientX, e.clientY);
    }
  };
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => {
    if (isDragging.current) handleEnd();
  };

  return (
    <div className="relative mb-3 h-24 rounded-2xl bg-[#1c1c1e] overflow-hidden select-none cursor-grab active:cursor-grabbing">
      {/* Background (Buttons) */}
      <div className={`absolute inset-0 flex justify-between rounded-2xl transition-all duration-200 ${offsetX === 0 ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
         {/* Left Side (Edit) - Visible when swiping Right */}
         <button
          onClick={() => {
             onEdit(tx);
             setOffsetX(0);
          }}
          className="w-20 h-full flex items-center justify-center bg-yellow-600 text-white hover:bg-yellow-700 transition-colors pl-2"
        >
          <Edit2 className="w-6 h-6" />
        </button>

        {/* Right Side (Delete) - Visible when swiping Left */}
        <button
          onClick={() => onDelete(tx.id)}
          className="w-20 h-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-colors pr-2"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      {/* Foreground (Card) */}
      <div 
        className="relative bg-[#1c1c1e] h-full px-5 flex items-center justify-between border border-white/5 shadow-lg shadow-black/20 touch-pan-y transition-transform duration-200 ease-out z-10 rounded-2xl"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex items-center gap-4 pointer-events-none">
          {/* Logo */}
          <div className="relative scale-90">
            <TransactionIcon type={tx.logoType} />
          </div>
          
          {/* Info */}
          <div className="pointer-events-auto flex flex-col items-start justify-center h-full pt-1">
            <span className={`font-bold text-base transition-colors block leading-none mb-1 ${tx.paid ? 'text-white/60 line-through decoration-white/30' : 'text-white'}`}>
              {tx.name}
            </span>

            {/* Date Display (Tiny) */}
            {!tx.paid && (
              <span className="text-[10px] text-gray-500 font-medium uppercase">
                Vence: <span className="text-gray-400">{formatDateDisplay(tx.date)}</span>
              </span>
            )}
            
            {/* Payment Method Badge - Clickable - ONLY VISIBLE IF PAID */}
            {tx.paid && (
              <div 
                 onClick={(e) => {
                   e.stopPropagation();
                   onTogglePaymentMethod(tx.id);
                 }}
                 className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase cursor-pointer hover:opacity-80 active:scale-95 transition-all select-none ${
                 tx.paymentMethod === 'pix'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                 {tx.paymentMethod === 'pix' ? <QrCode className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                 {tx.paymentMethod === 'pix' ? 'PIX' : 'CARD'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Group: Amount + Toggle */}
        <div className="flex items-center gap-3">
          {/* Amount & Badge */}
          <div className="flex flex-col items-end gap-0.5 pointer-events-none">
            <span className={`text-base font-bold tabular-nums transition-colors ${tx.paid ? 'text-white/50' : 'text-white'}`}>
              R$ {tx.amount.toFixed(2).replace('.', ',')}
            </span>
            
            <div className={`px-1.5 py-px rounded-full text-[8px] font-bold uppercase tracking-wide transition-opacity ${
              tx.paid ? 'opacity-50' : 'opacity-100'
            } ${
              tx.type === 'subscription' 
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                : 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20'
            }`}>
              {typeTranslation[tx.type]}
            </div>
          </div>

          {/* Paid Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent affecting swipe
              onToggleStatus(tx.id);
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on button click
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 cursor-pointer ${
              tx.paid 
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
};

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, onToggleStatus, onTogglePaymentMethod }) => {
  return (
    <div className="mt-6 flex flex-col pb-32">
      <h2 className="text-xl font-medium text-gray-400 mb-4 pl-1">CONTAS</h2>
      
      {transactions.map((tx) => (
        <SwipeableTransactionItem 
          key={tx.id} 
          tx={tx} 
          onDelete={onDelete} 
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onTogglePaymentMethod={onTogglePaymentMethod}
        />
      ))}
    </div>
  );
};

export default TransactionList;
