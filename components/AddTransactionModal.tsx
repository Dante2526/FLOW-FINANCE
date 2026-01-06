import React, { useState, useEffect } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { LogoType, Transaction, AppLanguage } from '../types';
import { TransactionIcon } from './Icons';
import { TRANSLATIONS, getLocale } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  transactionToEdit?: Transaction | null;
  activeMonthContext?: { monthIndex: number; year: number };
  appLanguage: AppLanguage;
}

// Map short codes for date parsing (Supports PT, EN, ES formats to fix date resets on edit)
const MONTH_MAP: Record<string, string> = {
  // PT & Universal
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
  
  // EN Specifics
  'feb': '02', 'apr': '04', 'may': '05', 'aug': '08', 'sep': '09', 'oct': '10', 'dec': '12',
  
  // ES Specifics
  'ene': '01', 'dic': '12'
};

const TODAY_KEYWORDS = ['hoje', 'today', 'hoy'];

const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose, onSave, transactionToEdit, activeMonthContext, appLanguage }) => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'purchase' | 'subscription'>('purchase');
  const [date, setDate] = useState('');
  // Default icons based on initial type
  const [selectedIcon, setSelectedIcon] = useState<LogoType>('shopping');

  const t = TRANSLATIONS[appLanguage].addTransaction;
  const tCommon = TRANSLATIONS[appLanguage].transactionList; // To access "Today" translation
  const locale = getLocale(appLanguage);
  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  // Define icons arrays dynamically to use translations
  const PURCHASE_ICONS: { type: LogoType; label: string }[] = [
    { type: 'shopping', label: t.categories.shopping },
    { type: 'food', label: t.categories.food },
    { type: 'transport', label: t.categories.transport },
    { type: 'motorcycle', label: t.categories.motorcycle },
    { type: 'insurance', label: t.categories.insurance },
    { type: 'wifi', label: t.categories.wifi },
    { type: 'mobile', label: t.categories.mobile },
    { type: 'rent', label: t.categories.rent },
    { type: 'home', label: t.categories.home },
    { type: 'utility', label: t.categories.utility },
    // New Items
    { type: 'education', label: t.categories.education },
    { type: 'project', label: t.categories.project },
    { type: 'funeral', label: t.categories.funeral },
    { type: 'health', label: t.categories.health },
    { type: 'medicine', label: t.categories.medicine },
    { type: 'pet', label: t.categories.pet },
    { type: 'travel', label: t.categories.travel },
    
    // Specific & Extras
    { type: 'leisure', label: t.categories.leisure },
    { type: 'bar', label: t.categories.bar },
    { type: 'game', label: t.categories.game },
    { type: 'gift', label: t.categories.gift },
    
    // Beauty & Wellness
    { type: 'beauty', label: t.categories.beauty },
    { type: 'makeup', label: t.categories.makeup },
    { type: 'aesthetic', label: t.categories.aesthetic },
    
    // Events
    { type: 'wedding', label: t.categories.wedding },
    
    { type: 'generic', label: t.categories.generic },
  ];

  const SUBSCRIPTION_ICONS: { type: LogoType; label: string }[] = [
    { type: 'netflix', label: t.categories.netflix },
    { type: 'spotify', label: t.categories.spotify },
    { type: 'amazon', label: t.categories.amazon },
    { type: 'youtube', label: t.categories.youtube },
    { type: 'apple', label: t.categories.apple },
    { type: 'disney', label: t.categories.disney },
    { type: 'max', label: t.categories.max },
    { type: 'globo', label: t.categories.globo },
    { type: 'mercadolivre', label: t.categories.mercadolivre },
  ];

  // Determine which icon set to show
  const visibleIcons = type === 'subscription' ? SUBSCRIPTION_ICONS : PURCHASE_ICONS;

  // Helper to parse "24 Dez" back to "YYYY-MM-DD"
  const parseDateFromDisplay = (displayDate: string): string => {
    try {
      if (!displayDate) return new Date().toISOString().split('T')[0];
      
      const lower = displayDate.toLowerCase();
      if (TODAY_KEYWORDS.some(k => lower.includes(k))) return new Date().toISOString().split('T')[0];
      
      // Handle "YYYY-MM-DD" format (already ISO)
      if (displayDate.match(/^\d{4}-\d{2}-\d{2}/)) {
          return displayDate.split(' ')[0];
      }

      // Handle "DD Mmm" format (e.g. "24 Jan", "24 May") - Locale Support
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
      setAmount(transactionToEdit.amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setName(transactionToEdit.name); // Removed explicit toUpperCase here to respect stored data style until edit
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
  }, [isOpen, transactionToEdit, activeMonthContext, locale]);

  // When type changes, reset icon to first of that list if not editing or if mismatched
  useEffect(() => {
    if (!isOpen) return;
    
    // Check if current icon exists in the new list
    const currentIconExists = visibleIcons.some(i => i.type === selectedIcon);
    
    if (!currentIconExists) {
      setSelectedIcon(visibleIcons[0].type);
    }
  }, [type, visibleIcons, isOpen, selectedIcon]);

  // Currency Handler
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setAmount('');
      return;
    }
    const amountValue = parseFloat(rawValue) / 100;
    setAmount(amountValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !name || !date) return;

    // Check if selected date is today to use localized "Today"
    const today = new Date().toISOString().split('T')[0];
    let finalDateString = '';
    
    if (date === today) {
       // Use the current language word for "Today" (Hoje/Today/Hoy)
       finalDateString = `${tCommon.today} ${new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    } else {
       // IMPORTANT: Save as ISO YYYY-MM-DD to preserve year information for future dates
       finalDateString = date;
    }

    // Parse amount from string (handle locale differences)
    let parsedAmount = 0;
    if (locale === 'en-US') {
        parsedAmount = parseFloat(amount.replace(/,/g, ''));
    } else {
        // Default PT/ES
        parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    }

    onSave({
      name: name.toUpperCase(), // Convert to Uppercase ONLY on submit
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
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {transactionToEdit ? t.editTitle : t.newTitle}
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
            <label className="text-gray-400 text-sm ml-2">{t.amountLabel}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent">{currencySymbol}</span>
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

          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.descLabel}</label>
            <input 
              type="text" 
              name="transaction_desc_hidden"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.descPlaceholder}
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
             <label className="text-gray-400 text-sm ml-2">{t.dateLabel}</label>
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
              {t.types.purchase}
            </button>
            <button
              type="button"
              onClick={() => setType('subscription')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                type === 'subscription' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.types.subscription}
            </button>
          </div>

          {/* Icon Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.iconLabel}</label>
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
            {transactionToEdit ? t.submitEdit : t.submitAdd}
            <Check className="w-5 h-5" />
          </button>

        </form>
      </div>
    </div>
  );
};

export default React.memo(AddTransactionModal);