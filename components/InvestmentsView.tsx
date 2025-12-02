
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, Plus, PieChart, Building, Trash2, Edit2, Settings2, X, RefreshCw } from 'lucide-react';
import { Investment } from '../types';
import { InvestmentIcon } from './Icons';
import AddInvestmentModal from './AddInvestmentModal';

interface Props {
  investments: Investment[];
  onAdd: (inv: Omit<Investment, 'id'>) => void;
  onEdit: (inv: Investment) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  cdiRate: number;
  onUpdateCdiRate: (rate: number) => void;
}

interface SwipeableItemProps {
  inv: Investment;
  onEdit: (inv: Investment) => void;
  onDelete: (id: string) => void;
  getYieldLabel: (inv: Investment) => string;
}

const SwipeableInvestmentItem: React.FC<SwipeableItemProps> = ({ inv, onEdit, onDelete, getYieldLabel }) => {
  const [offsetX, setOffsetX] = useState(0);
  
  // Refs to track gestures
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startOffset = useRef(0);
  const isDragging = useRef(false);
  const interactionType = useRef<'scroll' | 'swipe' | null>(null);

  // Unified Handler Logic
  const handleStart = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    startOffset.current = offsetX;
    isDragging.current = true;
    interactionType.current = null;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current || startX.current === null || startY.current === null) return;
    
    // If locked to scroll, ignore drag
    if (interactionType.current === 'scroll') return;

    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;

    // Direction Locking Logic
    if (interactionType.current === null) {
       // Small threshold
       if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) return;

       if (Math.abs(diffY) > Math.abs(diffX)) {
         interactionType.current = 'scroll';
         return;
       } else {
         interactionType.current = 'swipe';
       }
    }
    
    // Perform Swipe
    if (interactionType.current === 'swipe') {
      const newOffset = startOffset.current + diffX;
      // Limits: -100 (Left/Delete) to +100 (Right/Edit)
      if (newOffset < -100) setOffsetX(-100);
      else if (newOffset > 100) setOffsetX(100);
      else setOffsetX(newOffset);
    }
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startX.current = null;
    startY.current = null;
    interactionType.current = null;

    if (offsetX < -40) {
      setOffsetX(-80);
    } else if (offsetX > 40) {
      setOffsetX(80);
    } else {
      setOffsetX(0);
    }
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  // Mouse Handlers
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      if (interactionType.current === 'swipe') {
        e.preventDefault();
      }
      handleMove(e.clientX, e.clientY);
    }
  };
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => {
    if (isDragging.current) handleEnd();
  };

  // Determine text color based on type
  const getValueColorClass = () => {
    if (inv.type === 'fii') return 'text-blue-500';
    if (inv.type === 'cdi' || inv.type === 'fixed') return 'text-emerald-500';
    return 'text-accent';
  };

  return (
    <div className="relative mb-3 h-20 rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing">
      {/* Background Layer (Actions) */}
      <div className={`absolute inset-0 flex justify-between transition-all duration-200 ${offsetX === 0 ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
        
        {/* Left Side (Edit) - Visible when swiping Right */}
        <button
          onClick={() => {
            onEdit(inv);
            setOffsetX(0);
          }}
          className="w-20 h-full bg-yellow-600 flex items-center justify-center text-white pl-2"
        >
          <Edit2 className="w-6 h-6" />
        </button>

        {/* Right Side (Delete) - Visible when swiping Left */}
        <button
          onClick={() => onDelete(inv.id)}
          className="w-20 h-full bg-red-600 flex items-center justify-center text-white pr-2"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      {/* Foreground Card */}
      <div 
        className="relative w-full h-full bg-[#1c1c1e] p-4 rounded-2xl flex items-center gap-4 border border-white/5 transition-transform duration-200 ease-out z-10 touch-pan-y"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
          <InvestmentIcon type={inv.type} />
          
          <div className="flex-1 min-w-0 pointer-events-none">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-white text-sm truncate">{inv.name}</h4>
              <span className={`${getValueColorClass()} font-bold text-sm whitespace-nowrap`}>
                R$ {(inv.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-medium uppercase bg-[#2c2c2e] px-2 py-0.5 rounded-md border border-white/5">
                  {inv.institution}
                </span>
                {/* Display Quantity if exists and is FII */}
                {inv.quantity && inv.quantity > 0 && (
                  <span className="text-[10px] text-blue-300 font-bold uppercase flex items-center gap-1">
                     {inv.quantity} <span className="text-[8px] opacity-70">COTAS</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                {getYieldLabel(inv)}
              </span>
            </div>
          </div>
      </div>
    </div>
  );
};


const InvestmentsView: React.FC<Props> = ({ investments, onAdd, onEdit, onDelete, onBack, cdiRate, onUpdateCdiRate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  // CDI Rate Modal Management
  const [isCdiModalOpen, setIsCdiModalOpen] = useState(false);
  const [tempCdiRate, setTempCdiRate] = useState('');
  const [isFetchingCdi, setIsFetchingCdi] = useState(false);
  
  // Auto-fetch CDI from BrasilAPI (sourced from BCB) on mount
  useEffect(() => {
    const fetchCdi = async () => {
      setIsFetchingCdi(true);
      try {
        const response = await fetch('https://brasilapi.com.br/api/taxas/v1');
        const data = await response.json();
        const selic = data.find((item: any) => item.nome === 'Selic');
        
        if (selic && selic.valor) {
          const apiRate = parseFloat(selic.valor);
          // Only update if different and valid
          if (!isNaN(apiRate) && apiRate > 0) {
            if (apiRate !== cdiRate) {
               onUpdateCdiRate(apiRate);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar taxa Selic:", error);
      } finally {
        setIsFetchingCdi(false);
      }
    };

    fetchCdi();
  }, []); // Run once on mount

  // --- SCROLL LOCK EFFECT FOR LOCAL MODALS ---
  useEffect(() => {
    const isAnyModalOpen = isAddModalOpen || isCdiModalOpen;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddModalOpen, isCdiModalOpen]);

  const safeInvestments = investments || [];

  // Totals - Portfolio Yield Calculation
  const { totalInvested, estimatedYearlyReturn, portfolioYield } = useMemo(() => {
    const total = safeInvestments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    const totalYearlyProfit = safeInvestments.reduce((acc, curr) => {
      let yearlyProfit = 0;
      const currentAmount = curr.amount || 0;
      const currentYield = curr.yieldRate || 0;
      
      if (curr.type === 'cdi' || curr.type === 'fixed') {
        const effectiveRate = (cdiRate / 100) * (currentYield / 100);
        yearlyProfit = currentAmount * effectiveRate;
      } else if (curr.type === 'fii') {
        yearlyProfit = currentAmount * (currentYield / 100);
      }
      return acc + yearlyProfit;
    }, 0);

    const yieldPercentage = total > 0 ? (totalYearlyProfit / total) * 100 : 0;

    return { 
      totalInvested: total, 
      estimatedYearlyReturn: totalYearlyProfit,
      portfolioYield: yieldPercentage
    };
  }, [safeInvestments, cdiRate]);

  const monthlyEstimate = estimatedYearlyReturn / 12;
  const monthlyYield = portfolioYield / 12;

  const handleEditClick = (inv: Investment) => {
    setEditingInvestment(inv);
    setIsAddModalOpen(true);
  };

  const handleNewClick = () => {
    setEditingInvestment(null);
    setIsAddModalOpen(true);
  };

  const handleSaveInvestment = (data: Omit<Investment, 'id'>) => {
    if (editingInvestment) {
      onEdit({ ...data, id: editingInvestment.id });
    } else {
      onAdd(data);
    }
  };

  const handleSaveCdi = (e: React.FormEvent) => {
    e.preventDefault();
    const newRate = parseFloat(tempCdiRate.replace(',', '.'));
    if (!isNaN(newRate)) {
      onUpdateCdiRate(newRate);
      setIsCdiModalOpen(false);
    }
  };

  const openCdiModal = () => {
    setTempCdiRate(cdiRate.toString());
    setIsCdiModalOpen(true);
  };

  const getYieldLabel = (inv: Investment) => {
     if (inv.type === 'cdi' || inv.type === 'fixed') return `${inv.yieldRate}% do CDI`;
     if (inv.type === 'fii') return `DY ${inv.yieldRate}% a.a.`;
     return '';
  };

  // --- LIST VIEW ---
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-28">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1c1c1e] flex items-center justify-center border border-white/10">
          <TrendingUp className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Carteira</h2>
          <button 
             onClick={openCdiModal}
             className="text-accent text-sm font-medium flex items-center gap-1 hover:text-white transition-colors cursor-pointer group"
          >
             {isFetchingCdi ? (
               <span className="flex items-center gap-2 text-gray-400"><RefreshCw className="w-3 h-3 animate-spin" /> Atualizando...</span>
             ) : (
               <>CDI Hoje: {cdiRate}% a.a. <Settings2 className="w-3 h-3 group-hover:rotate-90 transition-transform" /></>
             )}
          </button>
        </div>
      </div>

      {/* Patrimony Card */}
      <div className="bg-accent rounded-[2.5rem] p-6 flex flex-col gap-4 relative overflow-hidden flex-shrink-0 shadow-xl shadow-black/40 mb-8">
          <div className="absolute -top-8 -right-8 opacity-20 pointer-events-none rotate-12">
            <PieChart className="w-48 h-48 text-black" />
          </div>
          
          <div className="relative z-10">
            <span className="text-white/80 text-xs font-bold uppercase tracking-wider block mb-1">Patrimônio Total</span>
            <h3 className="text-4xl font-bold text-white tracking-tight">
              R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="h-px bg-white/20 w-full relative z-10" />
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm">
              <span className="text-white/70 text-[10px] font-bold uppercase block mb-1">Rendimento (Mês)</span>
              <p className="text-white font-bold text-lg">
                + R$ {monthlyEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-white/60 text-[10px] font-medium block mt-1">
                 {monthlyYield.toFixed(2)}% a.m.
              </span>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm">
               <span className="text-white/70 text-[10px] font-bold uppercase block mb-1">Anual Estimado</span>
               <p className="text-white font-bold text-lg">
                 + R$ {estimatedYearlyReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </p>
               <span className="text-white/60 text-[10px] font-medium block mt-1">
                 {portfolioYield.toFixed(2)}% a.a.
               </span>
            </div>
          </div>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1 mb-2">
             <h3 className="text-sm font-bold text-gray-400 uppercase">Seus Ativos</h3>
          </div>

          {safeInvestments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Building className="w-12 h-12 text-gray-500 mb-2" />
              <p className="text-xs text-gray-400">Nenhum ativo cadastrado.</p>
            </div>
          ) : (
            safeInvestments.map(inv => (
              <SwipeableInvestmentItem 
                key={inv.id}
                inv={inv}
                onEdit={handleEditClick}
                onDelete={onDelete}
                getYieldLabel={getYieldLabel}
              />
            ))
          )}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={handleNewClick}
        className="fixed bottom-28 right-6 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-2xl hover:bg-accentDark transition-colors z-40 active:scale-90"
      >
        <Plus className="w-6 h-6 text-black" />
      </button>

      {/* Add Investment Modal */}
      <AddInvestmentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveInvestment}
        investmentToEdit={editingInvestment}
      />

      {/* CDI Edit Modal */}
      {isCdiModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[#1c1c1e] w-full max-w-xs rounded-[2rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-4 max-h-[90dvh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold text-white">Taxa CDI / Selic</h3>
                 <button onClick={() => setIsCdiModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                 </button>
              </div>
              <p className="text-xs text-gray-400 -mt-2">Atualize a taxa para corrigir os cálculos de rendimento.</p>
              
              <form onSubmit={handleSaveCdi} className="flex flex-col gap-4 mt-2">
                 <div className="relative">
                    <input 
                       type="number" 
                       step="0.01"
                       name="cdi_rate_hidden"
                       value={tempCdiRate}
                       onChange={(e) => setTempCdiRate(e.target.value)}
                       className="w-full bg-[#2c2c2e] text-white text-2xl font-bold py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/50 text-center"
                       autoFocus
                       autoComplete="off"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                 </div>
                 <button 
                    type="submit" 
                    className="flex-1 bg-accent text-black h-12 rounded-xl font-bold text-sm"
                 >
                    Atualizar Taxa
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default InvestmentsView;
