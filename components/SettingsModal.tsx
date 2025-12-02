
import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { AppTheme } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (theme: AppTheme) => void;
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

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, currentThemeId, onSelectTheme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-6 max-h-[90dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surfaceLight flex items-center justify-center">
              <Palette className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-white">Configuração</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto no-scrollbar">
          <h3 className="text-gray-400 text-sm font-bold ml-2 mb-4 uppercase tracking-wider">Temas do Sistema</h3>
          
          <div className="grid grid-cols-2 gap-3 pr-1">
            {AVAILABLE_THEMES.map((theme) => {
              const isActive = currentThemeId === theme.id;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme)}
                  className={`relative h-20 rounded-2xl flex items-center justify-between px-4 transition-all duration-300 border-2 overflow-hidden group shrink-0 ${
                    isActive 
                      ? 'border-white bg-[#2c2c2e]' 
                      : 'border-transparent bg-[#2c2c2e] hover:bg-[#3a3a3c]'
                  }`}
                >
                  {/* Color Preview Blob */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2" 
                    style={{ backgroundColor: theme.primary }}
                  />
                  
                  <span className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {theme.name}
                  </span>

                  {/* Circle Preview */}
                  <div 
                    className="w-8 h-8 rounded-full shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {isActive && <Check className="w-5 h-5 text-black" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
