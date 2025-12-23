
import React, { useState } from 'react';
import { X, Delete, Clock, Ruler, Pi } from 'lucide-react';

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

  // Format display value: 1000.5 -> 1.000,5
  const getFormattedDisplay = (val: string) => {
    if (!val) return '0';
    if (val === 'Erro') return 'Erro';
    
    // Tratamento para números muito grandes ou científicos
    const num = parseFloat(val);
    if (Math.abs(num) > 999999999999) {
       return num.toExponential(4).replace('.', ',');
    }

    const parts = val.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;
    
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
    setHistoryLine('');
  };

  const handleClose = () => {
      onClose();
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

  const toggleSign = () => {
    const value = parseFloat(display);
    if (value === 0) return;
    setDisplay(String(value * -1));
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

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
    // CORREÇÃO DE PRECISÃO: Arredonda para 10 casas decimais para evitar 0.999999...
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

  const Button = ({ 
    label, 
    onClick, 
    variant = 'default',
    className = ''
  }: { 
    label: React.ReactNode, 
    onClick: () => void, 
    variant?: 'default' | 'accent-text' | 'red-text' | 'accent-filled' | 'secondary',
    className?: string
  }) => {
    // Design restaurado: Botões retangulares arredondados (padrão Flow Finance)
    const baseStyles = "w-full h-16 sm:h-20 rounded-[1.5rem] text-2xl font-bold flex items-center justify-center transition-all active:scale-95 select-none shadow-md";
    
    let colorStyles = "bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]"; // Default Number

    if (variant === 'accent-text') {
      colorStyles = "bg-[#3a3a3c] text-accent hover:bg-[#4a4a4c]";
    } else if (variant === 'red-text') {
      colorStyles = "bg-[#3a3a3c] text-red-500 hover:bg-[#4a4a4c]";
    } else if (variant === 'accent-filled') {
      colorStyles = "bg-accent text-black hover:bg-accentDark shadow-accent/20";
    } else if (variant === 'secondary') {
      colorStyles = "bg-[#3a3a3c] text-white hover:bg-[#4a4a4c]";
    }

    return (
      <button 
        onClick={onClick}
        className={`${baseStyles} ${colorStyles} ${className}`}
      >
        {label}
      </button>
    );
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
           {/* Background Decor */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

           <div className="relative z-10 flex flex-col items-end justify-end h-32">
              {/* History / Equation Line */}
              <span className="text-gray-500 text-lg font-medium mb-1 tracking-wide h-6 block">
                {historyLine}
              </span>
              {/* Main Result */}
              <span className="text-5xl font-bold text-white tracking-tight break-all text-right leading-none">
                {getFormattedDisplay(display)}
              </span>
           </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-3">
          
          {/* Row 1 */}
          <Button label="C" onClick={clear} variant="red-text" />
          <Button label={<Delete className="w-6 h-6" />} onClick={handleDelete} variant="secondary" />
          <Button label="%" onClick={percentage} variant="secondary" />
          <Button label="÷" onClick={() => performOperation('/')} variant="accent-filled" />

          {/* Row 2 */}
          <Button label="7" onClick={() => inputDigit('7')} />
          <Button label="8" onClick={() => inputDigit('8')} />
          <Button label="9" onClick={() => inputDigit('9')} />
          <Button label="×" onClick={() => performOperation('*')} variant="accent-filled" />

          {/* Row 3 */}
          <Button label="4" onClick={() => inputDigit('4')} />
          <Button label="5" onClick={() => inputDigit('5')} />
          <Button label="6" onClick={() => inputDigit('6')} />
          <Button label="-" onClick={() => performOperation('-')} variant="accent-filled" />

          {/* Row 4 */}
          <Button label="1" onClick={() => inputDigit('1')} />
          <Button label="2" onClick={() => inputDigit('2')} />
          <Button label="3" onClick={() => inputDigit('3')} />
          <Button label="+" onClick={() => performOperation('+')} variant="accent-filled" />

          {/* Row 5 */}
          <Button label="+/-" onClick={toggleSign} className="text-xl" />
          <Button label="0" onClick={() => inputDigit('0')} />
          <Button label="," onClick={inputDot} />
          <Button label="=" onClick={handleEquals} variant="accent-filled" />

        </div>

      </div>
    </div>
  );
};

export default React.memo(CalculatorModal);
