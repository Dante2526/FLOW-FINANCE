
import React from 'react';
import { Plus, Copy, Calculator } from 'lucide-react';

interface Props {
  balance: number;
  onAddClick: () => void;
  onDuplicateClick: () => void;
  onCalculatorClick: () => void;
}

const BalanceCard: React.FC<Props> = ({ balance, onAddClick, onDuplicateClick, onCalculatorClick }) => {
  // Format the balance to maintain the visual style (large integer, smaller decimals)
  const formattedBalance = balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [integerPart, decimalPart] = formattedBalance.split(',');

  return (
    <div className="relative w-full bg-accent rounded-[2.5rem] p-6 text-white flex flex-col justify-between min-h-[220px] shadow-lg shadow-accent/20">
      
      {/* Header of Card */}
      <div className="flex justify-between items-start">
        <span className="text-lg font-extrabold text-white drop-shadow-sm tracking-wide">LUCRO</span>
      </div>

      {/* Main Balance */}
      <div className="mt-2 mb-6">
        <h1 className="text-4xl font-bold tracking-tight drop-shadow-md">
          R$ {integerPart}<span className="text-3xl text-white">,{decimalPart}</span>
        </h1>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-3">
        {/* Add Button (Promoted to Primary - replaces Send) */}
        <button 
          onClick={onAddClick}
          className="flex-1 bg-[#121214] text-white h-16 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg"
        >
          <span className="text-lg font-medium">Adicionar</span>
          <Plus className="w-5 h-5" />
        </button>

        {/* Duplicate Button (Copy Icon) */}
        <button 
          onClick={onDuplicateClick}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
          title="Duplicar contas para o próximo mês"
        >
          <Copy className="w-6 h-6" />
        </button>

        <button 
          onClick={onCalculatorClick}
          className="w-16 h-16 bg-[#121214] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-colors shadow-lg"
        >
          <Calculator className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default BalanceCard;
