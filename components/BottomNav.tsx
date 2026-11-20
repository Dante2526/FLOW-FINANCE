import React from 'react';
import { LayoutGrid, TrendingUp, Wallet, Settings, Plus } from 'lucide-react';
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
    moto?: string;
  };
}

const BottomNav: React.FC<Props> = ({ currentView, onChangeView, labels }) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-md z-50" data-tour-id="bottom-nav">
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.5rem] h-20 px-4 sm:px-6 flex items-center justify-between shadow-2xl shadow-black/50 transition-all duration-300">
        
        {/* Home Item */}
        {currentView === 'home' ? (
          <button data-tour-id="nav-home" className="h-14 px-4 sm:px-5 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-2.5 shadow-lg border border-white/5 transition-all">
             <LayoutGrid className="w-6 h-6 text-accent shrink-0" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.home}</span>
          </button>
        ) : (
          <button 
            data-tour-id="nav-home"
            onClick={() => onChangeView('home')}
            className="p-2.5 sm:p-3 text-gray-500 hover:text-white transition-colors"
            title={labels.home}
          >
             <LayoutGrid className="w-7 h-7" />
          </button>
        )}

        {/* Investment Item */}
        {currentView === 'investments' ? (
           <button data-tour-id="nav-investments" className="h-14 px-4 sm:px-5 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-2.5 shadow-lg border border-white/5 transition-all">
             <TrendingUp className="w-6 h-6 text-accent shrink-0" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.invest}</span>
          </button>
        ) : (
          <button 
            data-tour-id="nav-investments"
            onClick={() => onChangeView('investments')}
            className="p-2.5 sm:p-3 text-gray-500 hover:text-white transition-colors"
            title={labels.invest}
          >
             <TrendingUp className="w-7 h-7" />
          </button>
        )}

        {/* Motorcycle 3D FZ25 Item (+) */}
        {currentView === 'motorcycle' ? (
           <button data-tour-id="nav-motorcycle" className="h-14 px-4 sm:px-5 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-2 shadow-lg border border-white/5 transition-all">
             <Plus className="w-6 h-6 text-accent shrink-0" strokeWidth={2.5} />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.moto || 'FZ 25'}</span>
          </button>
        ) : (
          <button 
            data-tour-id="nav-motorcycle"
            onClick={() => onChangeView('motorcycle')}
            className="p-2.5 sm:p-3 text-gray-400 hover:text-white transition-all group"
            title={labels.moto || 'Yamaha Fazer FZ 25 2026'}
            aria-label="Yamaha Fazer FZ 25 2026"
          >
             <Plus className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </button>
        )}

        {/* Wallet Item (Long Term) */}
        {currentView === 'long-term' ? (
           <button data-tour-id="nav-wallet" className="h-14 px-4 sm:px-5 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-2.5 shadow-lg border border-white/5 transition-all">
             <Wallet className="w-6 h-6 text-accent shrink-0" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.wallet}</span>
          </button>
        ) : (
          <button 
            data-tour-id="nav-wallet"
            onClick={() => onChangeView('long-term')}
            className="p-2.5 sm:p-3 text-gray-500 hover:text-white transition-colors"
            title={labels.wallet}
          >
             <Wallet className="w-7 h-7" />
          </button>
        )}
        
        {/* Settings Item */}
        {currentView === 'settings' ? (
           <button data-tour-id="nav-settings" className="h-14 px-4 sm:px-5 bg-[#0a0a0b] rounded-2xl flex items-center justify-center gap-2.5 shadow-lg border border-white/5 transition-all">
             <Settings className="w-6 h-6 text-accent shrink-0" />
             <span className="text-accent font-bold text-sm tracking-wide">{labels.config}</span>
          </button>
        ) : (
          <button 
            data-tour-id="nav-settings"
            onClick={() => onChangeView('settings')}
            className="p-2.5 sm:p-3 text-gray-500 hover:text-white transition-colors"
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