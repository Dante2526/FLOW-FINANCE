
import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';

// Custom Delete Icon to ensure it always renders without crashing
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
    <line x1="18" y1="9" x2="12" y2="15"/>
    <line x1="12" y1="9" x2="18" y2="15"/>
  </svg>
);

// Pure calculation logic extracted
const calculate = (first: number, second: number, op: string) => {
  let result = 0;
  switch (op) {
    case '+': result = first + second; break;
    case '-': result = first - second; break;
    case '*': result = first * second; break;
    case '/': 
      if (second === 0) return Infinity;
      result = first / second; 
      break;
    default: return second;
  }
  return parseFloat(result.toFixed(10));
};

// Formatter extracted
const getFormattedDisplay = (val: string) => {
    if (!val) return '0';
    if (val === 'Erro') return 'Erro';
    const num = parseFloat(val);
    if (Math.abs(num) > 999999999999) return num.toExponential(4).replace('.', ',');
    
    const parts = val.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;
    const formattedInt = parseInt(integerPart || '0').toLocaleString('pt-BR');
    
    if (val.endsWith('.')) return `${formattedInt},`;
    if (decimalPart !== null) return `${formattedInt},${decimalPart}`;
    return formattedInt;
  };

interface ButtonProps {
  label: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'accent-text' | 'red-text' | 'accent-filled' | 'secondary';
  className?: string;
}

// Memoized Button Component
const CalculatorButton = React.memo(({ 
  label, 
  onClick, 
  variant = 'default',
  className = '' 
}: ButtonProps) => {
  // touch-manipulation: removes 300ms delay on mobile browsers
  const baseStyles = "w-full h-16 sm:h-20 rounded-[1.5rem] text-2xl font-bold flex items-center justify-center transition-transform active:scale-90 select-none shadow-md touch-manipulation";
  
  let colorStyles = "bg-[#2c2c2e] text-white active:bg-[#3a3a3c]"; 

  if (variant === 'accent-text') {
    colorStyles = "bg-[#3a3a3c] text-accent active:bg-[#4a4a4c]";
  } else if (variant === 'red-text') {
    colorStyles = "bg-[#3a3a3c] text-red-500 active:bg-[#4a4a4c]";
  } else if (variant === 'accent-filled') {
    colorStyles = "bg-accent text-black active:bg-accentDark shadow-accent/20";
  } else if (variant === 'secondary') {
    colorStyles = "bg-[#3a3a3c] text-white active:bg-[#4a4a4c]";
  }

  const handleClick = (e: React.MouseEvent) => {
     // Trigger vibration on click if available
     if (typeof navigator !== 'undefined' && navigator.vibrate) {
         try { navigator.vibrate(10); } catch(err) {}
     }
     onClick();
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${colorStyles} ${className}`}
    >
      {label}
    </button>
  );
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [historyLine, setHistoryLine] = useState('');

  if (!isOpen) return null;

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => prev === '0' ? digit : prev + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => prev.indexOf('.') === -1 ? prev + '.' : prev);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHistoryLine('');
  };

  const handleClose = () => {
      onClose();
      // Ensure we clear state safely after animation starts
      setTimeout(() => clear(), 200); 
  };

  const handleDelete = () => {
    if (waitingForOperand) return;
    setDisplay(prev => {
        if (prev.length === 1) return '0';
        return prev.slice(0, -1);
    });
  };

  const toggleSign = () => {
    setDisplay(prev => {
        const value = parseFloat(prev);
        if (value === 0) return prev;
        return String(value * -1);
    });
  };

  const percentage = () => {
    setDisplay(prev => {
        const value = parseFloat(prev);
        return String(value / 100);
    });
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    const opSymbol = nextOperator === '*' ? '×' : nextOperator === '/' ? '÷' : nextOperator;

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setHistoryLine(`${getFormattedDisplay(String(inputValue))} ${opSymbol}`);
    } else if (operator) {
      if (waitingForOperand) {
        setOperator(nextOperator);
        setHistoryLine(`${getFormattedDisplay(String(previousValue))} ${opSymbol}`);
        return;
      }

      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      
      setPreviousValue(newValue);
      setDisplay(String(newValue));
      setHistoryLine(`${getFormattedDisplay(String(newValue))} ${opSymbol}`);
    } else {
       setHistoryLine(`${getFormattedDisplay(String(inputValue))} ${opSymbol}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    if (!operator || previousValue === null) return;
    
    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operator);
    
    const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
    setHistoryLine(`${getFormattedDisplay(String(previousValue))} ${opSymbol} ${getFormattedDisplay(String(inputValue))}`);

    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm h-auto rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col justify-end overflow-hidden">
        
        {/* Header/Close */}
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-white ml-2">Calculadora</h2>
           <button 
            onClick={handleClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
           >
            <X className="w-5 h-5 text-gray-400" />
           </button>
        </div>

        {/* Display Area */}
        <div className="bg-[#0a0a0b] rounded-[2rem] p-6 mb-6 border border-white/5 relative overflow-hidden">
           {/* Background Decor */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

           <div className="relative z-10 flex flex-col items-end justify-end h-32">
              <span className="text-gray-500 text-lg font-medium mb-1 tracking-wide h-6 block">
                {historyLine}
              </span>
              <span className="text-5xl font-bold text-white tracking-tight break-all text-right leading-none">
                {getFormattedDisplay(display)}
              </span>
           </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-3">
          
          <CalculatorButton label="C" onClick={clear} variant="red-text" />
          <CalculatorButton label={<DeleteIcon />} onClick={handleDelete} variant="secondary" />
          <CalculatorButton label="%" onClick={percentage} variant="secondary" />
          <CalculatorButton label="÷" onClick={() => performOperation('/')} variant="accent-filled" />

          <CalculatorButton label="7" onClick={() => inputDigit('7')} />
          <CalculatorButton label="8" onClick={() => inputDigit('8')} />
          <CalculatorButton label="9" onClick={() => inputDigit('9')} />
          <CalculatorButton label="×" onClick={() => performOperation('*')} variant="accent-filled" />

          <CalculatorButton label="4" onClick={() => inputDigit('4')} />
          <CalculatorButton label="5" onClick={() => inputDigit('5')} />
          <CalculatorButton label="6" onClick={() => inputDigit('6')} />
          <CalculatorButton label="-" onClick={() => performOperation('-')} variant="accent-filled" />

          <CalculatorButton label="1" onClick={() => inputDigit('1')} />
          <CalculatorButton label="2" onClick={() => inputDigit('2')} />
          <CalculatorButton label="3" onClick={() => inputDigit('3')} />
          <CalculatorButton label="+" onClick={() => performOperation('+')} variant="accent-filled" />

          <CalculatorButton label="+/-" onClick={toggleSign} className="text-xl" />
          <CalculatorButton label="0" onClick={() => inputDigit('0')} />
          <CalculatorButton label="," onClick={inputDot} />
          <CalculatorButton label="=" onClick={handleEquals} variant="accent-filled" />

        </div>

      </div>
    </div>
  );
};

export default React.memo(CalculatorModal);
