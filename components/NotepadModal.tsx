
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Eraser, NotebookPen, Bug } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void;
}

const NotepadModal: React.FC<Props> = ({ isOpen, onClose, initialContent, onSave }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Debug & Layout Logic state
  const [debugInfo, setDebugInfo] = useState('');
  // Initialize with a safe default, will be overridden by JS
  const [dynamicMaxHeight, setDynamicMaxHeight] = useState<string | number>('85vh');

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  // --- LOGIC FOR SAMSUNG INTERNET / ANDROID KEYBOARD ---
  // Uses the VisualViewport API to determine the actual visible height 
  // when the virtual keyboard is up, which CSS 'vh' often gets wrong on Android.
  useEffect(() => {
    if (!isOpen) return;

    const handleVisualResize = () => {
      const vv = window.visualViewport;
      
      if (vv) {
        // Current visible height (e.g., screen height minus keyboard)
        const height = vv.height;
        // Top offset (scrolled amount)
        const offsetTop = vv.offsetTop; 
        
        setDebugInfo(`VV: ${height.toFixed(0)} | Win: ${window.innerHeight} | Top: ${offsetTop.toFixed(0)}`);
        
        // We set the modal's max-height to be slightly less than the visible area
        // to ensure the header and footer remain visible.
        // Subtracting 20px provides a small safety margin.
        setDynamicMaxHeight(height - 20); 
      } else {
        setDebugInfo(`Win: ${window.innerHeight} (No VisualViewport API)`);
      }
    };

    // Add listeners for resizing and scrolling of the visual viewport
    window.visualViewport?.addEventListener('resize', handleVisualResize);
    window.visualViewport?.addEventListener('scroll', handleVisualResize);
    window.addEventListener('resize', handleVisualResize);
    
    // Execute immediately to set initial size
    handleVisualResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualResize);
      window.visualViewport?.removeEventListener('scroll', handleVisualResize);
      window.removeEventListener('resize', handleVisualResize);
    };
  }, [isOpen]);

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
    <div className="fixed inset-0 z-[80] overflow-y-auto animate-in fade-in duration-200">
      {/* Fixed Backdrop Layer */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Scrollable Content Wrapper */}
      <div 
        className="flex min-h-full p-4 text-center pointer-events-none"
        style={{ 
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' 
        }}
      >
        {/* 
           Modal Container
           - pointer-events-auto: Re-enable clicks since wrapper disabled them
           - m-auto: Centers the modal vertically/horizontally in available space, 
             but allows it to stick to top if height is constrained.
           - height: 550px (Base preference)
           - maxHeight: Controlled via JS (dynamicMaxHeight) to fit above keyboard
        */}
        <div 
          className="pointer-events-auto relative m-auto bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col overflow-hidden text-left transition-all"
          style={{ 
            height: 550, 
            maxHeight: typeof dynamicMaxHeight === 'number' ? `${dynamicMaxHeight}px` : dynamicMaxHeight 
          }}
        >
          
          {/* Header */}
          <div className="flex justify-between items-center p-7 pb-4 shrink-0">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center border border-white/5">
                  <NotebookPen className="w-5 h-5 text-yellow-500" />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-white leading-none">Smart Notes</h2>
                  <p className="text-[10px] text-gray-400 mt-1">Calculadora de texto</p>
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

          {/* Footer info & Debug Log */}
          <div className="px-6 pb-6 pt-2 shrink-0 flex flex-col gap-1">
             <div className="flex justify-between text-xs text-gray-500 font-medium">
               <span>{content.length} caracteres</span>
               <span className="flex items-center gap-1">
                 <Save className="w-3 h-3" /> Salvo auto
               </span>
             </div>
             
             {/* DEBUG BAR (Temporary) */}
             <div className="mt-2 p-1.5 bg-black/40 rounded-lg border border-white/5 flex items-center justify-center gap-2">
                <Bug className="w-3 h-3 text-red-500" />
                <span className="text-[9px] font-mono text-gray-400 truncate max-w-full">
                  {debugInfo}
                </span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotepadModal;
