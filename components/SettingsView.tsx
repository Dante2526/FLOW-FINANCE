import React, { useState, useCallback } from 'react';
import { Palette, Check, Lock, Crown, Shield, ChevronRight, MessageSquareWarning, CalendarClock, Info, X } from 'lucide-react';
import { AppTheme, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface Props {
  currentThemeId: string;
  onSaveTheme: (theme: AppTheme) => void;
  isPro: boolean;
  onOpenProModal: () => void;
  appLanguage: AppLanguage;
  autoCreateMonth?: boolean;
  onToggleAutoCreateMonth?: (val: boolean) => void;
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

const SettingsView: React.FC<Props> = ({ currentThemeId, onSaveTheme, isPro, onOpenProModal, appLanguage, autoCreateMonth, onToggleAutoCreateMonth }) => {
  const [selectedThemeId, setSelectedThemeId] = useState(currentThemeId);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [showAutoMonthHelp, setShowAutoMonthHelp] = useState(false);

  const t = TRANSLATIONS[appLanguage].settings;

  const handleClosePrivacy = useCallback(() => setIsPrivacyOpen(false), []);

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

  const handleFeedback = () => {
    const subject = encodeURIComponent(t.feedbackSubject || "Flow Finance - Relatório de Bug / Feedback");
    const body = encodeURIComponent(t.feedbackBody || "Olá,\n\nEncontrei um problema/tenho uma sugestão:\n\n[Descreva aqui]\n\nImportante: Anexei prints ou vídeo para ajudar.");
    window.location.href = `mailto:naylanmoreira350@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-300 relative">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#1c1c1e] flex items-center justify-center border border-white/10">
          <Palette className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t.title}</h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-sm">{t.subtitle}</p>
            {isPro && (
              <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/50 flex items-center gap-1">
                <Crown className="w-3 h-3 fill-yellow-500" /> {t.proActive}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Theme Selection - Native Scroll */}
      <div className="pb-40">
        <h3 className="text-gray-400 text-sm font-bold ml-2 mb-4 uppercase tracking-wider">{t.systemColors}</h3>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {AVAILABLE_THEMES.map((theme) => {
            const isActive = selectedThemeId === theme.id;
            const isLocked = theme.isPro && !isPro;
            const localizedName = t.themes[theme.id as keyof typeof t.themes] || theme.name;

            return (
              <button
                key={theme.id}
                onClick={() => handleThemeClick(theme)}
                className={`relative h-24 rounded-[1.5rem] flex items-center justify-between px-5 transition-all duration-200 border-2 overflow-hidden group ${isActive
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
                    {localizedName}
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

        {/* Links Section (Feedback & Privacy) */}
        <div className="px-1 flex flex-col gap-2">
          {/* Feedback Button */}
          <button
            onClick={handleFeedback}
            className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/5 rounded-2xl p-4 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquareWarning className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <span className="text-white font-bold text-sm block">{t.feedbackTitle}</span>
                <span className="text-gray-500 text-xs">{t.feedbackSubtitle}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </button>

          {onToggleAutoCreateMonth && (
            <div className="flex flex-col gap-2">
              <div
                className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors overflow-hidden"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <CalendarClock className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-left flex flex-col">
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                      {t.autoCreateMonthTitle || 'Criar Mês Automaticamente'}
                      {!isPro && <Crown className="w-3 h-3 text-yellow-500" />}
                    </span>
                    <span className="text-gray-500 text-xs line-clamp-1">{t.autoCreateMonthDesc}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowAutoMonthHelp(!showAutoMonthHelp); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showAutoMonthHelp ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <div 
                    onClick={() => {
                      if (!isPro) {
                        onOpenProModal();
                        return;
                      }
                      onToggleAutoCreateMonth(!autoCreateMonth);
                    }}
                    className={`w-12 h-6 rounded-full flex items-center cursor-pointer transition-colors ${!isPro ? 'bg-gray-800' : autoCreateMonth ? 'bg-accent' : 'bg-gray-600'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${autoCreateMonth && isPro ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              </div>

              {showAutoMonthHelp && (
                <div className="mx-2 mt-1 p-5 bg-[#1c1c1e] border-l-4 border-accent rounded-r-2xl rounded-l-md shadow-lg animate-in slide-in-from-top-2 fade-in duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
                  <div className="flex items-start gap-3 relative z-10">
                     <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                     <p className="text-[13px] text-gray-300 leading-relaxed font-medium">
                       {t.autoCreateMonthHelp}
                     </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Privacy Policy Link */}
          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/5 rounded-2xl p-4 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-left">
                <span className="text-white font-bold text-sm block">{t.privacyTitle}</span>
                <span className="text-gray-500 text-xs">{t.privacySubtitle}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </button>

          <p className="text-center text-[10px] text-gray-600 mt-6 pb-4">
            {t.appVersion} • {t.performanceLabel}
          </p>
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 px-4 pt-6 pb-4 flex justify-center pointer-events-none z-50 bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-[2px]">
        <button
          onClick={handleConfirm}
          disabled={selectedThemeId === currentThemeId}
          className={`pointer-events-auto w-full max-w-md h-16 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 ${selectedThemeId === currentThemeId
            ? 'bg-[#1c1c1e] text-gray-500 translate-y-20 opacity-0'
            : 'bg-accent text-black hover:scale-105 opacity-100 translate-y-0'
            }`}
        >
          {t.confirmColor}
          <Check className="w-5 h-5" />
        </button>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={handleClosePrivacy} appLanguage={appLanguage} />

    </div>
  );
};

export default React.memo(SettingsView);