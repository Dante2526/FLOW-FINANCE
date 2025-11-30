
import React, { useState, useRef } from 'react';
import { Account, CardTheme } from '../types';
import { Trash2, Edit2 } from 'lucide-react';

interface Props {
  account: Account;
  onDelete: (id: string) => void;
  onEdit: (account: Account) => void;
}

const getThemeStyles = (theme: CardTheme) => {
  switch (theme) {
    case 'lime':
      // Changed from #dfff4f to #65a30d (Verde Cana) for better white text visibility
      return 'bg-[#65a30d] text-white border-transparent';
    case 'purple':
      return 'bg-purple-600 text-white border-transparent';
    case 'blue':
      return 'bg-blue-600 text-white border-transparent';
    case 'orange':
      return 'bg-orange-500 text-white border-transparent';
    case 'red':
      return 'bg-red-600 text-white border-transparent';
    case 'default':
    default:
      return 'bg-[#1c1c1e] text-white border-white/5';
  }
};

const getLabelStyles = (theme: CardTheme) => {
  switch (theme) {
    case 'lime':
      return 'text-white font-extrabold drop-shadow-sm';
    case 'default':
      return 'text-gray-400 font-bold';
    default:
      return 'text-white/90 font-bold';
  }
};

const SecondaryCard: React.FC<Props> = ({ account, onDelete, onEdit }) => {
  const [offsetX, setOffsetX] = useState(0);
  
  // Refs to track gestures
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const interactionType = useRef<'scroll' | 'swipe' | null>(null);

  const themeClass = getThemeStyles(account.colorTheme);
  const labelClass = getLabelStyles(account.colorTheme);

  // Unified Handler Logic
  const handleStart = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    startOffset.current = offsetX;
    isDragging.current = true;
    interactionType.current = null;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
    
    // If locked to scroll, ignore drag
    if (interactionType.current === 'scroll') return;

    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;

    // Direction Locking Logic
    if (interactionType.current === null) {
       // Small threshold
       if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) return;

       if (Math.abs(diffY) > Math.abs(diffX)) {
         interactionType.current = 'scroll';
         return;
       } else {
         interactionType.current = 'swipe';
       }
    }
    
    // Perform Swipe
    if (interactionType.current === 'swipe') {
      const newOffset = startOffset.current + diffX;
      // Limits: -100 (Left/Delete) to +100 (Right/Edit)
      if (newOffset < -100) setOffsetX(-100);
      else if (newOffset > 100) setOffsetX(100);
      else setOffsetX(newOffset);
    }
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startX.current = null;
    startY.current = null;
    interactionType.current = null;

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
    <div className="relative mb-4 w-full h-40 rounded-[2.5rem] overflow-hidden select-none cursor-grab active:cursor-grabbing">
      {/* Background Layer */}
      <div className={`absolute inset-0 flex justify-between transition-all duration-200 ${offsetX === 0 ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
        
        {/* Left Side (Edit) - Visible when swiping Right */}
        <button
          onClick={() => {
            onEdit(account);
            setOffsetX(0);
          }}
          className="w-24 h-full bg-yellow-600 flex items-center justify-center text-white pl-4"
        >
          <Edit2 className="w-6 h-6" />
        </button>

        {/* Right Side (Delete) - Visible when swiping Left */}
        <button
          onClick={() => onDelete(account.id)}
          className="w-24 h-full bg-red-600 flex items-center justify-center text-white pr-4"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      {/* Foreground Card */}
      <div 
        className={`relative w-full h-full rounded-[2.5rem] p-6 flex flex-col justify-center shadow-lg shadow-black/20 border transition-transform duration-200 ease-out z-10 touch-pan-y ${themeClass}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <span className={`text-lg uppercase tracking-wide mb-2 ${labelClass}`}>
          {account.name}
        </span>
        <h2 className="text-4xl font-bold tracking-tight drop-shadow-sm">
          R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
      </div>
    </div>
  );
};

export default SecondaryCard;
