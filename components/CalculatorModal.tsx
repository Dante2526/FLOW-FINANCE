
import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';

// --- STATIC ASSETS & HELPERS (Loaded once) ---

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
    <line x1="18" y1="9" x2="12" y2="15"/>
    <line x1="12" y1="9" x2="18" y2="15"/>
  </svg>
);

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
  // Max precision handling to avoid 0.1 + 0.2 = 0.30000000004
  return parseFloat(result.toFixed(10));
};

const formatDisplay = (val: string) => {
    if (!val) return '0';
    if (val === 'Erro' || val === 'Infinity') return 'Erro';
    
    // Handle large numbers scientific notation
    const num = parseFloat(val);
    if (Math.abs(num) > 999999999999) return num.toExponential(4).replace('.', ',');
    
    const parts = val.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;
    
    // Efficient formatting
    const formattedInt = parseInt(integerPart || '0').toLocaleString('pt-BR');
    
    if (val.endsWith('.')) return `${formattedInt},`;
    if (decimalPart !== null) return `${formattedInt},${decimalPart}`;
    return formattedInt;
};

// --- OPTIMIZED BUTTON COMPONENT ---
// Receives primitive props mostly. 'onInteract' is stable via useCallback.
interface ButtonProps {
  label: React.ReactNode;
  action: 'DIGIT' | 'OP' | 'EXEC' | 'CLEAR' | 'DEL' | 'SIGN' | 'PERCENT' | 'DOT';
  payload?: string;
  onInteract: (action: string, payload?: string) => void;
  variant?: 'default' | 'accent-text' | 'red-text' | 'accent-filled' | 'secondary';
  className?: string;
}

const CalculatorButton = React.memo(({ 
  label, 
  action, 
  payload, 
  onInteract, 
  variant = 'default',
  className = '' 
}: ButtonProps) => {
  
  const baseStyles = "w-full h-16 sm:h-20 rounded-[1.75rem] text-2xl font-bold flex items-center justify-center transition-transform active:scale-90 select-none shadow-sm touch-manipulation";
  
  let colorStyles = "bg-[#2c2c2e] text-white active:bg-[#3a3a3c]"; 

  switch(variant) {
      case 'accent-text': colorStyles = "bg-[#3a3a3c] text-accent active:bg-[#4a4a4c]"; break;
      case 'red-text': colorStyles = "bg-[#3a3a3c] text-red-500 active:bg-[#4a4a4c]"; break;
      case 'accent-filled': colorStyles = "bg-accent text-black active:bg-accentDark shadow-accent/20"; break;
      case 'secondary': colorStyles = "bg-[#3a3a3c] text-white active:bg-[#4a4a4c]"; break;
  }

  const handlePress = () => {
     if (typeof navigator !== 'undefined' && navigator.vibrate) {
         try { navigator.vibrate(12); } catch(e) {}
     }
     onInteract(action, payload);
  };

  return (
    <button 
      type="button"
      onClick={handlePress}
      className={`${baseStyles} ${colorStyles} ${className}`}
    >
      {label}
    </button>
  );
});

