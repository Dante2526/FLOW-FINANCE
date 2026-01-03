
import React from 'react';
import { LayoutGrid, TrendingUp, Wallet, Settings } from 'lucide-react';
import { AppView } from '../types';

interface Props {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onInvestmentClick?: () => void;
  labels: {
    home: string;
    invest: string;
    wallet: string;
    config: string;
  };
}

const BottomNav: React.FC<Props> = ({ currentView, onChangeView, labels }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.5rem] h-20 px-6 flex items-center justify-between shadow-2xl shadow-black/50 transition-all duration-300">
        
        {/* Home Item */}
        {currentView === 'home' ? (
          <button className="h-14 px-6 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-3 shadow-lg border border-white/5 transition-all">
             <LayoutGrid className="w-6 h-6 text-accent" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.home}</span>
          </button>
        ) : (
          <button 
            onClick={() => onChangeView('home')}
            className="p-3 text-gray-500 hover:text-white transition-colors"
            title={labels.home}
          >
             <LayoutGrid className="w-7 h-7" />
          </button>
        )}

        {/* Investment Item */}
        {currentView === 'investments' ? (
           <button className="h-14 px-6 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-3 shadow-lg border border-white/5 transition-all">
             <TrendingUp className="w-6 h-6 text-accent" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.invest}</span>
          </button>
        ) : (
          <button 
            onClick={() => onChangeView('investments')}
            className="p-3 text-gray-500 hover:text-white transition-colors"
            title={labels.invest}
          >
             <TrendingUp className="w-7 h-7" />
          </button>
        )}

        {/* Wallet Item (Long Term) */}
        {currentView === 'long-term' ? (
           <button className="h-14 px-6 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-3 shadow-lg border border-white/5 transition-all">
             <Wallet className="w-6 h-6 text-accent" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.wallet}</span>
          </button>
        ) : (
          <button 
            onClick={() => onChangeView('long-term')}
            className="p-3 text-gray-500 hover:text-white transition-colors"
            title={labels.wallet}
          >
             <Wallet className="w-7 h-7" />
          </button>
        )}
        
        {/* Settings Item */}
        {currentView === 'settings' ? (
           <button className="h-14 px-6 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-3 shadow-lg border border-white/5 transition-all">
             <Settings className="w-6 h-6 text-accent" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.config}</span>
          </button>
        ) : (
          <button 
            onClick={() => onChangeView('settings')}
            className="p-3 text-gray-500 hover:text-white transition-colors"
            title={labels.config}
          >
             <Settings className="w-7 h-7" />
          </button>
        )}

      </div>
    </div>
  );
};

export default React.memo(BottomNav);
