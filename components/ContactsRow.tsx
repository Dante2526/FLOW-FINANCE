import React from 'react';
import { NotebookPen, Landmark, Calendar, BarChart3, Lock } from 'lucide-react';
import { Contact } from '../types';

interface Props {
  contacts: Contact[];
  onAddClick: () => void;
  onContactClick: (contact: Contact) => void;
  isPro?: boolean;
}

const ContactsRow: React.FC<Props> = ({ contacts, onAddClick, onContactClick, isPro = false }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-medium text-gray-400 mb-4 pl-1">ACESSO RÁPIDO</h2>
      <div className="grid grid-cols-4 gap-2">
        
        {/* Add Button - Bank/Finance */}
        <button 
          onClick={onAddClick}
          className="w-full aspect-[5/4] rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-lg shadow-black/20 hover:brightness-110 transition-all group border-2 border-transparent hover:border-purple-500/50"
          title="Adicionar Nova Fonte de Renda"
        >
          <Landmark className="w-7 h-7 text-purple-500 group-hover:text-purple-400 transition-colors" />
        </button>

        {/* Contact Avatars / Action Buttons */}
        {contacts.map((contact) => {
          // Special rendering for the Smart Notepad (ID 1)
          if (contact.id === '1') {
            return (
              <div 
                key={contact.id} 
                onClick={() => onContactClick(contact)}
                className="w-full relative group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-full aspect-[5/4] rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-lg shadow-black/20 group-hover:brightness-110 transition-all border-2 border-transparent group-hover:border-yellow-500/50">
                   <NotebookPen className="w-7 h-7 text-yellow-500" strokeWidth={2} />
                </div>
              </div>
            );
          }

          // Special rendering for Calendar (ID 2)
          if (contact.id === '2') {
            return (
              <div 
                key={contact.id} 
                onClick={() => onContactClick(contact)}
                className="w-full relative group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-full aspect-[5/4] rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-lg shadow-black/20 group-hover:brightness-110 transition-all border-2 border-transparent group-hover:border-red-500/50">
                   <Calendar className="w-7 h-7 text-red-500" strokeWidth={2} />
                </div>
              </div>
            );
          }

          // Special rendering for Analytics (ID 3) - PRO FEATURE
          if (contact.id === '3') {
            return (
              <div 
                key={contact.id} 
                onClick={() => onContactClick(contact)}
                className="w-full relative group cursor-pointer active:scale-95 transition-transform"
              >
                <div className={`w-full aspect-[5/4] rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 transition-all border-2 relative overflow-hidden ${
                  isPro 
                    ? 'bg-[#2c2c2e] group-hover:brightness-110 border-transparent group-hover:border-blue-500/50' 
                    : 'bg-[#1c1c1e] border-white/5 opacity-80'
                }`}>
                   {/* Se não for PRO, mostra ícone desativado + cadeado */}
                   {isPro ? (
                      <BarChart3 className="w-7 h-7 text-blue-500" strokeWidth={2} />
                   ) : (
                      <>
                        <BarChart3 className="w-7 h-7 text-gray-600 blur-[1px]" strokeWidth={2} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                           <Lock className="w-5 h-5 text-yellow-500 drop-shadow-md" strokeWidth={2.5} />
                        </div>
                      </>
                   )}
                </div>
              </div>
            );
          }

          // Standard Contact Image (Fallback)
          return (
            <div 
              key={contact.id} 
              onClick={() => onContactClick(contact)}
              className="w-full relative group cursor-pointer active:scale-95 transition-transform"
            >
              <img 
                src={contact.imageUrl} 
                alt={contact.name} 
                className="w-full aspect-[5/4] rounded-2xl object-cover border-2 border-transparent group-hover:border-accent transition-all shadow-lg shadow-black/20"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactsRow;