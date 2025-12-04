
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

  // The Magic Logic: Detect Math patterns ending in "="
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    
    // We only trigger calculation if the last character typed was "="
    // We compare lengths to ensure user is adding text, not deleting
    if (newVal.length > content.length && newVal.endsWith('=')) {
      
      // Attempt to find a math expression before the "="
      // Looks for: Number (float/int) -> Operator -> Number -> =
      // Captures things like: "100 + 50 =" or "50.5 * 2 ="
      // Supports line breaks before the expression starts
      const lines = newVal.split('\n');
      const lastLine = lines[lines.length - 1];
      
      const regex = /([\d.,]+)\s*([\+\-\*\/])\s*([\d.,]+)\s*=$/;
      const match = lastLine.match(regex);

      if (match) {
        const num1Str = match[1].replace(/\./g, '').replace(',', '.'); // sanitize for JS math
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
          // Format result back to PT-BR style
          const formattedResult = result.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
          
          // Append the result to the text
          const newText = newVal + ' ' + formattedResult;
          setContent(newText);
          return;
        }
      }
    }

    setContent(newVal);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-lg h-[85dvh] sm:h-[80dvh] rounded-t-[2.5rem] rounded-b-none sm:rounded-[2.5rem] p-1 shadow-2xl border border-white/5 relative flex flex-col">
        
        {/* Header (Integrated into the card look) */}
        <div className="flex justify-between items-center p-5 pb-2 shrink-0">
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

        {/* Paper Area */}
        <div className="flex-1 bg-[#2c2c2e]/50 m-2 rounded-[2rem] p-4 relative overflow-hidden border border-white/5">
           <textarea
             ref={textareaRef}
             value={content}
             onChange={handleChange}
             placeholder="Comece a digitar..."
             className="w-full h-full bg-transparent text-white text-lg leading-relaxed outline-none resize-none placeholder-gray-600 font-medium"
             style={{ fontFamily: 'Inter, sans-serif' }}
             autoFocus
           />
        </div>

        {/* Footer info - Added Safe Area handling for Bottom Sheet mode */}
        <div className="px-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 pt-1 flex justify-between text-xs text-gray-500 font-medium shrink-0">
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
