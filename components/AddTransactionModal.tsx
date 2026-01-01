
import React, { useState, useEffect } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { LogoType, Transaction, AppLanguage } from '../types';
import { TransactionIcon } from './Icons';
import { TRANSLATIONS } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  transactionToEdit?: Transaction | null;
  activeMonthContext?: { monthIndex: number; year: number };
  lang: AppLanguage;
}

const MONTH_MAP: Record<string, string> = {
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
};

const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose, onSave, transactionToEdit, activeMonthContext, lang }) => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'purchase' | 'subscription'>('purchase');
  const [date, setDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<LogoType>('shopping');

  const t = TRANSLATIONS[lang];
  const cat = t.addTransaction.categories;

  const PURCHASE_ICONS: { type: LogoType; label: string }[] = [
    { type: 'shopping', label: cat.shopping },
    { type: 'food', label: cat.food },
    { type: 'transport', label: cat.transport },
    { type: 'motorcycle', label: cat.motorcycle },
    { type: 'insurance', label: cat.insurance },
    { type: 'wifi', label: cat.wifi },
    { type: 'mobile', label: cat.mobile },
    { type: 'rent', label: cat.rent },
    { type: 'home', label: cat.home },
    { type: 'utility', label: cat.utility },
    { type: 'education', label: cat.education },
    { type: 'project', label: cat.project },
    { type: 'funeral', label: cat.funeral },
    { type: 'health', label: cat.health },
    { type: 'medicine', label: cat.medicine },
    { type: 'pet', label: cat.pet },
    { type: 'travel', label: cat.travel },
    { type: 'leisure', label: cat.leisure },
    { type: 'bar', label: cat.bar },
    { type: 'game', label: cat.game },
    { type: 'gift', label: cat.gift },
    { type: 'beauty', label: cat.beauty },
    { type: 'makeup', label: cat.makeup },
    { type: 'aesthetic', label: cat.aesthetic },
    { type: 'wedding', label: cat.wedding },
    { type: 'generic', label: cat.generic },
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

  const visibleIcons = type === 'subscription' ? SUBSCRIPTION_ICONS : PURCHASE_ICONS;

  const parseDateFromDisplay = (displayDate: string): string => {
    try {
      if (!displayDate) return new Date().toISOString().split('T')[0];
      if (displayDate.toLowerCase().includes('hoje')) return new Date().toISOString().split('T')[0];
      
      if (displayDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          return displayDate.split(' ')[0];
      }

      const parts = displayDate.split(' ');
      if (parts.length >= 2) {
        const day = parts[0].padStart(2, '0');
        const monthCode = parts[1].toLowerCase().substring(0, 3);
        const month = MONTH_MAP[monthCode];
        
        if (month) {
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
      setAmount(transactionToEdit.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setName(transactionToEdit.name); 
      setSelectedIcon(transactionToEdit.logoType);
      setType(transactionToEdit.type as 'purchase' | 'subscription');
      setDate(parseDateFromDisplay(transactionToEdit.date));
    } else if (isOpen && !transactionToEdit) {
      setAmount('');
      setName('');
      setSelectedIcon('shopping');
      setType('purchase');
      
      if (activeMonthContext) {
          const y = activeMonthContext.year;
          const m = String(activeMonthContext.monthIndex + 1).padStart(2, '0');
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

  useEffect(() => {
    if (!isOpen) return;
    const currentIconExists = visibleIcons.some(i => i.type === selectedIcon);
    if (!currentIconExists) {
      setSelectedIcon(visibleIcons[0].type);
    }
  }, [type, visibleIcons, isOpen, selectedIcon]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setAmount('');
      return;
    }
    const amountValue = parseFloat(rawValue) / 100;
    setAmount(amountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !name || !date) return;

    const today = new Date().toISOString().split('T')[0];
    let finalDateString = '';
    
    if (date === today) {
       finalDateString = `Hoje ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
       finalDateString = date;
    }

    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));

    onSave({
      name: name.toUpperCase(),
      amount: parsedAmount,
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
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-5 max-h-[90dvh] overflow-y-auto no-scrollbar">
        
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {transactionToEdit ? t.addTransaction.titleEdit : t.addTransaction.titleNew}
          </h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
          
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.addTransaction.amount}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent">R$</span>
              <input 
                type="text" 
                inputMode="numeric"
                name="transaction_amount_hidden"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="w-full bg-[#2c2c2e] text-white text-3xl font-bold py-4 pl-14 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600"
                required
                autoComplete="off"
                data-lpignore="true"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.addTransaction.description}</label>
            <input 
              type="text" 
              name="transaction_desc_hidden"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.addTransaction.descPlaceholder}
              className="w-full bg-[#2c2c2e] text-white text-lg py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600 uppercase"
              required
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              data-lpignore="true"
            />
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-gray-400 text-sm ml-2">{t.addTransaction.date}</label>
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

          <div className="flex p-1 bg-[#2c2c2e] rounded-xl">
            <button
              type="button"
              onClick={() => setType('purchase')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                type === 'purchase' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.addTransaction.typePurchase}
            </button>
            <button
              type="button"
              onClick={() => setType('subscription')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                type === 'subscription' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.addTransaction.typeSub}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.addTransaction.icon}</label>
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

          <button 
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-accent text-black disabled:bg-surfaceLight disabled:text-gray-500 h-16 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark disabled:hover:bg-surfaceLight transition-colors mt-2"
          >
            {transactionToEdit ? t.addTransaction.submitEdit : t.addTransaction.submitNew}
            <Check className="w-5 h-5" />
          </button>

        </form>
      </div>
    </div>
  );
};

export default React.memo(AddTransactionModal);
