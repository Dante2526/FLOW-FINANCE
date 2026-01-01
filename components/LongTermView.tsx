
import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ChevronLeft, Calendar, Trash2, Check, Edit2, Info } from 'lucide-react';
import { LongTermTransaction, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface Props {
  items: LongTermTransaction[];
  onAdd: (item: Omit<LongTermTransaction, 'id' | 'installmentsPaid'>) => void;
  onEdit: (item: LongTermTransaction) => void;
  onDelete: (id: string) => void;
  lang: AppLanguage;
}

const LongTermView: React.FC<Props> = ({ items, onAdd, onEdit, onDelete, lang }) => {
  const [selectedItem, setSelectedItem] = useState<LongTermTransaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [isEditMonthlyOpen, setIsEditMonthlyOpen] = useState(false);
  const [isEditInstallmentOpen, setIsEditInstallmentOpen] = useState(false);
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [isEditTotalOpen, setIsEditTotalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newMonthly, setNewMonthly] = useState('');
  const [newInstallments, setNewInstallments] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [editMonthlyValue, setEditMonthlyValue] = useState('');
  const [editInstallmentValue, setEditInstallmentValue] = useState('');
  const [editInstallmentDate, setEditInstallmentDate] = useState('');
  const [editingInstallmentIndex, setEditingInstallmentIndex] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editTotalValue, setEditTotalValue] = useState('');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const isAnyModalOpen = 
      isAddModalOpen || 
      isEditMonthlyOpen || 
      isEditInstallmentOpen || 
      isEditTitleOpen || 
      isEditTotalOpen;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAddModalOpen, isEditMonthlyOpen, isEditInstallmentOpen, isEditTitleOpen, isEditTotalOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setter('');
      return;
    }
    const amount = parseFloat(rawValue) / 100;
    setter(amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const parseCurrency = (val: string) => {
      if (!val) return 0;
      return parseFloat(val.replace(/\./g, '').replace(',', '.'));
  };

  const handleNewMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleAmountChange(e, setNewMonthly);
  };

  const handleNewTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleAmountChange(e, setNewTotal);
  };

  const handleNewCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewInstallments(e.target.value);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const totalInput = parseCurrency(newTotal);
    const monthlyInput = parseCurrency(newMonthly);
    const count = parseInt(newInstallments);
    
    if (!count || count <= 0) return;

    if (totalInput === 0 && monthlyInput === 0) {
        alert("Preencha o Valor da Parcela OU o Valor Total.");
        return;
    }

    let finalTotal = totalInput;
    let finalMonthly = monthlyInput;

    if (finalTotal === 0 && finalMonthly > 0) finalTotal = finalMonthly * count;
    if (finalMonthly === 0 && finalTotal > 0) finalMonthly = finalTotal / count;

    onAdd({
      title: newTitle.toUpperCase(),
      totalAmount: finalTotal,
      installmentsCount: count,
      startDate: newStartDate,
      monthlyAmount: finalMonthly
    });
    
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewTotal('');
    setNewMonthly('');
    setNewInstallments('');
  };

  const getInstallmentAmount = (item: LongTermTransaction, index: number): number => {
    if (item.installmentsHistory && item.installmentsHistory[index] !== undefined) {
        return item.installmentsHistory[index];
    }
    return item.monthlyAmount ?? (item.totalAmount / item.installmentsCount);
  };

  const getCurrentMonthlyAmount = (item: LongTermTransaction): number => {
      return item.monthlyAmount ?? (item.totalAmount / item.installmentsCount);
  };

  const getInstallmentDate = (item: LongTermTransaction, index: number) => {
    if (item.installmentsDates && item.installmentsDates[index]) {
       const dateOverride = new Date(item.installmentsDates[index] + 'T00:00:00');
       return dateOverride.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    const date = new Date(item.startDate + 'T00:00:00');
    date.setMonth(date.getMonth() + index);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const getRawInstallmentDate = (item: LongTermTransaction, index: number): string => {
     if (item.installmentsDates && item.installmentsDates[index]) {
        return item.installmentsDates[index];
     }
     const date = new Date(item.startDate + 'T00:00:00');
     date.setMonth(date.getMonth() + index);
     return date.toISOString().split('T')[0];
  };

  const toggleInstallment = (index: number) => {
    if (!selectedItem) return;
    const currentPaid = selectedItem.installmentsPaid;
    const targetPaid = index + 1;
    let newItem = { ...selectedItem };

    if (targetPaid === currentPaid) {
      newItem.installmentsPaid = currentPaid - 1;
    } else {
      newItem.installmentsPaid = targetPaid;
    }

    onEdit(newItem);
    setSelectedItem(newItem);
  };

  const handleSaveNewMonthlyValue = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem || !editMonthlyValue) return;

      const cleanVal = editMonthlyValue.replace(/\./g, '').replace(',', '.');
      const newMonthlyAmount = parseFloat(cleanVal);
      const oldMonthlyAmount = getCurrentMonthlyAmount(selectedItem);
      const newItem = { ...selectedItem };
      newItem.monthlyAmount = newMonthlyAmount;

      const newHistory = { ...(newItem.installmentsHistory || {}) };
      for (let i = 0; i < newItem.installmentsPaid; i++) {
          if (newHistory[i] === undefined) newHistory[i] = oldMonthlyAmount;
      }
      newItem.installmentsHistory = newHistory;

      let projectedTotal = 0;
      for (let i = 0; i < newItem.installmentsCount; i++) {
          if (newHistory[i] !== undefined) projectedTotal += newHistory[i];
          else projectedTotal += newMonthlyAmount;
      }
      newItem.totalAmount = projectedTotal;

      onEdit(newItem);
      setSelectedItem(newItem);
      setIsEditMonthlyOpen(false);
      setEditMonthlyValue('');
  };

  const handleSaveInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || editingInstallmentIndex === null || !editInstallmentValue || !editInstallmentDate) return;

    const cleanVal = editInstallmentValue.replace(/\./g, '').replace(',', '.');
    const newAmount = parseFloat(cleanVal);
    const newItem = { ...selectedItem };
    
    const newHistory = { ...(newItem.installmentsHistory || {}) };
    newHistory[editingInstallmentIndex] = newAmount;
    newItem.installmentsHistory = newHistory;

    const newDates = { ...(newItem.installmentsDates || {}) };
    newDates[editingInstallmentIndex] = editInstallmentDate;
    newItem.installmentsDates = newDates;

    onEdit(newItem);
    setSelectedItem(newItem);
    setIsEditInstallmentOpen(false);
    setEditingInstallmentIndex(null);
    setEditInstallmentValue('');
    setEditInstallmentDate('');
  };

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !editTitleValue.trim()) return;
    const newItem = { ...selectedItem, title: editTitleValue.toUpperCase() };
    onEdit(newItem);
    setSelectedItem(newItem);
    setIsEditTitleOpen(false);
  };

  const handleSaveTotal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !editTotalValue) return;
    const cleanVal = editTotalValue.replace(/\./g, '').replace(',', '.');
    const newTotalAmount = parseFloat(cleanVal);
    const newMonthlyBase = newTotalAmount / selectedItem.installmentsCount;
    const newItem = { 
      ...selectedItem, 
      totalAmount: newTotalAmount,
      monthlyAmount: newMonthlyBase 
    };
    onEdit(newItem);
    setSelectedItem(newItem);
    setIsEditTotalOpen(false);
  };
  
  const openEditMonthlyModal = () => {
      if (!selectedItem) return;
      const current = getCurrentMonthlyAmount(selectedItem);
      setEditMonthlyValue(current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setIsEditMonthlyOpen(true);
  };

  const openEditInstallmentModal = (index: number, currentAmount: number, currentDateIso: string) => {
      setEditingInstallmentIndex(index);
      setEditInstallmentValue(currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setEditInstallmentDate(currentDateIso);
      setIsEditInstallmentOpen(true);
  };

  const openEditTitleModal = () => {
    if (!selectedItem) return;
    setEditTitleValue(selectedItem.title);
    setIsEditTitleOpen(true);
  };

  const openEditTotalModal = () => {
    if (!selectedItem) return;
    setEditTotalValue(selectedItem.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setIsEditTotalOpen(true);
  };
  
  if (selectedItem) {
    const currentMonthlyValue = getCurrentMonthlyAmount(selectedItem);
    let totalPaidSoFar = 0;
    for(let i = 0; i < selectedItem.installmentsPaid; i++) {
        totalPaidSoFar += getInstallmentAmount(selectedItem, i);
    }

    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-300">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <button 
            onClick={() => setSelectedItem(null)}
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
               <h2 className="text-xl font-bold text-white truncate">
                  {selectedItem.title}
               </h2>
             </div>
          </div>

          <button 
             onClick={() => { onDelete(selectedItem.id); setSelectedItem(null); }}
             className="ml-auto w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Blocks */}
        <div className="grid grid-cols-3 gap-1 mb-4 shrink-0">
          <button 
            onClick={openEditMonthlyModal}
            className="bg-purple-600 rounded-2xl p-3 flex flex-col items-center justify-center text-center h-20 relative hover:bg-purple-500 transition-all active:scale-95 group shadow-lg shadow-purple-900/20"
          >
            <div className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                 <Edit2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase text-white/80">{t.longTerm.details.monthly}</span>
            <span className="text-sm font-bold text-white">
              R$ {currentMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </button>

          <button 
            onClick={openEditTitleModal}
            className="bg-indigo-600 p-3 rounded-2xl flex flex-col items-center justify-center text-center h-20 relative hover:bg-indigo-500 transition-all active:scale-95 group shadow-lg shadow-indigo-900/20"
          >
            <div className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                 <Edit2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase text-white/80">{t.longTerm.details.status}</span>
            <span className="text-xs font-bold text-white leading-tight mt-1 line-clamp-2">{selectedItem.title}</span>
          </button>

          <button 
             onClick={openEditTotalModal}
             className="bg-blue-600 rounded-2xl p-3 flex flex-col items-center justify-center text-center h-20 relative hover:bg-blue-500 transition-all active:scale-95 group shadow-lg shadow-blue-900/20"
          >
             <div className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                 <Edit2 className="w-3 h-3 text-white" />
             </div>
             <span className="text-[10px] font-bold uppercase text-white/80">{t.longTerm.details.total}</span>
             <span className="text-sm font-bold text-white">
               R$ {selectedItem.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
          </button>
        </div>
          
        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative -mx-2 px-2">
            
            <div className="grid grid-cols-4 bg-orange-600 h-10 items-center px-2 rounded-2xl mb-2 shadow-lg shadow-orange-900/20 select-none">
                <span className="text-[10px] font-bold text-black text-center border-r border-black/10 h-full flex items-center justify-center">{t.longTerm.details.headerParcel}</span>
                <span className="text-[10px] font-bold text-black text-center col-span-2 border-r border-black/10 h-full flex items-center justify-center">{t.longTerm.details.headerDate}</span>
                <span className="text-[10px] font-bold text-black text-center h-full flex items-center justify-center">{t.longTerm.details.headerValue}</span>
            </div>

            <div className="flex flex-col gap-2 pb-4">
            {Array.from({ length: selectedItem.installmentsCount }).map((_, index) => {
                const isPaid = index < selectedItem.installmentsPaid;
                const amount = getInstallmentAmount(selectedItem, index);
                const dateStr = getInstallmentDate(selectedItem, index);
                const rawDateStr = getRawInstallmentDate(selectedItem, index);
                
                return (
                <div 
                    key={index}
                    onClick={() => toggleInstallment(index)}
                    className={`grid grid-cols-4 items-center h-16 px-2 cursor-pointer transition-all group relative rounded-2xl shadow-sm select-none ${
                    isPaid 
                        ? 'bg-green-600 shadow-green-900/20' 
                        : 'bg-[#1c1c1e] border border-white/5 hover:bg-[#2c2c2e]'
                    }`}
                >
                    <div className="flex justify-center">
                    <span className={`font-bold text-lg ${isPaid ? 'text-white' : 'text-accent'}`}>{index + 1}º</span>
                    </div>
                    
                    <div className={`col-span-2 flex justify-center h-full items-center border-l relative ${isPaid ? 'border-white/10' : 'border-white/5'}`}>
                    <span className={`text-sm ${isPaid ? 'text-white font-medium' : 'text-gray-400'}`}>
                        {dateStr}
                    </span>
                    </div>
                    
                    <div className={`flex flex-col justify-center items-center h-full relative px-1 border-l ${isPaid ? 'border-white/10' : 'border-white/5'}`}>
                    <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold ${isPaid ? 'text-white' : 'text-gray-300'}`}>
                            R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {isPaid && <Check className="w-3 h-3 text-white" />}
                    </div>
                    </div>

                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditInstallmentModal(index, amount, rawDateStr);
                        }}
                        className="absolute top-1.5 right-1.5 z-20 opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <Edit2 className="w-3 h-3 text-white" />
                    </button>
                </div>
                );
            })}
            </div>

            <div className="mt-2 flex rounded-2xl overflow-hidden h-14 bg-[#1c1c1e] border border-white/5 shadow-lg shrink-0">
            <div className="flex-1 bg-green-600 flex items-center justify-center">
                <span className="font-bold text-black text-sm uppercase">{t.longTerm.details.paidFooter}</span>
            </div>
            <div className="w-32 flex items-center justify-center">
                <span className="font-bold text-white text-lg">
                R$ {totalPaidSoFar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            </div>

            <div className="h-2 w-full shrink-0" />
        </div>

         {/* Modals */}
         {isEditMonthlyOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">{t.longTerm.details.editMonthlyTitle}</h3>
                    <p className="text-xs text-gray-400 text-center -mt-2">{t.longTerm.details.editMonthlyDesc}</p>
                    <form onSubmit={handleSaveNewMonthlyValue} className="flex flex-col gap-4 mt-2">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-accent">R$</span>
                            <input 
                                type="text" 
                                value={editMonthlyValue}
                                onChange={(e) => handleAmountChange(e, setEditMonthlyValue)}
                                className="w-full bg-[#2c2c2e] text-white text-2xl font-bold py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsEditMonthlyOpen(false)} className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm">{t.common.cancel}</button>
                            <button type="submit" className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm">{t.common.save}</button>
                        </div>
                    </form>
                </div>
            </div>
         )}

         {isEditTitleOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">{t.longTerm.details.editNameTitle}</h3>
                    <form onSubmit={handleSaveTitle} className="flex flex-col gap-4 mt-2">
                        <input 
                            type="text" 
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value.toUpperCase())}
                            className="w-full bg-[#2c2c2e] text-white text-xl font-bold py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center uppercase"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsEditTitleOpen(false)} className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm">{t.common.cancel}</button>
                            <button type="submit" className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm">{t.common.save}</button>
                        </div>
                    </form>
                </div>
            </div>
         )}

         {isEditTotalOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">{t.longTerm.details.editTotalTitle}</h3>
                    <p className="text-xs text-gray-400 text-center -mt-2">{t.longTerm.details.editTotalDesc}</p>
                    <form onSubmit={handleSaveTotal} className="flex flex-col gap-4 mt-2">
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-accent">R$</span>
                            <input 
                                type="text" 
                                value={editTotalValue}
                                onChange={(e) => handleAmountChange(e, setEditTotalValue)}
                                className="w-full bg-[#2c2c2e] text-white text-2xl font-bold py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsEditTotalOpen(false)} className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm">{t.common.cancel}</button>
                            <button type="submit" className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm">{t.common.save}</button>
                        </div>
                    </form>
                </div>
            </div>
         )}

         {isEditInstallmentOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">
                        {t.longTerm.details.editParcelTitle} {editingInstallmentIndex !== null ? editingInstallmentIndex + 1 : ''}
                    </h3>
                    
                    <form onSubmit={handleSaveInstallment} className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400 ml-2">{t.longTerm.details.headerValue}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-accent">R$</span>
                                <input 
                                    type="text" 
                                    value={editInstallmentValue}
                                    onChange={(e) => handleAmountChange(e, setEditInstallmentValue)}
                                    className="w-full bg-[#2c2c2e] text-white text-2xl font-bold py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400 ml-2">{t.longTerm.details.headerDate}</label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={editInstallmentDate}
                                    onChange={(e) => setEditInstallmentDate(e.target.value)}
                                    className="w-full bg-[#2c2c2e] text-white text-xl font-bold py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsEditInstallmentOpen(false)} className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm">{t.common.cancel}</button>
                            <button type="submit" className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm">{t.common.save}</button>
                        </div>
                    </form>
                </div>
            </div>
         )}
         
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#1c1c1e] flex items-center justify-center border border-white/10">
          <Wallet className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t.longTerm.title}</h2>
          <p className="text-gray-400 text-sm">{t.longTerm.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Wallet className="w-12 h-12 mb-4 opacity-20" />
            <p>{t.longTerm.empty}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const progress = (item.installmentsPaid / item.installmentsCount) * 100;
              const startDate = new Date(item.startDate + 'T00:00:00');
              const endDate = new Date(startDate);
              endDate.setMonth(startDate.getMonth() + item.installmentsCount - 1);

              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-[#1c1c1e] rounded-[1.5rem] p-5 border border-white/5 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                   <div className="flex justify-between items-start mb-4">
                     <div className="min-w-0 flex-1 mr-4">
                       <h3 className="text-lg font-bold text-white uppercase truncate">{item.title}</h3>
                       <div className="flex gap-2 text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                          <span>{startDate.toLocaleDateString('pt-BR')}</span>
                          <span>•</span>
                          <span>{endDate.toLocaleDateString('pt-BR')}</span>
                       </div>
                     </div>
                     <span className="text-lg font-bold text-accent whitespace-nowrap">
                       R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                   </div>

                   <div className="relative h-4 bg-[#2c2c2e] rounded-full overflow-hidden mb-2">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                   
                   <div className="flex justify-between text-xs font-bold">
                     <span className="text-green-400">{item.installmentsPaid} {t.longTerm.paid}</span>
                     <span className="text-gray-500">{item.installmentsCount} {t.longTerm.total}</span>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-28 right-6 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-2xl hover:bg-accentDark transition-colors z-40"><Plus className="w-6 h-6 text-black" /></button>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-5 max-h-[90dvh] overflow-y-auto no-scrollbar">
            <h2 className="text-xl font-bold text-white">{t.longTerm.newTitle}</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4" autoComplete="off">
               <div className="flex flex-col gap-1">
                 <label className="text-xs text-gray-400 ml-2">{t.longTerm.form.title}</label>
                 <input 
                    className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent uppercase font-bold"
                    placeholder="EX: CARRO"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value.toUpperCase())}
                    required
                 />
               </div>

               <div className="flex gap-3">
                 <div className="flex-1 flex flex-col gap-1">
                   <label className="text-xs text-gray-400 ml-2">{t.longTerm.form.monthlyVal}</label>
                   <input type="text" inputMode="numeric" className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold" placeholder="0,00" value={newMonthly} onChange={handleNewMonthlyChange} />
                 </div>
                 <div className="w-24 flex flex-col gap-1">
                   <label className="text-xs text-gray-400 ml-2">{t.longTerm.form.count}</label>
                   <input type="number" className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold text-center" placeholder="12" value={newInstallments} onChange={handleNewCountChange} required />
                 </div>
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-xs text-gray-400 ml-2">{t.longTerm.form.totalVal}</label>
                 <input type="text" inputMode="numeric" className="w-full bg-[#2c2c2e] text-white/70 p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold" placeholder="0,00" value={newTotal} onChange={handleNewTotalChange} />
               </div>

               <div className="flex items-center gap-2 bg-[#2c2c2e]/50 p-2 rounded-xl border border-white/5">
                  <Info className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-[10px] text-gray-400 leading-tight">{t.longTerm.form.hint}</p>
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-xs text-gray-400 ml-2">{t.longTerm.form.startDate}</label>
                 <div className="relative">
                   <input type="date" className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} required />
                   <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                 </div>
               </div>

               <div className="flex gap-3 mt-2">
                 <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-[#2c2c2e] text-white h-14 rounded-xl font-bold">{t.common.cancel}</button>
                 <button type="submit" className="flex-1 bg-accent text-black h-14 rounded-xl font-bold">{t.longTerm.form.create}</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LongTermView);
