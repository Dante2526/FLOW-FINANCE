import React, { useState } from 'react';
import { X, Delete } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  if (!isOpen) return null;

  // Format display value: 1000.5 -> 1.000,5
  const getFormattedDisplay = (val: string) => {
    if (!val) return '0';
    const parts = val.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;
    
    // Format integer with thousands dots
    const formattedInt = parseInt(integerPart || '0').toLocaleString('pt-BR');
    
    if (val.endsWith('.')) {
      return `${formattedInt},`;
    }
    if (decimalPart !== null) {
      return `${formattedInt},${decimalPart}`;
    }
    return formattedInt;
  };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleClose = () => {
      onClose();
      // Small delay to clear state after animation starts or finishes, 
      // preventing flicker, but mainly to reset for next open.
      setTimeout(clear, 200); 
  };

  const handleDelete = () => {
    if (waitingForOperand) return;
    
    if (display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      if (waitingForOperand) {
        setOperator(nextOperator);
        return;
      }

      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      setPreviousValue(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (first: number, second: number, op: string) => {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '*': return first * second;
      case '/': return first / second;
      default: return second;
    }
  };

  const handleEquals = () => {
    if (!operator || previousValue === null) return;
    
    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operator);
    
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const getHistoryDisplay = () => {
    if (previousValue === null) return '';
    const opDisplay = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
    const formattedPrev = previousValue.toLocaleString('pt-BR', { maximumFractionDigits: 10 });
    return operator ? `${formattedPrev} ${opDisplay}` : '';
  };

  const Button = ({ 
    label, 
    onClick, 
    variant = 'default',
    className = ''
  }: { 
    label: React.ReactNode, 
    onClick: () => void, 
    variant?: 'default' | 'accent' | 'gray',
    className?: string
  }) => {
    const baseStyles = "h-16 sm:h-20 rounded-2xl text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all active:scale-95";
    const variants = {
      default: "bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]",
      accent: "bg-accent text-black hover:bg-accentDark",
      gray: "bg-[#3a3a3c] text-white hover:bg-[#48484a]"
    };

    return (
      <button 
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]} ${className}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-4 shadow-2xl border border-white/5 relative flex flex-col gap-3 max-h-[95dvh] overflow-hidden">
        
        <div className="flex justify-between items-center shrink-0 px-2">
          <h2 className="text-xl font-bold text-white">Calculadora</h2>
          <button 
            onClick={handleClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="bg-[#0a0a0b] p-4 rounded-[2rem] flex flex-col items-end justify-center h-28 sm:h-36 shrink-0 shadow-inner">
          <span className="text-gray-400 text-lg font-medium h-6 flex items-center mb-1">
            {getHistoryDisplay()}
          </span>
          <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight truncate w-full text-right">
            {getFormattedDisplay(display)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 shrink-0 pb-1">
          <Button label="C" onClick={clear} variant="gray" className="text-red-400" />
          <Button label="÷" onClick={() => performOperation('/')} variant="gray" className="text-accent" />
          <Button label="×" onClick={() => performOperation('*')} variant="gray" className="text-accent" />
          <Button label={<Delete className="w-7 h-7" />} onClick={handleDelete} variant="gray" />

          <Button label="7" onClick={() => inputDigit('7')} />
          <Button label="8" onClick={() => inputDigit('8')} />
          <Button label="9" onClick={() => inputDigit('9')} />
          <Button label="-" onClick={() => performOperation('-')} variant="gray" className="text-accent" />

          <Button label="4" onClick={() => inputDigit('4')} />
          <Button label="5" onClick={() => inputDigit('5')} />
          <Button label="6" onClick={() => inputDigit('6')} />
          <Button label="+" onClick={() => performOperation('+')} variant="gray" className="text-accent" />

          <div className="col-span-3 grid grid-cols-3 gap-2">
            <Button label="1" onClick={() => inputDigit('1')} />
            <Button label="2" onClick={() => inputDigit('2')} />
            <Button label="3" onClick={() => inputDigit('3')} />
            <Button label="0" onClick={() => inputDigit('0')} className="col-span-2 w-full" />
            <Button label="," onClick={inputDot} />
          </div>
          
          <Button 
            label="=" 
            onClick={handleEquals} 
            variant="accent" 
            className="h-full row-span-2 text-4xl" 
          />
        </div>

      </div>
    </div>
  );
};

export default React.memo(CalculatorModal);