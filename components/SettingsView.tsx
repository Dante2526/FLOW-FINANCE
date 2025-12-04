import React, { useState } from 'react';
import { Palette, Check, Lock, Crown } from 'lucide-react';
import { AppTheme } from '../types';

interface Props {
  currentThemeId: string;
  onSaveTheme: (theme: AppTheme) => void;
  isPro: boolean;
  onOpenProModal: () => void;
}

// Extended interface internally to handle UI logic
interface ThemeOption extends AppTheme {
  isPro?: boolean;
}

export const AVAILABLE_THEMES: ThemeOption[] = [
  // FREE THEMES (4)
  { id: 'sunset-orange', name: 'Sunset', primary: '#f97316', secondary: '#ea580c' },
  { id: 'cyber-yellow', name: 'Cyber', primary: '#eab308', secondary: '#ca8a04' },
  { id: 'crimson-red', name: 'Crimson', primary: '#ef4444', secondary: '#dc2626' },
  { id: 'emerald-green', name: 'Emerald', primary: '#10b981', secondary: '#059669' },
  
  // PRO THEMES (7)
  { id: 'neon-lime', name: 'Neon', primary: '#84cc16', secondary: '#65a30d', isPro: true },
  { id: 'ocean-blue', name: 'Ocean', primary: '#3b82f6', secondary: '#2563eb', isPro: true },
  { id: 'royal-purple', name: 'Royal', primary: '#a855f7', secondary: '#9333ea', isPro: true },
  { id: 'hot-pink', name: 'Barbie', primary: '#ec4899', secondary: '#db2777', isPro: true },
  { id: 'rose-gold', name: 'Rose', primary: '#f43f5e', secondary: '#e11d48', isPro: true },
  { id: 'lavender', name: 'Soft', primary: '#d8b4fe', secondary: '#c084fc', isPro: true },
  { id: 'aqua', name: 'Aqua', primary: '#22d3ee', secondary: '#0891b2', isPro: true },
];

const SettingsView: React.FC<Props> = ({ currentThemeId, onSaveTheme, isPro, onOpenProModal }) => {
  const [selectedThemeId, setSelectedThemeId] = useState(currentThemeId);

  const handleConfirm = () => {
    const theme = AVAILABLE_THEMES.find(t => t.id === selectedThemeId);
    if (theme) {
      onSaveTheme(theme);
    }
  };

  const handleThemeClick = (theme: ThemeOption) => {
    if (theme.isPro && !isPro) {
      onOpenProModal();
      return;
    }
    setSelectedThemeId(theme.id);
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#1c1c1e] flex items-center justify-center border border-white/10">
          <Palette className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Configuração</h2>
          <div className="flex items-center gap-2">
             <p className="text-gray-400 text-sm">Personalize sua experiência</p>
             {isPro && (
                <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/50 flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-yellow-500" /> PRO ATIVO
                </span>
             )}
          </div>
        </div>
      </div>

      {/* Theme Selection - Native Scroll */}
      <div className="pb-32">
        <h3 className="text-gray-400 text-sm font-bold ml-2 mb-4 uppercase tracking-wider">Cores do Sistema</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {AVAILABLE_THEMES.map((theme) => {
            const isActive = selectedThemeId === theme.id;
            const isLocked = theme.isPro && !isPro;
            
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeClick(theme)}
                className={`relative h-24 rounded-[1.5rem] flex items-center justify-between px-5 transition-all duration-200 border-2 overflow-hidden group ${
                  isActive 
                    ? 'border-white bg-[#1c1c1e]' 
                    : isLocked
                      ? 'border-transparent bg-[#1c1c1e]/50 opacity-60'
                      : 'border-transparent bg-[#1c1c1e] hover:bg-[#2c2c2e]'
                }`}
              >
                {/* Side Color Bar */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-2 ${isLocked ? 'grayscale' : ''}`} 
                  style={{ backgroundColor: theme.primary }}
                />
                
                <div className="flex flex-col items-start">
                  <span className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {theme.name}
                  </span>
                  {theme.isPro && (
                     <span className="text-[9px] font-bold text-yellow-500 flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-yellow-500" /> PRO
                     </span>
                  )}
                </div>

                {/* Indicator (Check or Lock) */}
                <div 
                  className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}
                  style={{ backgroundColor: isActive ? theme.primary : (isLocked ? '#2c2c2e' : '#2c2c2e') }}
                >
                  {isActive && <Check className="w-5 h-5 text-black" strokeWidth={3} />}
                  {!isActive && isLocked && <Lock className="w-4 h-4 text-yellow-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Button - Fixed at bottom of view area */}
      <div className="fixed bottom-28 left-0 right-0 px-4 flex justify-center pointer-events-none z-50">
        <button 
          onClick={handleConfirm}
          disabled={selectedThemeId === currentThemeId}
          className={`pointer-events-auto w-full max-w-md h-16 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 ${
            selectedThemeId === currentThemeId 
              ? 'bg-[#1c1c1e] text-gray-500 translate-y-20 opacity-0' 
              : 'bg-accent text-black hover:scale-105 opacity-100 translate-y-0'
          }`}
        >
          Confirmar Cor
          <Check className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default SettingsView;