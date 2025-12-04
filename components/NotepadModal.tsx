
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Eraser, NotebookPen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void;
}

const NotepadModal: React.FC<Props> = ({ isOpen, onClose, initialContent, onSave }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleClose = () => {
    onSave(content);
    onClose();
  };

  const handleClear = () => {
    if (confirm('Tem certeza que deseja limpar tudo?')) {
      setContent('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    
    // Logic for Math patterns ending in "="
    if (newVal.length > content.length && newVal.endsWith('=')) {
      const lines = newVal.split('\n');
      const lastLine = lines[lines.length - 1];
      
      const regex = /([\d.,]+)\s*([\+\-\*\/])\s*([\d.,]+)\s*=$/;
      const match = lastLine.match(regex);

      if (match) {
        const num1Str = match[1].replace(/\./g, '').replace(',', '.'); 
        const operator = match[2];
        const num2Str = match[3].replace(/\./g, '').replace(',', '.');

        const n1 = parseFloat(num1Str);
        const n2 = parseFloat(num2Str);

        let result = 0;
        let validOperation = true;

        switch (operator) {
          case '+': result = n1 + n2; break;
          case '-': result = n1 - n2; break;
          case '*': result = n1 * n2; break;
          case '/': 
            if (n2 !== 0) result = n1 / n2; 
            else validOperation = false;
            break;
          default: validOperation = false;
        }

        if (validOperation && !isNaN(result)) {
          const formattedResult = result.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
          const newText = newVal + ' ' + formattedResult;
          setContent(newText);
          return;
        }
      }
    }

    setContent(newVal);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 
        Container:
        - h-[500px]: Altura base similar ao modal de Nova Fonte de Renda preenchido.
        - max-h-[90dvh]: Garante que nunca ultrapasse 90% da altura visível (útil quando teclado abre).
        - flex flex-col: Permite que o conteúdo interno encolha/cresça.
      */}
      <div className="bg-[#1c1c1e] w-full max-w-sm h-[500px] max-h-[90dvh] rounded-[2.5rem] shadow-2xl border border-white/5 relative flex flex-col transition-all overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center border border-white/5">
                <NotebookPen className="w-5 h-5 text-yellow-500" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white leading-none">Smart Notes</h2>
                <p className="text-[10px] text-gray-400 mt-1">Digite calculos (ex: 10 + 20 =)</p>
             </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleClear} 
              className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Limpar"
            >
              <Eraser className="w-5 h-5 text-gray-400" />
            </button>
            <button 
              onClick={handleClose} 
              className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accentDark transition-colors"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Paper Area - flex-1 allows it to fill space or shrink if parent gets smaller (keyboard) */}
        <div className="flex-1 min-h-0 px-2 pb-2">
           <div className="w-full h-full bg-[#2c2c2e]/50 rounded-[2rem] p-4 relative overflow-hidden border border-white/5">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                placeholder="Comece a digitar..."
                className="w-full h-full bg-transparent text-white text-lg leading-relaxed outline-none resize-none placeholder-gray-600 font-medium scrollbar-thin scrollbar-thumb-gray-600"
                style={{ fontFamily: 'Inter, sans-serif' }}
                autoFocus
              />
           </div>
        </div>

        {/* Footer info - shrink-0 ensures it stays visible */}
        <div className="px-6 pb-6 pt-2 flex justify-between text-xs text-gray-500 font-medium shrink-0">
           <span>{content.length} caracteres</span>
           <span className="flex items-center gap-1">
             <Save className="w-3 h-3" /> Salvo automaticamente
           </span>
        </div>

      </div>
    </div>
  );
};

export default NotepadModal;
