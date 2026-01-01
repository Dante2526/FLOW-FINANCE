
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { X, BarChart3, TrendingUp, Calendar, Award, Repeat } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { Transaction, MonthSummary } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  months: MonthSummary[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c1c1e] p-3 rounded-xl shadow-xl pointer-events-none" style={{ zIndex: 1000 }}>
        <p className="text-gray-400 text-xs font-bold mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
          R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsModal: React.FC<Props> = ({ isOpen, onClose, transactions, months }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDims, setChartDims] = useState({ width: 0, height: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Safety checks
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeMonths = Array.isArray(months) ? months : [];

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(null); // Reset selection on open
      // Small delay to allow modal animation to settle before measuring
      const timer = setTimeout(() => {
        if (chartContainerRef.current) {
          setChartDims({
            width: chartContainerRef.current.offsetWidth,
            height: chartContainerRef.current.offsetHeight
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setChartDims({ width: 0, height: 0 });
    }
  }, [isOpen]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    // 1. Monthly Data for Chart
    const uniqueYears = new Set(safeMonths.map(m => m.year));
    const showYear = uniqueYears.size > 1;

    // Filter out months with 0 total to look cleaner, or keep them to show gaps
    // We sort months by Date (Year/Month) to ensure chronological order
    const sortedMonths = [...safeMonths].sort((a, b) => {
       const monthsMap: Record<string, number> = {
         'JANEIRO': 0, 'FEVEREIRO': 1, 'MARÇO': 2, 'ABRIL': 3, 'MAIO': 4, 'JUNHO': 5,
         'JULHO': 6, 'AGOSTO': 7, 'SETEMBRO': 8, 'OUTUBRO': 9, 'NOVEMBRO': 10, 'DEZEMBRO': 11
       };
       
       const yearA = parseInt(a.year) || 0;
       const yearB = parseInt(b.year) || 0;
       const yearDiff = yearA - yearB;
       
       if (yearDiff !== 0) return yearDiff;
       
       const monthA = monthsMap[a.month] !== undefined ? monthsMap[a.month] : -1;
       const monthB = monthsMap[b.month] !== undefined ? monthsMap[b.month] : -1;
       
       return monthA - monthB;
    });

    const chartData = sortedMonths.map(m => ({
      name: showYear ? `${m.month.substring(0, 3)}/${m.year.slice(2)}` : m.month.substring(0, 3),
      fullMonth: m.month,
      total: m.total,
      year: m.year
    }));

    // 2. Total Spend & Average
    const totalSpend = safeMonths.reduce((acc, curr) => acc + curr.total, 0);
    const averageSpend = safeMonths.length > 0 ? totalSpend / safeMonths.length : 0;

    // 3. Highest Month
    const highestMonth = safeMonths.length > 0 ? safeMonths.reduce((prev, current) => {
      return (prev.total > current.total) ? prev : current;
    }, safeMonths[0]) : { month: '-', total: 0 };

    // 4. Most Frequent Transaction Name
    const frequencyMap: Record<string, number> = {};
    
    safeTransactions.forEach(tx => {
      if (!tx.name) return;
      const name = tx.name.toUpperCase();
      frequencyMap[name] = (frequencyMap[name] || 0) + 1;
    });

    let mostFrequentName = '-';
    let maxFreq = 0;
    
    Object.entries(frequencyMap).forEach(([name, count]) => {
      if (count > maxFreq) {
        maxFreq = count;
        mostFrequentName = name;
      }
    });

    // 5. Biggest Single Category/Type split
    const subscriptionTotal = safeTransactions
      .filter(t => t.type === 'subscription')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
      
    const purchaseTotal = safeTransactions
      .filter(t => t.type === 'purchase')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    // Prevent division by zero later
    const safeTotalSpend = totalSpend > 0 ? totalSpend : 1;

    return {
      chartData,
      totalSpend,
      averageSpend,
      highestMonth,
      mostFrequent: { name: mostFrequentName, count: maxFreq },
      split: { subscription: subscriptionTotal, purchase: purchaseTotal },
      safeTotalSpend
    };
  }, [safeMonths, safeTransactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* CSS Injection to kill all focus rings and tap highlights on Chart elements */}
      <style>{`
        .recharts-wrapper, 
        .recharts-surface, 
        .recharts-layer, 
        .recharts-sector, 
        .recharts-rectangle,
        path.recharts-rectangle { 
          outline: none !important; 
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        *:focus {
          outline: none !important;
        }
      `}</style>

      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/5 relative flex flex-col max-h-[90dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-7 pb-4 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-none">Análise</h2>
                <p className="text-[10px] text-gray-400 mt-1">Estatísticas de Gastos</p>
             </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2">
          
          {/* Main Chart */}
          <div className="mb-6">
             {/* Fixed height container - Added Tap Highlight Transparent and No Outline */}
             <div 
               className="h-64 w-full bg-[#2c2c2e]/30 rounded-3xl relative overflow-hidden flex flex-col outline-none ring-0"
               style={{ WebkitTapHighlightColor: 'transparent' }}
             >
                <div className="absolute top-4 left-4 z-10">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Histórico Mensal</p>
                </div>
                
                <div className="w-full h-full pt-10 px-2 pb-2" ref={chartContainerRef}>
                  {chartDims.width > 0 && chartDims.height > 0 ? (
                      <BarChart 
                        width={chartDims.width} 
                        height={chartDims.height} 
                        data={stats.chartData} 
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6b7280', fontSize: 10 }} 
                          dy={10}
                          interval={0} 
                        />
                        <Tooltip 
                          content={<CustomTooltip />} 
                          cursor={false}
                          isAnimationActive={false}
                        />
                        <Bar 
                          dataKey="total" 
                          radius={[6, 6, 6, 6]}
                          onClick={(_, index) => setActiveIndex(index)}
                          activeBar={false}
                          strokeWidth={0}
                          isAnimationActive={false}
                        >
                          {stats.chartData.map((entry, index) => {
                             const isSelected = activeIndex === index;
                             const isHighest = entry.fullMonth === stats.highestMonth.month;
                             
                             let fill = '#2c2c2e';
                             
                             // Only show 'Highest' blue if NO interaction is happening (activeIndex is null)
                             // This ensures that when user clicks ANY bar, only that bar is colored, others fade to gray.
                             if (activeIndex === null && isHighest) {
                               fill = '#3b82f6';
                             }
                             
                             // Selection overrides everything
                             if (isSelected) {
                               fill = '#60a5fa'; 
                             }

                             return (
                               <Cell 
                                 key={`cell-${index}`} 
                                 fill={fill}
                                 stroke={isSelected ? "#ffffff" : "none"}
                                 strokeWidth={isSelected ? 2 : 0}
                                 style={{ outline: 'none' }}
                                 className="outline-none focus:outline-none"
                               />
                             );
                          })}
                        </Bar>
                      </BarChart>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
             {/* Total Spent */}
             <div className="bg-[#2c2c2e] p-4 rounded-2xl flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-orange-500/10">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Média Mensal</span>
                </div>
                <span className="text-lg font-bold text-white">
                  R$ {stats.averageSpend.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
             </div>

             {/* Highest Month */}
             <div className="bg-[#2c2c2e] p-4 rounded-2xl flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-red-500/10">
                    <Calendar className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Maior Gasto</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-lg font-bold text-white leading-none mb-1">
                     {stats.highestMonth.month ? stats.highestMonth.month.slice(0, 3) : '-'}
                   </span>
                   <span className="text-[10px] text-gray-500">
                     R$ {(stats.highestMonth.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                   </span>
                </div>
             </div>
          </div>

          {/* Insights Section */}
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Insights</h3>
          <div className="flex flex-col gap-3">
             
             {/* Frequent Item */}
             <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1c1c1e] shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                   <Repeat className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                   <p className="text-xs text-gray-400 font-medium mb-0.5">Mais Frequente</p>
                   <p className="text-sm font-bold text-white">{stats.mostFrequent.name}</p>
                </div>
                <div className="text-right">
                   <span className="text-lg font-bold text-white">{stats.mostFrequent.count}x</span>
                </div>
             </div>

             {/* Comparison Split */}
             <div className="p-4 rounded-2xl bg-[#1c1c1e] shadow-sm flex flex-col gap-3">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Assinaturas vs Compras</p>
                      <p className="text-[10px] text-gray-500">Distribuição de gastos</p>
                    </div>
                 </div>
                 
                 {/* Progress Bar Style Comparison */}
                 <div className="flex h-3 rounded-full overflow-hidden w-full mt-1">
                    <div 
                      className="bg-purple-500" 
                      style={{ width: `${(stats.split.subscription / stats.safeTotalSpend) * 100}%` }} 
                    />
                    <div 
                      className="bg-cyan-500" 
                      style={{ width: `${(stats.split.purchase / stats.safeTotalSpend) * 100}%` }} 
                    />
                 </div>
                 
                 <div className="flex justify-between text-[10px] font-bold mt-1">
                    <span className="text-purple-400 flex items-center gap-1">
                       <div className="w-2 h-2 rounded-full bg-purple-500" />
                       Assinaturas ({Math.round((stats.split.subscription / stats.safeTotalSpend) * 100) || 0}%)
                    </span>
                    <span className="text-cyan-400 flex items-center gap-1">
                       <div className="w-2 h-2 rounded-full bg-cyan-500" />
                       Compras ({Math.round((stats.split.purchase / stats.safeTotalSpend) * 100) || 0}%)
                    </span>
                 </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AnalyticsModal;
