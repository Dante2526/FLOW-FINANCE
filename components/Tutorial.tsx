import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

export interface TutorialStep {
  element: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  steps: TutorialStep[];
  labels: {
    next: string;
    prev: string;
    finish: string;
    skip: string;
  }
}

const Tutorial: React.FC<Props> = ({ isOpen, onClose, steps, labels }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [dialogStyle, setDialogStyle] = useState<React.CSSProperties>({ display: 'none', opacity: 0 });

  const dialogRef = useRef<HTMLDivElement>(null);
  const activeStep = steps[currentStep];

  const updatePositions = () => {
    if (!activeStep) {
      onClose();
      return;
    }
    const element = document.querySelector<HTMLElement>(activeStep.element);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // Delay to ensure scroll animation completes before measuring
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        const newHighlightStyle: React.CSSProperties = {
          position: 'fixed',
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
          borderRadius: computedStyle.borderRadius, // Dynamic border radius
          zIndex: 100,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Smoother transition
          pointerEvents: 'none',
        };

        // Passo 09 (índice 8) é a lista de transações. Adiciona efeito de foco.
        if (currentStep === 8) {
            newHighlightStyle.transform = 'scale(1.03)';
            newHighlightStyle.boxShadow = '0 0 20px rgba(255, 255, 255, 0.15), 0 0 0 9999px rgba(0, 0, 0, 0.7)';
        }
        
        setHighlightStyle(newHighlightStyle);

        if (dialogRef.current) {
          const dialogRect = dialogRef.current.getBoundingClientRect();
          const gap = 16;
          const pos = activeStep.position || 'bottom';
          let top = 0, left = 0;

          switch (pos) {
            case 'top':
              top = rect.top - dialogRect.height - gap;
              left = rect.left + (rect.width / 2) - (dialogRect.width / 2);
              break;
            case 'left':
              top = rect.top + (rect.height / 2) - (dialogRect.height / 2);
              left = rect.left - dialogRect.width - gap;
              break;
            case 'right':
              top = rect.top + (rect.height / 2) - (dialogRect.height / 2);
              left = rect.right + gap;
              break;
            case 'center':
              top = window.innerHeight / 2 - dialogRect.height / 2;
              left = window.innerWidth / 2 - dialogRect.width / 2;
              break;
            default: // bottom
              top = rect.bottom + gap;
              left = rect.left + (rect.width / 2) - (dialogRect.width / 2);
              break;
          }
          
          const clampedLeft = Math.max(16, Math.min(left, window.innerWidth - dialogRect.width - 16));
          const clampedTop = Math.max(16, Math.min(top, window.innerHeight - dialogRect.height - 16));

          setDialogStyle({
            position: 'fixed',
            top: `${clampedTop}px`,
            left: `${clampedLeft}px`,
            width: '320px', // Aumentado para acomodar os botões
            zIndex: 101,
            transition: 'all 0.3s ease-in-out',
            opacity: 1,
          });
        }
      }, 700); // Increased delay for scroll animation

    } else {
      console.warn(`Tutorial element not found: ${activeStep.element}`);
      onClose(); // Gracefully close if element is missing
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDialogStyle(prev => ({ ...prev, opacity: 0, transition: 'none' }));

      // More robust way to wait for layout to be stable
      const stableUpdate = async () => {
          try {
            // Wait for fonts to be ready as they can cause layout shifts
            if (document.fonts) {
                await document.fonts.ready;
            }
          } catch (e) {
            console.warn("Could not wait for document.fonts.ready", e);
          }
          // After fonts are ready, call the positioning logic
          updatePositions(); 
      };

      stableUpdate();

      window.addEventListener('resize', updatePositions);
      
      return () => {
        window.removeEventListener('resize', updatePositions);
      };
    }
  }, [isOpen, currentStep]);

  if (!isOpen || !activeStep) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in duration-300" onClick={handleBackdropClick}>
      <div style={highlightStyle} />
      
      <div ref={dialogRef} style={dialogStyle}>
        <div className="bg-[#2c2c2e] p-5 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white">{activeStep.title}</h3>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{activeStep.content}</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-[#1c1c1e] px-2 py-1 rounded-full ml-2">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            {/* Botão Pular (Ação Secundária) */}
            <button 
                onClick={onClose}
                className="h-14 px-6 text-gray-400 rounded-full text-base font-bold flex items-center justify-center hover:text-white transition-colors"
            >
                {labels.skip}
            </button>

            {/* Grupo de Navegação Principal */}
            <div className="flex items-center gap-3">
                {/* Botão Voltar (condicional) */}
                {currentStep > 0 && (
                    <button 
                        onClick={handlePrev}
                        className="h-14 w-auto px-6 bg-[#3a3a3c] text-white rounded-full text-base font-bold flex items-center justify-center gap-2 hover:bg-[#4a4a4c] transition-all duration-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {labels.prev}
                    </button>
                )}
                
                {/* Botão Próximo/Finalizar */}
                <button 
                    onClick={handleNext}
                    className="h-14 w-auto px-6 bg-[#00D67E] text-black rounded-full text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#00D67E]/30 hover:brightness-105 active:scale-95 transition-all"
                >
                    {currentStep === steps.length - 1 ? labels.finish : labels.next}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
