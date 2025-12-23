
import React, { useReducer, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';

// --- STATIC ASSETS & HELPERS ---

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
  // Fix floating point issues (e.g. 0.1 + 0.2)
  return parseFloat(result.toFixed(10));
};

const formatDisplay = (val: string) => {
    if (!val) return '0';
    if (val === 'Erro' || val === 'Infinity') return 'Erro';
    
    // Check if number is too large for standard formatting
    const num = parseFloat(val);
    if (Math.abs(num) > 999999999999) return num.toExponential(4).replace('.', ',');
    
    const parts = val.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;
    
    // Format integer part with thousands separators
    const formattedInt = parseInt(integerPart || '0').toLocaleString('pt-BR');
    
    if (val.endsWith('.')) return `${formattedInt},`;
    if (decimalPart !== null) return `${formattedInt},${decimalPart}`;
    return formattedInt;
};

// --- REDUCER LOGIC (PURE & FAST) ---

type CalculatorState = {
  display: string;
  previousValue: number | null;
  operator: string | null;
  waitingForOperand: boolean;
  history: string;
};

type CalculatorAction = {
  type: 'DIGIT' | 'OP' | 'EXEC' | 'CLEAR' | 'DEL' | 'SIGN' | 'PERCENT' | 'DOT';
  payload?: string;
};

const INITIAL_STATE: CalculatorState = {
  display: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  history: ''
};

const calculatorReducer = (state: CalculatorState, action: CalculatorAction): CalculatorState => {
  switch (action.type) {
    case 'DIGIT':
      if (action.payload) {
        if (state.waitingForOperand) {
          return { ...state, display: action.payload, waitingForOperand: false };
        }
        return { 
          ...state, 
          display: state.display === '0' ? action.payload : state.display + action.payload 
        };
      }
      return state;

    case 'DOT':
      if (state.waitingForOperand) {
        return { ...state, display: '0.', waitingForOperand: false };
      }
      if (state.display.indexOf('.') === -1) {
        return { ...state, display: state.display + '.' };
      }
      return state;

    case 'DEL':
      if (state.waitingForOperand) return state;
      if (state.display.length === 1) return { ...state, display: '0' };
      return { ...state, display: state.display.slice(0, -1) };

    case 'CLEAR':
      return INITIAL_STATE;

    case 'SIGN':
      const val = parseFloat(state.display);
      if (val === 0) return state;
      return { ...state, display: String(val * -1) };

    case 'PERCENT':
      return { ...state, display: String(parseFloat(state.display) / 100) };

    case 'OP':
      if (action.payload) {
        const nextOp = action.payload;
        const inputValue = parseFloat(state.display);
        const opSym = nextOp === '*' ? '×' : nextOp === '/' ? '÷' : nextOp;

        if (state.previousValue === null) {
          return {
            ...state,
            previousValue: inputValue,
            history: `${formatDisplay(String(inputValue))} ${opSym}`,
            waitingForOperand: true,
            operator: nextOp
          };
        } else if (state.operator) {
          if (state.waitingForOperand) {
            return {
              ...state,
              operator: nextOp,
              history: `${formatDisplay(String(state.previousValue))} ${opSym}`
            };
          }
          const result = calculate(state.previousValue, inputValue, state.operator);
          return {
            ...state,
            previousValue: result,
            display: String(result),
            history: `${formatDisplay(String(result))} ${opSym}`,
            waitingForOperand: true,
            operator: nextOp
          };
        } else {
           // Fallback edge case
           return {
             ...state,
             previousValue: inputValue,
             history: `${formatDisplay(String(inputValue))} ${opSym}`,
             waitingForOperand: true,
             operator: nextOp
           };
        }
      }
      return state;

    case 'EXEC':
      if (!state.operator || state.previousValue === null) return state;
      const finalInput = parseFloat(state.display);
      const finalResult = calculate(state.previousValue, finalInput, state.operator);
      const finalSym = state.operator === '*' ? '×' : state.operator === '/' ? '÷' : state.operator;
      
      return {
        ...state,
        display: String(finalResult),
        history: `${formatDisplay(String(state.previousValue))} ${finalSym} ${formatDisplay(String(finalInput))} =`,
        previousValue: null,
        operator: null,
        waitingForOperand: true
      };
      
    default:
      return state;
  }
};

// --- OPTIMIZED BUTTON ---

interface ButtonProps {
  label: React.ReactNode;
  action: CalculatorAction['type'];
  payload?: string;
  dispatch: React.Dispatch<CalculatorAction>;
  variant?: 'default' | 'accent-text' | 'red-text' | 'accent-filled' | 'secondary';
  className?: string;
}

