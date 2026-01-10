import React, { useState, useRef } from 'react';
import { Account, CardTheme, AppLanguage } from '../types';
import { Trash2, Edit2, GripVertical } from 'lucide-react';
import { getLocale } from '../i18n';

interface Props {
  account: Account;
  onDelete: (id: string) => void;
  onEdit: (account: Account) => void;
  // DnD Props
  draggable?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnter?: (id: string) => void;
  onDragEnd?: () => void;
  appLanguage?: AppLanguage;
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
      // UPDATED: Changed from text-gray-400 to text-white/90 for better visibility as requested
      return 'text-white/90 font-bold';
    default:
      return 'text-white/90 font-bold';
  }
};

const SecondaryCard: React.FC<Props> = ({ 
  account, 
  onDelete, 
  onEdit,
  draggable,
  onDragStart,
  onDragEnter,
  onDragEnd,
  appLanguage = 'pt'
}) => {
  const [offsetX, setOffsetX] = useState(0);
  
  // Refs to track gestures
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const interactionType = useRef<'scroll' | 'swipe' | null>(null);

  const themeClass = getThemeStyles(account.colorTheme);
  const labelClass = getLabelStyles(account.colorTheme);
  const locale = getLocale(appLanguage as AppLanguage);

  // Unified Handler Logic
  const handleStart = (clientX: number, clientY: number, target: EventTarget | null) => {
    // Prevent swipe logic if user touches the drag handle
    if (target && (target as HTMLElement).closest('.drag-handle')) {
        return;
    }

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
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  // Mouse Handlers
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY, e.target);
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

  // Native DnD Handlers
  const handleDragStart = (e: React.DragEvent) => {
     if (onDragStart) onDragStart(account.id);
  };

  const handleDragEnter = (e: React.DragEvent) => {
     if (onDragEnter) onDragEnter(account.id);
  };

  // Manual Touch Move for Android
  const handleManualTouchMove = (e: React.TouchEvent) => {
     const touch = e.touches[0];
     // Use clientX/Y to check elements under the finger
     const element = document.elementFromPoint(touch.clientX, touch.clientY);
     
     // Look for the closest card container with data-card-id
     const cardRow = element?.closest('[data-card-id]');
     
     if (cardRow) {
        const targetId = cardRow.getAttribute('data-card-id');
        // Only trigger enter if target is different from source
        if (targetId && targetId !== account.id && onDragEnter) {
           onDragEnter(targetId);
        }
     }
  };

  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  return (
    <div 
      data-card-id={account.id}
      data-tour-id="account-card"
      className="relative w-full h-40 rounded-[2.5rem] overflow-hidden select-none will-change-transform"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
    >
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
        className={`relative w-full h-full rounded-[2.5rem] p-6 shadow-lg shadow-black/20 border transition-transform duration-200 ease-out z-10 touch-pan-y ${themeClass}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex h-full items-center justify-between">
            <div className="flex flex-col justify-center">
                <span className={`text-lg uppercase tracking-wide mb-2 ${labelClass}`}>
                {account.name}
                </span>
                <h2 className="text-4xl font-bold tracking-tight drop-shadow-sm">
                {currencySymbol} {account.balance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
            </div>

            {/* Drag Handle - Right Side */}
            {draggable && (
                <div 
                    className="drag-handle p-4 -mr-4 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity touch-none"
                    style={{ touchAction: 'none' }}
                    draggable={true}
                    onDragStart={handleDragStart}
                    onDragEnd={onDragEnd}
                    // Prevent propagation to swipe handlers
                    onMouseDown={(e) => e.stopPropagation()} 
                    // Manual Touch Handling for Android
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        if (onDragStart) onDragStart(account.id);
                    }}
                    onTouchMove={(e) => {
                        e.stopPropagation();
                        handleManualTouchMove(e);
                    }}
                    onTouchEnd={(e) => {
                        e.stopPropagation();
                        if (onDragEnd) onDragEnd();
                    }}
                >
                    <GripVertical className="w-6 h-6 text-white/70" />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when other cards update
export default React.memo(SecondaryCard);