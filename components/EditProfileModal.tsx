
import React, { useState, useEffect } from 'react';
import { X, Check, LogOut } from 'lucide-react';
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
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Milo",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Lyla",
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

  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.name);
      setAvatarUrl(currentProfile.avatarUrl);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSave({
      name,
      subtitle: '', // Removed from UI, passing empty
      avatarUrl: avatarUrl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col gap-5 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 min-h-0">
          
          {/* Current Avatar Preview - Slightly smaller to save space */}
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

          {/* Avatar Selection - Horizontal Scroll (Carousel) to save vertical space */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <label className="text-gray-400 text-sm ml-2">Escolher Avatar</label>
            <div className="flex gap-3 overflow-x-auto p-1 pb-2 no-scrollbar">
              {PRESET_AVATARS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all bg-white/5 ${
                    avatarUrl === url
                      ? 'border-accent opacity-100 scale-105' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Buttons Group - Pushed to bottom if space permits, or stacks naturally */}
          <div className="flex flex-col gap-3 mt-auto flex-shrink-0">
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