const CalculatorButton = React.memo(({ 
  label, 
  action, 
  payload, 
  dispatch, 
  variant = 'default',
  className = '' 
}: ButtonProps) => {
  
  const baseStyles = "w-full h-16 sm:h-20 rounded-[1.75rem] text-2xl font-bold flex items-center justify-center transition-transform active:scale-90 select-none shadow-sm touch-manipulation focus:outline-none";
  
  let colorStyles = "bg-[#2c2c2e] text-white active:bg-[#3a3a3c]"; 

  switch(variant) {
      case 'accent-text': colorStyles = "bg-[#3a3a3c] text-accent active:bg-[#4a4a4c]"; break;
      case 'red-text': colorStyles = "bg-[#3a3a3c] text-red-500 active:bg-[#4a4a4c]"; break;
      case 'accent-filled': colorStyles = "bg-accent text-black active:bg-accentDark shadow-accent/20"; break;
      case 'secondary': colorStyles = "bg-[#3a3a3c] text-white active:bg-[#4a4a4c]"; break;
  }

  // Stable handler
  const handlePress = () => {
     if (typeof navigator !== 'undefined' && navigator.vibrate) {
         try { navigator.vibrate(10); } catch(e) {}
     }
     dispatch({ type: action, payload });
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
  const [state, dispatch] = useReducer(calculatorReducer, INITIAL_STATE);

  // Optimization: Memoize the Delete Icon to prevent unnecessary re-renders of that specific button
  // when the parent re-renders due to display changes.
  const deleteIconNode = useMemo(() => <DeleteIcon />, []);

  // Optimization: Add Keyboard Support for Desktop/Hybrid users
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Numbers
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        dispatch({ type: 'DIGIT', payload: key });
      }
      
      // Operators
      if (['+', '-', '*', '/'].includes(key)) {
        e.preventDefault();
        dispatch({ type: 'OP', payload: key });
      }
      
      // Equals / Enter
      if (key === 'Enter' || key === '=') {
        e.preventDefault();
        dispatch({ type: 'EXEC' });
      }
      
      // Dot / Comma
      if (key === '.' || key === ',') {
        e.preventDefault();
        dispatch({ type: 'DOT' });
      }
      
      // Delete / Backspace
      if (key === 'Backspace') {
        e.preventDefault();
        dispatch({ type: 'DEL' });
      }
      
      // Clear (Escape or C)
      if (key === 'Escape' || key.toLowerCase() === 'c') {
        e.preventDefault();
        if (key === 'Escape') {
             // Optional: Close modal on Esc if you prefer
             // onClose();
             dispatch({ type: 'CLEAR' });
        } else {
             dispatch({ type: 'CLEAR' });
        }
      }
      
      // Percent
      if (key === '%') {
        e.preventDefault();
        dispatch({ type: 'PERCENT' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm h-auto rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col justify-end overflow-hidden ring-1 ring-white/10">
        
        {/* Header/Close */}
        <div className="flex justify-between items-center mb-6 pl-2">
           <h2 className="text-xl font-bold text-white tracking-tight">Calculadora</h2>
           <button 
            onClick={() => { onClose(); setTimeout(() => dispatch({ type: 'CLEAR' }), 200); }} 
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
                {state.history}
              </span>
              <span className="text-5xl font-bold text-white tracking-tight break-all text-right leading-none w-full">
                {formatDisplay(state.display)}
              </span>
           </div>
        </div>

        {/* Keypad Grid - Zero Re-renders for static keys */}
        <div className="grid grid-cols-4 gap-3">
          
          <CalculatorButton label="C" action="CLEAR" dispatch={dispatch} variant="red-text" />
          <CalculatorButton label={deleteIconNode} action="DEL" dispatch={dispatch} variant="secondary" />
          <CalculatorButton label="%" action="PERCENT" dispatch={dispatch} variant="secondary" />
          <CalculatorButton label="÷" action="OP" payload="/" dispatch={dispatch} variant="accent-filled" />

          <CalculatorButton label="7" action="DIGIT" payload="7" dispatch={dispatch} />
          <CalculatorButton label="8" action="DIGIT" payload="8" dispatch={dispatch} />
          <CalculatorButton label="9" action="DIGIT" payload="9" dispatch={dispatch} />
          <CalculatorButton label="×" action="OP" payload="*" dispatch={dispatch} variant="accent-filled" />

          <CalculatorButton label="4" action="DIGIT" payload="4" dispatch={dispatch} />
          <CalculatorButton label="5" action="DIGIT" payload="5" dispatch={dispatch} />
          <CalculatorButton label="6" action="DIGIT" payload="6" dispatch={dispatch} />
          <CalculatorButton label="-" action="OP" payload="-" dispatch={dispatch} variant="accent-filled" />

          <CalculatorButton label="1" action="DIGIT" payload="1" dispatch={dispatch} />
          <CalculatorButton label="2" action="DIGIT" payload="2" dispatch={dispatch} />
          <CalculatorButton label="3" action="DIGIT" payload="3" dispatch={dispatch} />
          <CalculatorButton label="+" action="OP" payload="+" dispatch={dispatch} variant="accent-filled" />

          <CalculatorButton label="+/-" action="SIGN" dispatch={dispatch} className="text-xl" />
          <CalculatorButton label="0" action="DIGIT" payload="0" dispatch={dispatch} />
          <CalculatorButton label="," action="DOT" dispatch={dispatch} />
          <CalculatorButton label="=" action="EXEC" dispatch={dispatch} variant="accent-filled" />

        </div>

      </div>
    </div>
  );
};

export default React.memo(CalculatorModal);
