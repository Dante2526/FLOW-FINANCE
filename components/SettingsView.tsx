
import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { AppTheme } from '../types';

interface Props {
  currentThemeId: string;
  onSaveTheme: (theme: AppTheme) => void;
}

export const AVAILABLE_THEMES: AppTheme[] = [
  // Warm / Energetic
  { id: 'sunset-orange', name: 'Sunset', primary: '#f97316', secondary: '#ea580c' },
  { id: 'cyber-yellow', name: 'Cyber', primary: '#eab308', secondary: '#ca8a04' },
  { id: 'crimson-red', name: 'Crimson', primary: '#ef4444', secondary: '#dc2626' },
  
  // Cool / Tech
  { id: 'emerald-green', name: 'Emerald', primary: '#10b981', secondary: '#059669' },
  { id: 'neon-lime', name: 'Neon', primary: '#84cc16', secondary: '#65a30d' },
  { id: 'ocean-blue', name: 'Ocean', primary: '#3b82f6', secondary: '#2563eb' },
  { id: 'royal-purple', name: 'Royal', primary: '#a855f7', secondary: '#9333ea' },
  
  // Soft / Feminine / Elegant
  { id: 'hot-pink', name: 'Barbie', primary: '#ec4899', secondary: '#db2777' },
  { id: 'rose-gold', name: 'Rose', primary: '#f43f5e', secondary: '#e11d48' },
  { id: 'lavender', name: 'Soft', primary: '#d8b4fe', secondary: '#c084fc' },
  { id: 'aqua', name: 'Aqua', primary: '#22d3ee', secondary: '#0891b2' },
];

const SettingsView: React.FC<Props> = ({ currentThemeId, onSaveTheme }) => {
  const [selectedThemeId, setSelectedThemeId] = useState(currentThemeId);

  const handleConfirm = () => {
    const theme = AVAILABLE_THEMES.find(t => t.id === selectedThemeId);
    if (theme) {
      onSaveTheme(theme);
    }
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
          <p className="text-gray-400 text-sm">Personalize sua experiência</p>
        </div>
      </div>

      {/* Theme Selection - Native Scroll */}
      <div className="pb-32">
        <h3 className="text-gray-400 text-sm font-bold ml-2 mb-4 uppercase tracking-wider">Cores do Sistema</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {AVAILABLE_THEMES.map((theme) => {
            const isActive = selectedThemeId === theme.id;
            
            return (
              <button
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`relative h-24 rounded-[1.5rem] flex items-center justify-between px-5 transition-all duration-200 border-2 overflow-hidden group ${
                  isActive 
                    ? 'border-white bg-[#1c1c1e]' 
                    : 'border-transparent bg-[#1c1c1e] hover:bg-[#2c2c2e]'
                }`}
              >
                {/* Side Color Bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-2" 
                  style={{ backgroundColor: theme.primary }}
                />
                
                <span className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  {theme.name}
                </span>

                {/* Circle Indicator */}
                <div 
                  className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}
                  style={{ backgroundColor: isActive ? theme.primary : '#2c2c2e' }}
                >
                  {isActive && <Check className="w-5 h-5 text-black" strokeWidth={3} />}
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
