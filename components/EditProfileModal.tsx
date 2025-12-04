
import React, { useState, useEffect } from 'react';
import { X, Check, LogOut, Lock, Crown } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  onLogout: () => void;
  currentProfile: UserProfile;
}

// "Bonecos" / Character style avatars
const PRESET_AVATARS = [
  // FREE (First 4)
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Milo",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Lyla",
  // PRO (Last 8)
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Ginger",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Caleb",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Sam",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Willow",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Pepper",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Boo",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=George",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Annie",
];

const EditProfileModal: React.FC<Props> = ({ isOpen, onClose, onSave, onLogout, currentProfile }) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  // Developer toggle to simulate subscription status inside the edit modal
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.name);
      setAvatarUrl(currentProfile.avatarUrl);
      setIsPro(!!currentProfile.isPro);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSave({
      name,
      subtitle: '', 
      avatarUrl: avatarUrl,
      isPro: isPro // Persist the toggled state
    });
    onClose();
  };

  const handleAvatarSelect = (url: string, index: number) => {
    const isPremium = index >= 4;
    if (isPremium && !isPro) {
      // Shake animation or visual feedback could go here
      return;
    }
    setAvatarUrl(url);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-5 max-h-[90dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
            {isPro && (
               <div className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full text-[10px] font-bold border border-yellow-500/50 flex items-center gap-1">
                 <Crown className="w-3 h-3" fill="currentColor" /> PRO
               </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 min-h-0">
          
          {/* Current Avatar Preview */}
          <div className="flex justify-center flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-4 border-accent overflow-hidden relative shadow-lg shadow-accent/20 bg-white/10">
              <img 
                src={avatarUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <label className="text-gray-400 text-sm ml-2">Seu Nome</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="SEU NOME"
              className="w-full bg-[#2c2c2e] text-white text-lg py-3 px-6 rounded-2xl outline-none focus:ring-2 focus:ring-accent/50 placeholder-gray-600 uppercase font-bold"
              required
            />
          </div>

          {/* Avatar Selection */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="flex justify-between items-end ml-2 mr-2">
               <label className="text-gray-400 text-sm">Escolher Avatar</label>
               {!isPro && <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> 8 Bloqueados</span>}
            </div>
            
            <div className="grid grid-cols-4 gap-2 p-1 pb-2 overflow-y-auto max-h-48 no-scrollbar">
              {PRESET_AVATARS.map((url, index) => {
                const isPremium = index >= 4;
                const isLocked = isPremium && !isPro;
                const isSelected = avatarUrl === url;

                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => handleAvatarSelect(url, index)}
                    disabled={isLocked}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-accent opacity-100 scale-105 z-10' 
                        : 'border-transparent opacity-100 hover:opacity-80'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed bg-black/40' : 'bg-white/5'}`}
                  >
                    <img src={url} alt="Avatar" className={`w-full h-full object-cover ${isLocked ? 'blur-[2px] grayscale' : ''}`} />
                    
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Lock className="w-5 h-5 text-yellow-500 drop-shadow-md" />
                      </div>
                    )}
                    {isPremium && !isLocked && (
                      <div className="absolute top-1 right-1">
                         <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500 drop-shadow-md" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons Group */}
          <div className="flex flex-col gap-3 mt-auto flex-shrink-0">
            
             {/* Dev/Simulated PRO Toggle */}
             <div className="flex items-center justify-between bg-[#2c2c2e] p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                   <Crown className={`w-5 h-5 ${isPro ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`} />
                   <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isPro ? 'text-white' : 'text-gray-400'}`}>Status PRO</span>
                      <span className="text-[10px] text-gray-500">Simulação de Assinatura</span>
                   </div>
                </div>
                <button 
                   type="button"
                   onClick={() => setIsPro(!isPro)}
                   className={`w-12 h-7 rounded-full transition-colors relative ${isPro ? 'bg-yellow-500' : 'bg-gray-600'}`}
                >
                   <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isPro ? 'left-6' : 'left-1'}`} />
                </button>
             </div>

            <button 
              type="submit"
              className="w-full bg-accent text-black h-14 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark transition-colors shadow-lg"
            >
              Salvar Perfil
              <Check className="w-5 h-5" />
            </button>
            
            <button 
              type="button"
              onClick={onLogout}
              className="w-full bg-[#2c2c2e] text-red-500 h-14 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-colors"
            >
              Sair da Conta
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;