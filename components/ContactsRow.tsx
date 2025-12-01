
import React from 'react';
import { NotebookPen, Landmark, Calendar, BarChart3 } from 'lucide-react';
import { Contact } from '../types';

interface Props {
  contacts: Contact[];
  onAddClick: () => void;
  onContactClick: (contact: Contact) => void;
}

const ContactsRow: React.FC<Props> = ({ contacts, onAddClick, onContactClick }) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-medium text-gray-400 mb-4">ACESSO RÁPIDO</h2>
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar px-4 -mx-4">
        
        {/* Add Button - Bank/Finance */}
        <button 
          onClick={onAddClick}
          className="flex-shrink-0 w-20 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-lg shadow-black/20 hover:brightness-110 transition-all group border-2 border-transparent"
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
                className="flex-shrink-0 relative group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-20 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-lg shadow-black/20 group-hover:brightness-110 transition-all border-2 border-transparent group-hover:border-yellow-500/50">
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
                className="flex-shrink-0 relative group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-20 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-lg shadow-black/20 group-hover:brightness-110 transition-all border-2 border-transparent group-hover:border-red-500/50">
                   <Calendar className="w-7 h-7 text-red-500" strokeWidth={2} />
                </div>
              </div>
            );
          }

          // Special rendering for Analytics (ID 3)
          if (contact.id === '3') {
            return (
              <div 
                key={contact.id} 
                onClick={() => onContactClick(contact)}
                className="flex-shrink-0 relative group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-20 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center shadow-lg shadow-black/20 group-hover:brightness-110 transition-all border-2 border-transparent group-hover:border-blue-500/50">
                   <BarChart3 className="w-7 h-7 text-blue-500" strokeWidth={2} />
                </div>
              </div>
            );
          }

          // Standard Contact Image (Fallback)
          return (
            <div 
              key={contact.id} 
              onClick={() => onContactClick(contact)}
              className="flex-shrink-0 relative group cursor-pointer active:scale-95 transition-transform"
            >
              <img 
                src={contact.imageUrl} 
                alt={contact.name} 
                className="w-20 h-16 rounded-2xl object-cover border-2 border-transparent group-hover:border-accent transition-all shadow-lg shadow-black/20"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactsRow;
