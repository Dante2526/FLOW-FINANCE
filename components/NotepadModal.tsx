
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { X, Eraser, NotebookPen, PenTool, Trash2, Keyboard } from 'lucide-react';
import { TRANSLATIONS } from '../i18n';
import { AppLanguage } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  initialDrawing: string | null;
  onSave: (content: string, drawing: string | null) => void;
  lang?: AppLanguage;
}

const COLORS = [
  { id: 'white', value: '#ffffff' },
  { id: 'yellow', value: '#facc15' },
  { id: 'blue', value: '#3b82f6' },
  { id: 'green', value: '#22c55e' },
  { id: 'red', value: '#ef4444' },
];

type Tool = 'cursor' | 'pen' | 'eraser';

const NotepadModal: React.FC<Props> = ({ isOpen, onClose, initialContent, initialDrawing, onSave, lang = 'pt' }) => {
  const [content, setContent] = useState('');
  const [dynamicMaxHeight, setDynamicMaxHeight] = useState<string | number>('85vh');
  
  const [activeTool, setActiveTool] = useState<Tool>('cursor');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(3);
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [totalHeight, setTotalHeight] = useState(600); 
  const [containerWidth, setContainerWidth] = useState(0);

  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasData, setCanvasData] = useState<string | null>(initialDrawing);

  const savedImageDataRef = useRef<ImageData | null>(null);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setCanvasData(initialDrawing);
      setActiveTool('cursor');
      setShowClearConfirm(false);
      
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
      setTimeout(adjustHeight, 50); 
    }
  }, [isOpen, initialContent, initialDrawing]);

  const adjustHeight = () => {
    if (!textareaRef.current || !scrollContainerRef.current) return;
    
    const textarea = textareaRef.current;
    
    textarea.style.height = 'auto'; 
    const currentScrollHeight = textarea.scrollHeight;
    textarea.style.height = '100%'; 

    const minHeight = scrollContainerRef.current.clientHeight;
    
    const newHeight = Math.max(minHeight, currentScrollHeight);

    if (newHeight !== totalHeight) {
       if (canvasRef.current) {
         const ctx = canvasRef.current.getContext('2d');
         if (ctx && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
            try {
               savedImageDataRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            } catch (e) {
               console.warn("Failed to get image data", e);
            }
         }
       }
       setTotalHeight(newHeight);
    }
  };

  useLayoutEffect(() => {
     if (canvasRef.current && savedImageDataRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
           ctx.putImageData(savedImageDataRef.current, 0, 0);
        }
     }
  }, [totalHeight]);

  useEffect(() => {
     adjustHeight();
  }, [content]);

  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.contentRect.width > 0) {
                setContainerWidth(entry.contentRect.width);
                adjustHeight();
            }
        }
    });

    resizeObserver.observe(scrollContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isOpen]);

  useEffect(() => {
     if (isOpen && containerWidth > 0 && canvasRef.current && canvasData) {
         const ctx = canvasRef.current.getContext('2d');
         const img = new Image();
         img.src = canvasData;
         img.onload = () => {
             if (ctx && canvasRef.current) {
                 ctx.drawImage(img, 0, 0);
             }
         };
     }
  }, [containerWidth, isOpen]); 

  useEffect(() => {
    if (!isOpen) return;
    const handleVisualResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        setDynamicMaxHeight(vv.height - 20); 
      }
    };
    window.visualViewport?.addEventListener('resize', handleVisualResize);
    window.visualViewport?.addEventListener('scroll', handleVisualResize);
    handleVisualResize();
    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualResize);
      window.visualViewport?.removeEventListener('scroll', handleVisualResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const saveCanvas = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      return dataUrl;
    }
    return canvasData;
  };

  const handleClose = () => {
    const finalDrawing = saveCanvas();
    onSave(content, finalDrawing);
    onClose();
  };

  const handleClear = () => {
     setContent('');
     const canvas = canvasRef.current;
     if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           ctx.beginPath();
        }
     }
     setCanvasData(null);
     setShowClearConfirm(false);
     
     if (scrollContainerRef.current) {
        setTotalHeight(scrollContainerRef.current.clientHeight);
     }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
     if (activeTool === 'cursor' || !canvasRef.current) return;
     const ctx = canvasRef.current.getContext('2d');
     if (!ctx) return;

     setIsDrawing(true);
     const { x, y } = getCoordinates(e);

     ctx.beginPath();
     ctx.moveTo(x, y);
     
     if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 25;
     } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
     }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
     if (!isDrawing || activeTool === 'cursor' || !canvasRef.current) return;
     const ctx = canvasRef.current.getContext('2d');
     if (!ctx) return;
     
     const { x, y } = getCoordinates(e);
     ctx.lineTo(x, y);
     ctx.stroke();
  };

  const stopDrawing = () => {
     if (isDrawing) {
        setIsDrawing(false);
        if (canvasRef.current) {
            setCanvasData(canvasRef.current.toDataURL());
        }
     }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      <div 
        className="flex min-h-full p-4 text-center pointer-events-none"
        style={{ 
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' 
        }}
      >
        <div 
          className="pointer-events-auto relative m-auto bg-[#1c1c1e] w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col overflow-hidden text-left transition-all"
          style={{ 
            height: 600, 
            maxHeight: typeof dynamicMaxHeight === 'number' ? `${dynamicMaxHeight}px` : dynamicMaxHeight 
          }}
        >
          
          <div className="flex justify-between items-center p-5 shrink-0 bg-[#1c1c1e] z-20 border-b border-white/5 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center border border-white/5">
                  <NotebookPen className="w-5 h-5 text-yellow-500" />
               </div>
               <div>
                  <h2 className="text-lg font-bold text-white leading-none">{t.notepad.title}</h2>
                  <p className="text-[10px] text-gray-400 mt-1">{t.notepad.subtitle}</p>
               </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                   if (showClearConfirm) handleClear();
                   else setShowClearConfirm(true);
                }}
                className={`h-10 rounded-full flex items-center justify-center transition-all ${
                   showClearConfirm 
                     ? 'bg-red-500 w-auto px-3' 
                     : 'bg-[#2c2c2e] w-10 hover:bg-white/10'
                }`}
              >
                {showClearConfirm ? (
                   <span className="text-white text-xs font-bold whitespace-nowrap">{t.notepad.clearConfirm}</span>
                ) : (
                   <Trash2 className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              <button onClick={handleClose} className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accentDark transition-colors">
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden relative bg-[#2c2c2e]/50 scrollbar-thin scrollbar-thumb-gray-600">
             <div ref={contentWrapperRef} className="relative w-full" style={{ height: totalHeight }}>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextChange}
                  placeholder={t.notepad.placeholder}
                  className="absolute inset-0 w-full h-full bg-transparent text-white text-lg leading-relaxed outline-none resize-none placeholder-gray-600 font-medium p-5 overflow-hidden z-0"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  disabled={activeTool !== 'cursor'} 
                />
                <canvas
                   ref={canvasRef}
                   width={containerWidth}
                   height={totalHeight}
                   onMouseDown={startDrawing}
                   onMouseMove={draw}
                   onMouseUp={stopDrawing}
                   onMouseLeave={stopDrawing}
                   onTouchStart={startDrawing}
                   onTouchMove={draw}
                   onTouchEnd={stopDrawing}
                   className={`absolute inset-0 z-10 ${activeTool === 'cursor' ? 'pointer-events-none' : 'cursor-crosshair touch-none'}`}
                />
             </div>
          </div>

          <div className="p-4 shrink-0 bg-[#1c1c1e] border-t border-white/5 flex flex-col gap-3 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
             <div className="flex bg-[#2c2c2e] p-1.5 rounded-2xl gap-2">
                <button 
                  onClick={() => setActiveTool('cursor')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                     activeTool === 'cursor' 
                     ? 'bg-white text-black shadow-lg font-bold' 
                     : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                   <Keyboard className="w-5 h-5" />
                   <span className="text-xs">{t.notepad.type}</span>
                </button>
                
                <button 
                  onClick={() => setActiveTool('pen')}
                  className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                     activeTool === 'pen' 
                     ? 'bg-accent text-black shadow-lg font-bold' 
                     : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                   <PenTool className="w-5 h-5" />
                   <span className="text-xs">{t.notepad.draw}</span>
                </button>

                <button 
                  onClick={() => setActiveTool('eraser')}
                  className={`w-14 h-12 rounded-xl flex items-center justify-center transition-all ${
                     activeTool === 'eraser' 
                     ? 'bg-gray-600 text-white shadow-lg' 
                     : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                   <Eraser className="w-5 h-5" />
                </button>
             </div>

             {activeTool === 'pen' && (
                <div className="flex justify-between items-center px-2 animate-in slide-in-from-bottom-2 fade-in">
                   {COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setStrokeColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${strokeColor === c.value ? 'scale-125 border-white ring-2 ring-black/50' : 'border-transparent scale-100 hover:scale-110'}`}
                        style={{ backgroundColor: c.value }}
                      />
                   ))}
                   <div className="w-px h-6 bg-gray-700 mx-2" />
                   <div className="flex gap-2">
                      {[3, 6, 9].map((w) => (
                         <button 
                           key={w}
                           onClick={() => setLineWidth(w)}
                           className={`w-8 h-8 rounded-full bg-[#2c2c2e] flex items-center justify-center ${lineWidth === w ? 'ring-1 ring-white' : ''}`}
                         >
                            <div className="bg-white rounded-full" style={{ width: w + 2, height: w + 2 }} />
                         </button>
                      ))}
                   </div>
                </div>
             )}

             {activeTool === 'cursor' && (
                <div className="flex justify-center items-center gap-2 pb-1">
                   <p className="text-[10px] text-gray-500">{t.notepad.hint}</p>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotepadModal;
