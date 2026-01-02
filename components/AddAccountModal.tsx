
import React, { useState, useEffect } from 'react';
import { X, Check, Lock, Crown } from 'lucide-react';
import { CardTheme, Account, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, balance: number, theme: CardTheme) => void;
  accountToEdit?: Account | null;
  isPro?: boolean;
  onOpenProModal?: () => void;
  appLanguage: AppLanguage;
}

const THEMES_CONFIG: { id: CardTheme; color: string; isPro?: boolean }[] = [
  { id: 'default', color: 'bg-[#1c1c1e]' },
  { id: 'lime', color: 'bg-[#65a30d]' },
  { id: 'purple', color: 'bg-purple-600' },
  { id: 'blue', color: 'bg-blue-600', isPro: true },
  { id: 'orange', color: 'bg-orange-500', isPro: true },
  { id: 'red', color: 'bg-red-600', isPro: true },
];

const AddAccountModal: React.FC<Props> = ({ isOpen, onClose, onSave, accountToEdit, isPro = false, onOpenProModal, appLanguage }) => {
  const [balance, setBalance] = useState('');
  const [name, setName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('default');

  const t = TRANSLATIONS[appLanguage].addAccount;

  // Load data when entering edit mode
  useEffect(() => {
    if (isOpen && accountToEdit) {
      setName(accountToEdit.name);
      setBalance(accountToEdit.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setSelectedTheme(accountToEdit.colorTheme);
    } else if (isOpen && !accountToEdit) {
      // Reset if opening in create mode
      setName('');
      setBalance('');
      setSelectedTheme('default');
    }
  }, [isOpen, accountToEdit]);

  if (!isOpen) return null;

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setBalance('');
      return;
    }
    const amountValue = parseFloat(rawValue) / 100;
    setBalance(amountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Parse back to float
    let finalBalance = 0;
    if (balance) {
       finalBalance = parseFloat(balance.replace(/\./g, '').replace(',', '.'));
    }

    onSave(name, finalBalance, selectedTheme);
    
    // Only reset if we are not editing (to prevent flickering before close)
    if (!accountToEdit) {
      setBalance('');
      setName('');
      setSelectedTheme('default');
    }
    onClose();
  };

  const handleThemeSelect = (theme: typeof THEMES_CONFIG[0]) => {
    if (theme.isPro && !isPro) {
      if (onOpenProModal) onOpenProModal();
      return;
    }
    setSelectedTheme(theme.id);
  };

  const isFormValid = name.length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-6 max-h-[90dvh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {accountToEdit ? t.editTitle : t.newTitle}
          </h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6" autoComplete="off">
          
          {/* Balance Input */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.balanceLabel}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent">R$</span>
              <input 
                type="text" 
                inputMode="numeric"
                name="account_balance_hidden"
                value={balance}
                onChange={handleBalanceChange}
                placeholder="0,00"
                className="w-full bg-[#2c2c2e] text-white text-3xl font-bold py-4 pl-14 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600"
                autoComplete="off"
                data-lpignore="true"
              />
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.nameLabel}</label>
            <input 
              type="text" 
              name="account_name_hidden"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full bg-[#2c2c2e] text-white text-lg py-4 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600"
              required
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              data-lpignore="true"
            />
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm ml-2">{t.colorLabel}</label>
            <div className="flex gap-3 overflow-x-auto py-1 px-1 no-scrollbar pb-2">
              {THEMES_CONFIG.map((theme) => {
                const isLocked = theme.isPro && !isPro;
                const label = t.themes[theme.id as keyof typeof t.themes];
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelect(theme)}
                    className={`relative w-12 h-12 rounded-full flex-shrink-0 ${theme.color} flex items-center justify-center transition-all border-2 ${
                      selectedTheme === theme.id 
                        ? 'border-white scale-110 shadow-lg z-10' 
                        : isLocked 
                          ? 'border-transparent opacity-60' 
                          : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    aria-label={label}
                    title={label}
                  >
                    {selectedTheme === theme.id && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                    {isLocked && selectedTheme !== theme.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                         <Lock className="w-4 h-4 text-white/90 drop-shadow-md" />
                      </div>
                    )}
                    {theme.isPro && (
                       <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 shadow-sm border border-black/10">
                          <Crown className="w-2 h-2 text-black fill-black" />
                       </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-accent text-black disabled:bg-surfaceLight disabled:text-gray-500 h-16 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark disabled:hover:bg-surfaceLight transition-colors mt-2"
          >
            {accountToEdit ? t.submitEdit : t.submitAdd}
            <Check className="w-5 h-5" />
          </button>

        </form>
      </div>
    </div>
  );
};

export default React.memo(AddAccountModal);
