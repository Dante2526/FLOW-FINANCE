import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contextData: any;
}

const AIChatOverlay: React.FC<Props> = ({ isOpen, onClose, contextData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Olá Henry! Sou seu assistente financeiro. Como posso ajudar com seu orçamento hoje?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const advice = await getFinancialAdvice(userMsg.text, contextData);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: advice
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full max-w-md bg-[#1c1c1e] sm:rounded-3xl rounded-t-[2.5rem] h-[85vh] sm:h-[600px] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1c1c1e]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
             </div>
             <div>
               <h3 className="font-bold text-lg">Assistente Flow</h3>
               <p className="text-xs text-green-400">Tecnologia Gemini 2.5</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0b]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-accent text-black rounded-tr-none' 
                    : 'bg-[#2c2c2e] text-gray-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-[#2c2c2e] p-4 rounded-2xl rounded-tl-none">
                 <div className="flex space-x-2">
                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-[#1c1c1e] border-t border-white/10">
          <div className="flex items-center gap-2 bg-[#2c2c2e] p-2 rounded-full">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre suas finanças..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-white placeholder-gray-500"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="w-10 h-10 bg-accent rounded-full flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIChatOverlay;