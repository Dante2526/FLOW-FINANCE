
import React from 'react';
import { X, ShieldCheck, Lock, Database, Eye } from 'lucide-react';
import { AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appLanguage: AppLanguage;
}

const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose, appLanguage }) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[appLanguage].settings.privacyContent;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col h-[80dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-none">{t.modalTitle}</h2>
                <p className="text-[10px] text-gray-400 mt-1">{t.modalSubtitle}</p>
             </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-6 text-sm text-gray-300 leading-relaxed">
           
           {/* Sections Rendered from Array */}
           {t.sections.map((section, index) => {
              // Icon mapping based on index (assuming fixed order)
              // 0: Database, 1: Lock, 2: Eye, 3: Bell (Generic), 4: Trash (Generic)
              let Icon = ShieldCheck; // Default
              if (index === 0) Icon = Database;
              if (index === 1) Icon = Lock;
              if (index === 2) Icon = Eye;

              return (
                <div key={index} className="flex flex-col gap-2">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        {index < 3 && <Icon className="w-4 h-4 text-accent" />}
                        {section.title}
                    </h3>
                    <p className="text-xs text-gray-400 text-justify">
                        {section.text}
                    </p>
                </div>
              );
           })}
           
           <div className="mt-4 pt-4 border-t border-white/5 text-center">
              <p className="text-[10px] text-gray-500">
                 {t.footer}
              </p>
           </div>

        </div>
        
        {/* Footer Action */}
        <div className="pt-4 shrink-0">
           <button 
             onClick={onClose}
             className="w-full h-12 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white rounded-xl font-bold text-sm transition-colors"
           >
             {t.closeBtn}
           </button>
        </div>

      </div>
    </div>
  );
};

export default React.memo(PrivacyPolicyModal);
