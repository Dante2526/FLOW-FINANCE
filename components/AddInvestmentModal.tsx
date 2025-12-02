
import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp, Building, Layers, Search } from 'lucide-react';
import { Investment, InvestmentType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inv: Omit<Investment, 'id'>) => void;
  investmentToEdit?: Investment | null;
}

const AddInvestmentModal: React.FC<Props> = ({ isOpen, onClose, onSave, investmentToEdit }) => {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<InvestmentType>('cdi');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [yieldRate, setYieldRate] = useState('');

  useEffect(() => {
    if (isOpen && investmentToEdit) {
      setName(investmentToEdit.name);
      setInstitution(investmentToEdit.institution);
      setType(investmentToEdit.type);
      setAmount(investmentToEdit.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setQuantity(investmentToEdit.quantity ? investmentToEdit.quantity.toString() : '');
      setYieldRate(investmentToEdit.yieldRate ? investmentToEdit.yieldRate.toString() : '');
    } else if (isOpen && !investmentToEdit) {
      // Reset fields
      setName('');
      setInstitution('');
      setType('cdi');
      setAmount('');
      setQuantity('');
      setYieldRate('');
    }
  }, [isOpen, investmentToEdit]);

  if (!isOpen) return null;

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setAmount('');
      return;
    }
    const amountVal = parseFloat(rawValue) / 100;
    setAmount(amountVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleSearchYield = () => {
    if (!name) return;

    if (type === 'fii') {
        const cleanName = name.toLowerCase().trim();
        window.open(`https://statusinvest.com.br/fundos-imobiliarios/${cleanName}`, '_blank');
    } else {
        const query = `${name} dividend yield status invest`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    const parsedYield = yieldRate ? parseFloat(yieldRate.replace(',', '.')) : 0;
    const parsedQuantity = quantity ? parseInt(quantity) : undefined;

    onSave({
      name: name.toUpperCase(),
      institution: institution.toUpperCase(),
      type,
      amount: parsedAmount,
      quantity: parsedQuantity,
      yieldRate: parsedYield,
    });
    
    onClose();
  };

  const isFormValid = name.length > 0 && amount.length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-6 max-h-[90dvh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {investmentToEdit ? 'Editar Investimento' : 'Novo Investimento'}
          </h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off">
           
           {/* Type Selector */}
           <div className="grid grid-cols-2 gap-3 p-1 bg-[#2c2c2e] rounded-2xl">
              <button 
                type="button"
                onClick={() => setType('cdi')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  type === 'cdi' 
                    ? 'bg-[#3a3a3c] text-emerald-500 ring-emerald-500 ring-1 shadow-lg' 
                    : 'text-gray-500 hover:bg-[#3a3a3c]/50'
                }`}
              >
                <TrendingUp className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Renda Fixa / CDI</span>
              </button>
              <button 
                type="button"
                onClick={() => setType('fii')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  type === 'fii' 
                    ? 'bg-[#3a3a3c] text-blue-400 shadow-lg ring-1 ring-blue-500/20' 
                    : 'text-gray-500 hover:bg-[#3a3a3c]/50'
                }`}
              >
                <Building className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase">Fundo Imob (FII)</span>
              </button>
           </div>

           {/* Institution */}
           <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs ml-2 font-bold uppercase">Instituição</label>
              <input 
                type="text" 
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={type === 'cdi' ? "Ex: PICPAY, NUBANK..." : "Ex: RICO, XP..."}
                className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-medium uppercase text-sm"
                autoComplete="off"
                spellCheck="false"
              />
           </div>

           {/* Asset Name */}
           <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs ml-2 font-bold uppercase">Nome do Ativo</label>
              <input 
                 type="text" 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder={type === 'cdi' ? "Ex: CAIXINHA RESERVA" : "Ex: MXRF11"}
                 className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-medium uppercase text-sm"
                 autoComplete="off"
                 spellCheck="false"
              />
           </div>

           {/* Amount & Quantity Row */}
           <div className="flex gap-3">
              {/* Quantity Input - ONLY for FII */}
              {type === 'fii' && (
                 <div className="w-[35%] flex flex-col gap-2">
                   <label className="text-gray-400 text-xs ml-2 font-bold uppercase">Qtd</label>
                   <div className="relative">
                       <input 
                          type="number"
                          inputMode="numeric"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="1"
                          className="w-full bg-[#2c2c2e] text-white p-4 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold text-lg"
                          autoComplete="off"
                       />
                       <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                   </div>
                 </div>
              )}

              <div className="flex-1 flex flex-col gap-2">
                 <label className="text-gray-400 text-xs ml-2 font-bold uppercase">Valor Total</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-bold text-sm">R$</span>
                    <input 
                      type="text"
                      inputMode="numeric" 
                      value={amount}
                      onChange={handleCurrencyChange}
                      placeholder="0,00"
                      className="w-full bg-[#2c2c2e] text-white p-4 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold text-lg"
                      autoComplete="off"
                    />
                 </div>
              </div>
           </div>

           {/* Yield */}
           <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs ml-2 font-bold uppercase">
                 {type === 'cdi' ? '% do CDI (Rentabilidade)' : 'Dividend Yield (Anual Estimado)'}
              </label>
              <div className="relative flex items-center">
                 <input 
                   type="number" 
                   value={yieldRate}
                   onChange={(e) => setYieldRate(e.target.value)}
                   placeholder={type === 'cdi' ? "Ex: 100 (para 100%)" : "Ex: 12.5"}
                   className="w-full bg-[#2c2c2e] text-white p-4 pr-24 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold text-sm"
                   autoComplete="off"
                 />

                 {/* Search Button for FIIs/Stocks */}
                 {type !== 'cdi' && name.length > 0 && (
                     <button
                         type="button"
                         onClick={handleSearchYield}
                         className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-colors"
                         title="Pesquisar DY"
                     >
                         <Search className="w-4 h-4" />
                     </button>
                 )}

                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
              </div>
           </div>

           <button 
             type="submit"
             disabled={!isFormValid}
             className={`w-full h-14 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg mt-2 ${
               type === 'cdi' 
                  ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 disabled:bg-[#2c2c2e] disabled:text-gray-500' 
                  : 'bg-accent text-emerald-950 hover:bg-accentDark disabled:bg-[#2c2c2e] disabled:text-gray-500'
             }`}
           >
             <Check className="w-5 h-5" />
             {investmentToEdit ? 'Salvar Alterações' : 'Adicionar'}
           </button>
        </form>

      </div>
    </div>
  );
};

export default AddInvestmentModal;