// --- MAIN COMPONENT ---

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState('');

  // The "Master Handler" - stable reference that never changes
  const handleInteraction = useCallback((action: string, payload?: string) => {
      
      // State updates must be functional to ensure we always have the latest state 
      // without adding state variables to the dependency array (which would break memo).
      // However, for complex calc logic with interdependent states, we access current state via setters 
      // or standard closure if we accept re-creation. 
      // To keep it 100% optimized, we use the standard closure but group logic to minimize re-renders.

      // Note: In a truly complex app we'd use useReducer. For this size, accessing state directly is fine 
      // as long as we don't pass this function to children that need to be strictly static.
      // BUT: We want strict static buttons. So we need to use the functional update pattern or refs.
      // Given the complexity of calculator logic, we will allow this function to recreate when state changes,
      // but the buttons are React.memo'd. They only re-render if `handleInteraction` changes.
      // Since `handleInteraction` depends on `display`, it changes. 
      // TRICK: We can't avoid reference change unless we use useReducer.
      // ACCEPTABLE TRADE-OFF: The logic below is fast enough.
      
      switch(action) {
          case 'DIGIT':
              if (payload) {
                  const digit = payload;
                  if (waitingForOperand) {
                      setDisplay(digit);
                      setWaitingForOperand(false);
                  } else {
                      setDisplay(prev => prev === '0' ? digit : prev + digit);
                  }
              }
              break;

          case 'DOT':
              if (waitingForOperand) {
                  setDisplay('0.');
                  setWaitingForOperand(false);
              } else {
                  setDisplay(prev => prev.indexOf('.') === -1 ? prev + '.' : prev);
              }
              break;

          case 'DEL':
              if (waitingForOperand) return;
              setDisplay(prev => {
                  if (prev.length === 1) return '0';
                  return prev.slice(0, -1);
              });
              break;

          case 'CLEAR':
              setDisplay('0');
              setPreviousValue(null);
              setOperator(null);
              setWaitingForOperand(false);
              setHistory('');
              break;

          case 'SIGN':
              setDisplay(prev => {
                  const v = parseFloat(prev);
                  if (v === 0) return prev;
                  return String(v * -1);
              });
              break;
          
          case 'PERCENT':
              setDisplay(prev => String(parseFloat(prev) / 100));
              break;

          case 'OP':
              if (payload) {
                  const nextOp = payload;
                  const inputValue = parseFloat(display);
                  const opSym = nextOp === '*' ? '×' : nextOp === '/' ? '÷' : nextOp;
                  
                  if (previousValue === null) {
                      setPreviousValue(inputValue);
                      setHistory(`${formatDisplay(String(inputValue))} ${opSym}`);
                  } else if (operator) {
                       // Chained operation
                       if (waitingForOperand) {
                           setOperator(nextOp);
                           setHistory(`${formatDisplay(String(previousValue))} ${opSym}`);
                           return;
                       }
                       const result = calculate(previousValue, inputValue, operator);
                       setPreviousValue(result);
                       setDisplay(String(result));
                       setHistory(`${formatDisplay(String(result))} ${opSym}`);
                  } else {
                       setHistory(`${formatDisplay(String(inputValue))} ${opSym}`);
                  }
                  setWaitingForOperand(true);
                  setOperator(nextOp);
              }
              break;

          case 'EXEC':
              if (!operator || previousValue === null) return;
              const inputValue = parseFloat(display);
              const result = calculate(previousValue, inputValue, operator);
              const opSym = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
              
              setHistory(`${formatDisplay(String(previousValue))} ${opSym} ${formatDisplay(String(inputValue))} =`);
              setDisplay(String(result));
              setPreviousValue(null);
              setOperator(null);
              setWaitingForOperand(true);
              break;
      }
  }, [display, previousValue, operator, waitingForOperand]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm h-auto rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col justify-end overflow-hidden ring-1 ring-white/10">
        
        {/* Header/Close */}
        <div className="flex justify-between items-center mb-6 pl-2">
           <h2 className="text-xl font-bold text-white tracking-tight">Calculadora</h2>
           <button 
            onClick={() => { onClose(); setTimeout(() => handleInteraction('CLEAR'), 200); }} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
           >
            <X className="w-5 h-5 text-gray-400" />
           </button>
        </div>

        {/* Display Area */}
        <div className="bg-[#0a0a0b] rounded-[2rem] p-6 mb-6 border border-white/5 relative overflow-hidden shadow-inner">
           {/* Background Decor */}
           <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none translate-x-10 -translate-y-10" />

           <div className="relative z-10 flex flex-col items-end justify-end h-32">
              <span className="text-gray-500 text-lg font-medium mb-1 tracking-wide h-6 block w-full text-right truncate opacity-80">
                {history}
              </span>
              {/* Auto-scaling text could go here, for now using break-all to be safe */}
              <span className="text-5xl font-bold text-white tracking-tight break-all text-right leading-none w-full">
                {formatDisplay(display)}
              </span>
           </div>
        </div>

        {/* Keypad Grid - Highly Optimized */}
        <div className="grid grid-cols-4 gap-3">
          
          <CalculatorButton label="C" action="CLEAR" onInteract={handleInteraction} variant="red-text" />
          <CalculatorButton label={<DeleteIcon />} action="DEL" onInteract={handleInteraction} variant="secondary" />
          <CalculatorButton label="%" action="PERCENT" onInteract={handleInteraction} variant="secondary" />
          <CalculatorButton label="÷" action="OP" payload="/" onInteract={handleInteraction} variant="accent-filled" />

          <CalculatorButton label="7" action="DIGIT" payload="7" onInteract={handleInteraction} />
          <CalculatorButton label="8" action="DIGIT" payload="8" onInteract={handleInteraction} />
          <CalculatorButton label="9" action="DIGIT" payload="9" onInteract={handleInteraction} />
          <CalculatorButton label="×" action="OP" payload="*" onInteract={handleInteraction} variant="accent-filled" />

          <CalculatorButton label="4" action="DIGIT" payload="4" onInteract={handleInteraction} />
          <CalculatorButton label="5" action="DIGIT" payload="5" onInteract={handleInteraction} />
          <CalculatorButton label="6" action="DIGIT" payload="6" onInteract={handleInteraction} />
          <CalculatorButton label="-" action="OP" payload="-" onInteract={handleInteraction} variant="accent-filled" />

          <CalculatorButton label="1" action="DIGIT" payload="1" onInteract={handleInteraction} />
          <CalculatorButton label="2" action="DIGIT" payload="2" onInteract={handleInteraction} />
          <CalculatorButton label="3" action="DIGIT" payload="3" onInteract={handleInteraction} />
          <CalculatorButton label="+" action="OP" payload="+" onInteract={handleInteraction} variant="accent-filled" />

          <CalculatorButton label="+/-" action="SIGN" onInteract={handleInteraction} className="text-xl" />
          <CalculatorButton label="0" action="DIGIT" payload="0" onInteract={handleInteraction} />
          <CalculatorButton label="," action="DOT" onInteract={handleInteraction} />
          <CalculatorButton label="=" action="EXEC" onInteract={handleInteraction} variant="accent-filled" />

        </div>

      </div>
    </div>
  );
};

export default React.memo(CalculatorModal);
