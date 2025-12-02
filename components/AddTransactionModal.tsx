
import React, { useState, useEffect } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { LogoType, Transaction } from '../types';
import { TransactionIcon } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  transactionToEdit?: Transaction | null;
  activeMonthContext?: { monthIndex: number; year: number };
}

const PURCHASE_ICONS: { type: LogoType; label: string }[] = [
  { type: 'shopping', label: 'Compras' },
  { type: 'food', label: 'Comida' },
  { type: 'transport', label: 'Carro' },
  { type: 'motorcycle', label: 'Moto' },
  { type: 'insurance', label: 'Seguro' },
  { type: 'wifi', label: 'Wifi' },
  { type: 'mobile', label: 'Celular' },
  { type: 'rent', label: 'Aluguel' },
  { type: 'home', label: 'Casa' },
  { type: 'utility', label: 'Contas' },
  { type: 'generic', label: 'Outros' },
];

const SUBSCRIPTION_ICONS: { type: LogoType; label: string }[] = [
  { type: 'netflix', label: 'Netflix' },
  { type: 'spotify', label: 'Spotify' },
  { type: 'amazon', label: 'Prime' },
  { type: 'youtube', label: 'YouTube' },
  { type: 'apple', label: 'Apple' },
  { type: 'disney', label: 'Disney+' },
  { type: 'max', label: 'Max' },
  { type: 'globo', label: 'Globoplay' },
  { type: 'mercadolivre', label: 'Meli+' },
];

const MONTH_MAP: Record<string, string> = {
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
};

const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose, onSave, transactionToEdit, activeMonthContext }) => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'purchase' | 'subscription'>('purchase');
  const [date, setDate] = useState('');
  // Default icons based on initial type
  const [selectedIcon, setSelectedIcon] = useState<LogoType>('shopping');

  // Determine which icon set to show
  const visibleIcons = type === 'subscription' ? SUBSCRIPTION_ICONS : PURCHASE_ICONS;

  // Helper to parse "24 Dez" back to "YYYY-MM-DD"
  const parseDateFromDisplay = (displayDate: string): string => {
    try {
      if (!displayDate) return new Date().toISOString().split('T')[0];
      if (displayDate.toLowerCase().includes('hoje')) return new Date().toISOString().split('T')[0];
      
      // Handle "YYYY-MM-DD" format (already ISO)
      if (displayDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          return displayDate.split(' ')[0];
      }

      // Handle "DD Mmm" format (e.g. "24 Jan")
      const parts = displayDate.split(' ');
      if (parts.length >= 2) {
        const day = parts[0].padStart(2, '0');
        const monthCode = parts[1].toLowerCase().substring(0, 3);
        const month = MONTH_MAP[monthCode];
        
        if (month) {
          // Use the Year from context if available, otherwise default to current year
          const year = activeMonthContext ? activeMonthContext.year : new Date().getFullYear();
          return `${year}-${month}-${day}`;
        }
      }
      return new Date().toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  useEffect(() => {
    if (isOpen && transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setName(transactionToEdit.name.toUpperCase());
      setSelectedIcon(transactionToEdit.logoType);
      setType(transactionToEdit.type as 'purchase' | 'subscription');
      
      // Use the helper to correctly set the date input value
      setDate(parseDateFromDisplay(transactionToEdit.date));
      
    } else if (isOpen && !transactionToEdit) {
      setAmount('');
      setName('');
      setSelectedIcon('shopping');
      setType('purchase');
      
      // Default to the 1st day of the ACTIVE month, not today (if contexts differ)
      if (activeMonthContext) {
          const y = activeMonthContext.year;
          const m = String(activeMonthContext.monthIndex + 1).padStart(2, '0');
          // If the active month is current month, use today. Else use 1st.
          const now = new Date();
          if (now.getMonth() === activeMonthContext.monthIndex && now.getFullYear() === activeMonthContext.year) {
             setDate(now.toISOString().split('T')[0]);
          } else {
             setDate(`${y}-${m}-01`);
          }
      } else {
          setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, transactionToEdit, activeMonthContext]);

  // When type changes, reset icon to first of that list if not editing or if mismatched
  useEffect(() => {
    if (!isOpen) return;
    
    // Check if current icon exists in the new list
    const currentIconExists = visibleIcons.some(i => i.type === selectedIcon);
    
    if (!currentIconExists) {
      setSelectedIcon(visibleIcons[0].type);
    }
  }, [type, visibleIcons, isOpen, selectedIcon]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !name || !date) return;

    // Check if selected date is today to use "Hoje"
    const today = new Date().toISOString().split('T')[0];
    let finalDateString = '';
    
    if (date === today) {
       finalDateString = `Hoje ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
       // IMPORTANT: Save as ISO YYYY-MM-DD to preserve year information for future dates
       finalDateString = date;
    }

    onSave({
      name,
      amount: parseFloat(amount),
      type,
      paymentMethod: transactionToEdit?.paymentMethod || 'card', 
      logoType: selectedIcon,
      date: finalDateString,
      paid: transactionToEdit ? transactionToEdit.paid : false
    });
    
    if (!transactionToEdit) {
      setAmount('');
      setName('');
      setSelectedIcon('shopping');
    }
    onClose();
  };

  const isFormValid = amount.length > 0 && name.length > 0 && date.length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {transactionToEdit ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
          
          {/* Amount Input */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent">R$</span>
              <input 
                type="number" 
                name="transaction_amount_hidden"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#2c2c2e] text-white text-3xl font-bold py-4 pl-14 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600"
                autoFocus
                required
                autoComplete="off"
                data-lpignore="true"
              />
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">Descrição</label>
            <input 
              type="text" 
              name="transaction_desc_hidden"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="DO QUE SE TRATA?"
              className="w-full bg-[#2c2c2e] text-white text-lg py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600 uppercase"
              required
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              data-lpignore="true"
            />
          </div>

          {/* Date Input */}
          <div className="flex flex-col gap-2">
             <label className="text-gray-400 text-sm ml-2">Data de Vencimento</label>
             <div className="relative">
               <input 
                  type="date"
                  name="transaction_date_hidden"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#2c2c2e] text-white text-lg py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600 appearance-none"
                  required
                  autoComplete="off"
               />
               <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
             </div>
          </div>

          {/* Type Toggle */}
          <div className="flex p-1 bg-[#2c2c2e] rounded-xl">
            <button
              type="button"
              onClick={() => setType('purchase')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                type === 'purchase' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Compra
            </button>
            <button
              type="button"
              onClick={() => setType('subscription')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                type === 'subscription' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Assinatura
            </button>
          </div>

          {/* Icon Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">Ícone</label>
            <div className="grid grid-cols-5 gap-3 p-1">
              {visibleIcons.map((icon) => (
                <button
                  key={icon.type}
                  type="button"
                  onClick={() => setSelectedIcon(icon.type)}
                  className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${
                    selectedIcon === icon.type 
                      ? 'bg-accent/20 ring-2 ring-accent scale-110' 
                      : 'bg-[#2c2c2e] hover:bg-[#3a3a3c] opacity-70 hover:opacity-100'
                  }`}
                  title={icon.label}
                >
                  <div className="scale-75">
                    <TransactionIcon type={icon.type} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-accent text-black disabled:bg-surfaceLight disabled:text-gray-500 h-16 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark disabled:hover:bg-surfaceLight transition-colors mt-2"
          >
            {transactionToEdit ? 'Salvar Alterações' : 'Adicionar Conta'}
            <Check className="w-5 h-5" />
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
