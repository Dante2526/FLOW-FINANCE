
import React, { useState } from 'react';
import { Wallet, Plus, ChevronLeft, Calendar, Trash2, Check, Edit2 } from 'lucide-react';
import { LongTermTransaction } from '../types';

interface Props {
  items: LongTermTransaction[];
  onAdd: (item: Omit<LongTermTransaction, 'id' | 'installmentsPaid'>) => void;
  onEdit: (item: LongTermTransaction) => void;
  onDelete: (id: string) => void;
}

const LongTermView: React.FC<Props> = ({ items, onAdd, onEdit, onDelete }) => {
  const [selectedItem, setSelectedItem] = useState<LongTermTransaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit Modals State
  const [isEditMonthlyOpen, setIsEditMonthlyOpen] = useState(false);
  const [isEditInstallmentOpen, setIsEditInstallmentOpen] = useState(false);
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [isEditTotalOpen, setIsEditTotalOpen] = useState(false);

  // Form State for Adding
  const [newTitle, setNewTitle] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newInstallments, setNewInstallments] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Value States
  const [editMonthlyValue, setEditMonthlyValue] = useState('');
  const [editInstallmentValue, setEditInstallmentValue] = useState('');
  const [editingInstallmentIndex, setEditingInstallmentIndex] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editTotalValue, setEditTotalValue] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setter('');
      return;
    }
    const amount = parseFloat(rawValue) / 100;
    setter(amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean formatting (remove dots, replace comma with dot) to parse to float
    const cleanTotal = newTotal.replace(/\./g, '').replace(',', '.');
    const totalAmount = parseFloat(cleanTotal);
    const count = parseInt(newInstallments);
    const initialMonthly = totalAmount / count;

    onAdd({
      title: newTitle.toUpperCase(),
      totalAmount: totalAmount,
      installmentsCount: count,
      startDate: newStartDate,
      monthlyAmount: initialMonthly // Initialize explicitly
    });
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewTotal('');
    setNewInstallments('');
  };

  // Helper to get effective monthly value for a given installment index
  const getInstallmentAmount = (item: LongTermTransaction, index: number): number => {
    // If there is a specific history entry, use it
    if (item.installmentsHistory && item.installmentsHistory[index] !== undefined) {
        return item.installmentsHistory[index];
    }
    // Otherwise fallback to current monthly amount
    // If currentMonthlyAmount is not set (legacy data), derive from total/count
    return item.monthlyAmount ?? (item.totalAmount / item.installmentsCount);
  };

  // Helper to get Current Active Monthly Amount (for the UI header)
  const getCurrentMonthlyAmount = (item: LongTermTransaction): number => {
      return item.monthlyAmount ?? (item.totalAmount / item.installmentsCount);
  };

  const getInstallmentDate = (start: string, index: number) => {
    const date = new Date(start);
    date.setMonth(date.getMonth() + index);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const toggleInstallment = (index: number) => {
    if (!selectedItem) return;
    
    const currentPaid = selectedItem.installmentsPaid;
    const targetPaid = index + 1;
    let newItem = { ...selectedItem };

    // If clicking the last paid item, uncheck it (go back one step)
    if (targetPaid === currentPaid) {
      newItem.installmentsPaid = currentPaid - 1;
      // We do NOT delete history here anymore, so manual edits persist even if unchecked
    } else {
      // Forward progress: Set paid to this row (and all before it implied)
      newItem.installmentsPaid = targetPaid;
    }

    onEdit(newItem);
    setSelectedItem(newItem);
  };

  // --- SAVE HANDLERS ---

  const handleSaveNewMonthlyValue = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItem || !editMonthlyValue) return;

      const cleanVal = editMonthlyValue.replace(/\./g, '').replace(',', '.');
      const newMonthlyAmount = parseFloat(cleanVal);
      const oldMonthlyAmount = getCurrentMonthlyAmount(selectedItem);
      
      // Create new item copy
      const newItem = { ...selectedItem };
      newItem.monthlyAmount = newMonthlyAmount;

      // BACKFILL HISTORY:
      // For all currently paid installments, if they don't have a history entry, 
      // save the OLD monthly amount. This preserves the "value that was before".
      const newHistory = { ...(newItem.installmentsHistory || {}) };
      
      for (let i = 0; i < newItem.installmentsPaid; i++) {
          if (newHistory[i] === undefined) {
              newHistory[i] = oldMonthlyAmount;
          }
      }
      newItem.installmentsHistory = newHistory;

      // Recalculate Total Amount based on history + future projections
      let projectedTotal = 0;
      for (let i = 0; i < newItem.installmentsCount; i++) {
          if (newHistory[i] !== undefined) {
              projectedTotal += newHistory[i];
          } else {
              projectedTotal += newMonthlyAmount;
          }
      }
      newItem.totalAmount = projectedTotal;

      onEdit(newItem);
      setSelectedItem(newItem);
      setIsEditMonthlyOpen(false);
      setEditMonthlyValue('');
  };

  const handleSaveInstallmentValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || editingInstallmentIndex === null || !editInstallmentValue) return;

    const cleanVal = editInstallmentValue.replace(/\./g, '').replace(',', '.');
    const newAmount = parseFloat(cleanVal);
    
    const newItem = { ...selectedItem };
    const newHistory = { ...(newItem.installmentsHistory || {}) };
    
    // Save specific override
    newHistory[editingInstallmentIndex] = newAmount;
    newItem.installmentsHistory = newHistory;

    onEdit(newItem);
    setSelectedItem(newItem);
    setIsEditInstallmentOpen(false);
    setEditingInstallmentIndex(null);
    setEditInstallmentValue('');
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

    // If total changes, we adjust the monthly amount base
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

  // --- MODAL OPENERS ---

  const openEditMonthlyModal = () => {
      if (!selectedItem) return;
      const current = getCurrentMonthlyAmount(selectedItem);
      setEditMonthlyValue(current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setIsEditMonthlyOpen(true);
  };

  const openEditInstallmentModal = (index: number, currentAmount: number) => {
      setEditingInstallmentIndex(index);
      setEditInstallmentValue(currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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

  // --- DETAIL VIEW (SPREADSHEET) ---
  if (selectedItem) {
    const currentMonthlyValue = getCurrentMonthlyAmount(selectedItem);
    
    // Calculate total paid so far
    let totalPaidSoFar = 0;
    for(let i = 0; i < selectedItem.installmentsPaid; i++) {
        totalPaidSoFar += getInstallmentAmount(selectedItem, i);
    }

    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-300 pb-32">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-6">
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
             <p className="text-xs text-gray-400">Clique nos blocos para editar valores</p>
          </div>

          <button 
             onClick={() => {
               onDelete(selectedItem.id);
               setSelectedItem(null);
             }}
             className="ml-auto w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Header Blocks (Spreadsheet Style) */}
        <div className="grid grid-cols-3 gap-1 mb-6">
          {/* Editable Monthly Value */}
          <button 
            onClick={openEditMonthlyModal}
            className="bg-purple-600 rounded-tl-xl p-3 flex flex-col items-center justify-center text-center h-20 relative hover:bg-purple-500 transition-all active:scale-95 group"
          >
            <div className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                 <Edit2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase text-white/80">Valor Mensal</span>
            <span className="text-sm font-bold text-white">
              R$ {currentMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </button>

          {/* Payment Status (Center) - Now Editable Title */}
          <button 
            onClick={openEditTitleModal}
            className="bg-indigo-600 p-3 flex flex-col items-center justify-center text-center h-20 relative hover:bg-indigo-500 transition-all active:scale-95 group"
          >
            <div className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                 <Edit2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase text-white/80">Pagamento</span>
            <span className="text-xs font-bold text-white leading-tight mt-1 line-clamp-2">{selectedItem.title}</span>
          </button>

          {/* Editable Total Value */}
          <button 
             onClick={openEditTotalModal}
             className="bg-blue-600 rounded-tr-xl p-3 flex flex-col items-center justify-center text-center h-20 relative hover:bg-blue-500 transition-all active:scale-95 group"
          >
             <div className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                 <Edit2 className="w-3 h-3 text-white" />
             </div>
             <span className="text-[10px] font-bold uppercase text-white/80">Valor Total</span>
             <span className="text-sm font-bold text-white">
               R$ {selectedItem.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
          </button>
          
          {/* Sub Header */}
          <div className="col-span-3 grid grid-cols-4 bg-orange-600 h-10 items-center px-2">
            <span className="text-[10px] font-bold text-black text-center border-r border-black/10 h-full flex items-center justify-center">PARCELA</span>
            <span className="text-[10px] font-bold text-black text-center col-span-2 border-r border-black/10 h-full flex items-center justify-center">DATA VENCIMENTO</span>
            <span className="text-[10px] font-bold text-black text-center h-full flex items-center justify-center">VALOR</span>
          </div>
        </div>

        {/* The Spreadsheet Grid */}
        <div className="flex flex-col gap-[2px] bg-[#1c1c1e] rounded-b-xl overflow-hidden">
          {Array.from({ length: selectedItem.installmentsCount }).map((_, index) => {
            const isPaid = index < selectedItem.installmentsPaid;
            const amount = getInstallmentAmount(selectedItem, index);
            
            return (
              <div 
                key={index}
                onClick={() => toggleInstallment(index)}
                className={`grid grid-cols-4 items-center h-14 px-2 cursor-pointer transition-colors border-b border-black/20 group relative ${
                  isPaid ? 'bg-green-600' : 'bg-[#2c2c2e] hover:bg-[#3a3a3c]'
                }`}
              >
                {/* Number */}
                <div className="flex justify-center">
                  <span className={`font-bold ${isPaid ? 'text-white' : 'text-accent'}`}>{index + 1}º</span>
                </div>
                
                {/* Date */}
                <div className="col-span-2 flex justify-center border-l border-white/5 h-full items-center">
                  <span className={`text-sm ${isPaid ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {getInstallmentDate(selectedItem.startDate, index)}
                  </span>
                </div>
                
                {/* Value Column */}
                <div className="flex flex-col justify-center items-center border-l border-white/5 h-full relative px-1 group/col">
                   <div className="flex items-center gap-1 z-10">
                       <span className={`text-xs font-bold ${isPaid ? 'text-white' : 'text-gray-300'}`}>
                         R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </span>
                       {isPaid && <Check className="w-3 h-3 text-white" />}
                   </div>
                   
                   {/* Specific Edit Button - Visible on column hover */}
                   <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          openEditInstallmentModal(index, amount);
                      }}
                      className="absolute inset-0 flex items-center justify-end pr-2 opacity-0 group-hover/col:opacity-100 transition-opacity bg-black/20"
                      title="Editar valor desta parcela"
                   >
                      <Edit2 className="w-3 h-3 text-white" />
                   </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="mt-4 flex rounded-xl overflow-hidden h-14 bg-[#1c1c1e] border border-white/5">
          <div className="flex-1 bg-green-600 flex items-center justify-center">
             <span className="font-bold text-black text-sm uppercase">JÁ FOI PAGO</span>
          </div>
          <div className="w-32 flex items-center justify-center">
             <span className="font-bold text-white text-lg">
               R$ {totalPaidSoFar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
          </div>
        </div>

         {/* --- MODALS --- */}

         {/* Edit Monthly Value Modal */}
         {isEditMonthlyOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">Novo Valor Mensal</h3>
                    <p className="text-xs text-gray-400 text-center -mt-2">Isso atualizará parcelas futuras e recalculará o total.</p>
                    
                    <form onSubmit={handleSaveNewMonthlyValue} className="flex flex-col gap-4 mt-2">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-accent">R$</span>
                            <input 
                                type="text" 
                                value={editMonthlyValue}
                                onChange={(e) => handleAmountChange(e, setEditMonthlyValue)}
                                className="w-full bg-[#2c2c2e] text-white text-2xl font-bold py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsEditMonthlyOpen(false)}
                                className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
         )}

         {/* Edit Title Modal */}
         {isEditTitleOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">Editar Nome</h3>
                    
                    <form onSubmit={handleSaveTitle} className="flex flex-col gap-4 mt-2">
                        <input 
                            type="text" 
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value.toUpperCase())}
                            className="w-full bg-[#2c2c2e] text-white text-xl font-bold py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center uppercase"
                            autoFocus
                            autoComplete="off"
                        />
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsEditTitleOpen(false)}
                                className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
         )}

         {/* Edit Total Modal */}
         {isEditTotalOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">Editar Valor Total</h3>
                    <p className="text-xs text-gray-400 text-center -mt-2">Isso ajustará o valor base das parcelas (Total / Qtd).</p>
                    
                    <form onSubmit={handleSaveTotal} className="flex flex-col gap-4 mt-2">
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-accent">R$</span>
                            <input 
                                type="text" 
                                value={editTotalValue}
                                onChange={(e) => handleAmountChange(e, setEditTotalValue)}
                                className="w-full bg-[#2c2c2e] text-white text-2xl font-bold py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsEditTotalOpen(false)}
                                className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
         )}

         {/* Edit Specific Installment Modal */}
         {isEditInstallmentOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white text-center">
                        Editar Parcela {editingInstallmentIndex !== null ? editingInstallmentIndex + 1 : ''}
                    </h3>
                    <p className="text-xs text-gray-400 text-center -mt-2">
                        Altere o valor apenas desta parcela.
                    </p>
                    
                    <form onSubmit={handleSaveInstallmentValue} className="flex flex-col gap-4 mt-2">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-accent">R$</span>
                            <input 
                                type="text" 
                                value={editInstallmentValue}
                                onChange={(e) => handleAmountChange(e, setEditInstallmentValue)}
                                className="w-full bg-[#2c2c2e] text-white text-2xl font-bold py-3 pl-12 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsEditInstallmentOpen(false);
                                    setEditingInstallmentIndex(null);
                                }}
                                className="flex-1 bg-[#2c2c2e] text-white h-12 rounded-xl font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm"
                            >
                                Salvar
                            </button>
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
          <h2 className="text-2xl font-bold text-white">Longo Prazo</h2>
          <p className="text-gray-400 text-sm">GERENCIE SUAS PARCELAS</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Wallet className="w-12 h-12 mb-4 opacity-20" />
            <p>Nenhuma transação parcelada.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const progress = (item.installmentsPaid / item.installmentsCount) * 100;
              
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-[#1c1c1e] rounded-[1.5rem] p-5 border border-white/5 active:scale-95 transition-all cursor-pointer shadow-lg"
                >
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="text-lg font-bold text-white uppercase">{item.title}</h3>
                       <span className="text-xs text-gray-400">Início: {new Date(item.startDate).toLocaleDateString('pt-BR')}</span>
                     </div>
                     <span className="text-xl font-bold text-accent">
                       R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                   </div>

                   {/* Progress Bar */}
                   <div className="relative h-4 bg-[#2c2c2e] rounded-full overflow-hidden mb-2">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                   
                   <div className="flex justify-between text-xs font-bold">
                     <span className="text-green-400">{item.installmentsPaid} Pagas</span>
                     <span className="text-gray-500">{item.installmentsCount} Total</span>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-2xl hover:bg-accentDark transition-colors z-40"
      >
        <Plus className="w-6 h-6 text-black" />
      </button>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-5">
            <h2 className="text-xl font-bold text-white">Nova Parcela</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
               
               <div className="flex flex-col gap-1">
                 <label className="text-xs text-gray-400 ml-2">Título</label>
                 <input 
                    className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent uppercase font-bold"
                    placeholder="EX: CARRO"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value.toUpperCase())}
                    required
                    autoComplete="off"
                 />
               </div>

               <div className="flex gap-4">
                 <div className="flex-1 flex flex-col gap-1">
                   <label className="text-xs text-gray-400 ml-2">Valor Total</label>
                   <input 
                      type="text"
                      inputMode="numeric"
                      className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold"
                      placeholder="0,00"
                      value={newTotal}
                      onChange={(e) => handleAmountChange(e, setNewTotal)}
                      required
                      autoComplete="off"
                   />
                 </div>
                 <div className="w-24 flex flex-col gap-1">
                   <label className="text-xs text-gray-400 ml-2">Vezes</label>
                   <input 
                      type="number"
                      className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold text-center"
                      placeholder="12"
                      value={newInstallments}
                      onChange={e => setNewInstallments(e.target.value)}
                      required
                      autoComplete="off"
                   />
                 </div>
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-xs text-gray-400 ml-2">Data Início</label>
                 <div className="relative">
                   <input 
                      type="date"
                      className="w-full bg-[#2c2c2e] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent font-bold"
                      value={newStartDate}
                      onChange={e => setNewStartDate(e.target.value)}
                      required
                      autoComplete="off"
                   />
                   <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                 </div>
               </div>

               <div className="flex gap-3 mt-2">
                 <button 
                   type="button" 
                   onClick={() => setIsAddModalOpen(false)}
                   className="flex-1 bg-[#2c2c2e] text-white h-14 rounded-xl font-bold"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="flex-1 bg-accent text-black h-14 rounded-xl font-bold"
                 >
                   Criar
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LongTermView;
