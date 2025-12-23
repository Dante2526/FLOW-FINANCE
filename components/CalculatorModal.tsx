
import React, { useState, useCallback } from 'react';
import { X, Delete } from 'lucide-react';

// Interface otimizada para evitar funções anônimas no render
interface ButtonProps {
  label: React.ReactNode;
  onClick: (val?: any) => void;
  param?: any; // Parâmetro estável para passar ao onClick
  variant?: 'default' | 'accent-text' | 'red-text' | 'accent-filled' | 'secondary';
  className?: string;
}

// Extracted & Memoized Component for Maximum Performance
const CalculatorButton = React.memo(({ 
  label, 
  onClick, 
  param,
  variant = 'default',
  className = '' 
}: ButtonProps) => {
  // touch-action: none remove delay de 300ms em mobile
  const baseStyles = "w-full h-16 sm:h-20 rounded-[1.5rem] text-2xl font-bold flex items-center justify-center transition-transform duration-100 active:scale-90 select-none shadow-md touch-none will-change-transform";
  
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

  const handleClick = (e: React.PointerEvent<HTMLButtonElement>) => {
      // Previne comportamentos fantasmas de mouse em telas touch
      e.preventDefault();
      
      // Otimização Tátil: Vibração curta e seca (10ms)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(10); } catch(e) {}
      }
      
      // Chama a função passando o parâmetro (se existir)
      onClick(param);
  };

  return (
    <button 
      type="button"
      onPointerDown={handleClick} // Pointer events são mais rápidos que onClick em mobile
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

  // Wrapped in useCallback to act as a stable handler
  const inputDigit = useCallback((digit: string) => {
    // Usando functional updates onde possível para garantir estado fresco
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => prev === '0' ? digit : prev + digit);
    }
  }, [waitingForOperand]);

  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => prev.indexOf('.') === -1 ? prev + '.' : prev);
    }
  }, [waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHistoryLine('');
  }, []);

  const handleClose = useCallback(() => {
      onClose();
      setTimeout(clear, 200); 
  }, [onClose, clear]);

  const handleDelete = useCallback(() => {
    if (waitingForOperand) return;
    setDisplay(prev => {
        if (prev.length === 1) return '0';
        return prev.slice(0, -1);
    });
  }, [waitingForOperand]);

  const toggleSign = useCallback(() => {
    setDisplay(prev => {
        const value = parseFloat(prev);
        if (value === 0) return prev;
        return String(value * -1);
    });
  }, []);

  const percentage = useCallback(() => {
    setDisplay(prev => {
        const value = parseFloat(prev);
        return String(value / 100);
    });
  }, []);

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
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
           >
            <X className="w-5 h-5 text-gray-400" />
           </button>
        </div>

        {/* Display Area */}
        <div className="bg-[#0a0a0b] rounded-[2rem] p-6 mb-6 border border-white/5 relative overflow-hidden">
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
          <CalculatorButton label={<Delete className="w-6 h-6" />} onClick={handleDelete} variant="secondary" />
          <CalculatorButton label="%" onClick={percentage} variant="secondary" />
          <CalculatorButton label="÷" onClick={performOperation} param="/" variant="accent-filled" />

          <CalculatorButton label="7" onClick={inputDigit} param="7" />
          <CalculatorButton label="8" onClick={inputDigit} param="8" />
          <CalculatorButton label="9" onClick={inputDigit} param="9" />
          <CalculatorButton label="×" onClick={performOperation} param="*" variant="accent-filled" />

          <CalculatorButton label="4" onClick={inputDigit} param="4" />
          <CalculatorButton label="5" onClick={inputDigit} param="5" />
          <CalculatorButton label="6" onClick={inputDigit} param="6" />
          <CalculatorButton label="-" onClick={performOperation} param="-" variant="accent-filled" />

          <CalculatorButton label="1" onClick={inputDigit} param="1" />
          <CalculatorButton label="2" onClick={inputDigit} param="2" />
          <CalculatorButton label="3" onClick={inputDigit} param="3" />
          <CalculatorButton label="+" onClick={performOperation} param="+" variant="accent-filled" />

          <CalculatorButton label="+/-" onClick={toggleSign} className="text-xl" />
          <CalculatorButton label="0" onClick={inputDigit} param="0" />
          <CalculatorButton label="," onClick={inputDot} />
          <CalculatorButton label="=" onClick={handleEquals} variant="accent-filled" />

        </div>

      </div>
    </div>
  );
};

export default React.memo(CalculatorModal);
