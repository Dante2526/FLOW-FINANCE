
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
      // Allow changing operator if we haven't typed the next number yet
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
    return operator ? `${previousValue} ${opDisplay}` : '';
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
    const baseStyles = "h-16 rounded-[1.2rem] text-2xl font-bold flex items-center justify-center transition-all active:scale-95";
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
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-6 pb-12 sm:pb-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Calculadora</h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Display */}
        <div className="bg-[#0a0a0b] p-6 rounded-[1.5rem] flex flex-col items-end justify-center h-32 overflow-hidden">
          {/* History Line */}
          <span className="text-gray-400 text-xl font-medium h-8 flex items-center mb-1">
            {getHistoryDisplay()}
          </span>
          {/* Main Result */}
          <span className="text-5xl font-bold text-white tracking-tight truncate w-full text-right">
            {display}
          </span>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          <Button label="C" onClick={clear} variant="gray" className="text-red-400" />
          <Button label="÷" onClick={() => performOperation('/')} variant="gray" className="text-accent" />
          <Button label="×" onClick={() => performOperation('*')} variant="gray" className="text-accent" />
          <Button label={<Delete className="w-6 h-6" />} onClick={handleDelete} variant="gray" />

          <Button label="7" onClick={() => inputDigit('7')} />
          <Button label="8" onClick={() => inputDigit('8')} />
          <Button label="9" onClick={() => inputDigit('9')} />
          <Button label="-" onClick={() => performOperation('-')} variant="gray" className="text-accent" />

          <Button label="4" onClick={() => inputDigit('4')} />
          <Button label="5" onClick={() => inputDigit('5')} />
          <Button label="6" onClick={() => inputDigit('6')} />
          <Button label="+" onClick={() => performOperation('+')} variant="gray" className="text-accent" />

          <div className="col-span-3 grid grid-cols-3 gap-3">
            <Button label="1" onClick={() => inputDigit('1')} />
            <Button label="2" onClick={() => inputDigit('2')} />
            <Button label="3" onClick={() => inputDigit('3')} />
            <Button label="0" onClick={() => inputDigit('0')} className="col-span-2 w-full" />
            <Button label="." onClick={inputDot} />
          </div>
          
          <Button 
            label="=" 
            onClick={handleEquals} 
            variant="accent" 
            className="h-full row-span-2" 
          />
        </div>

      </div>
    </div>
  );
};

export default CalculatorModal;
