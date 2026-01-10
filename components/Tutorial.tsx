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

        setHighlightStyle({
          position: 'fixed',
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
          borderRadius: computedStyle.borderRadius, // Dynamic border radius
          zIndex: 100,
          transition: 'all 0.3s ease-in-out',
          pointerEvents: 'none',
        });

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
            width: '300px',
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
        <div className="bg-[#2c2c2e] p-5 rounded-2xl border border-white/10 shadow-2xl relative flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white">{activeStep.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{activeStep.content}</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-[#1c1c1e] px-2 py-1 rounded-full">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <button 
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {labels.skip}
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrev}
                  className="h-10 px-4 bg-[#3a3a3c] text-white rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {labels.prev}
                </button>
              )}
              <button 
                onClick={handleNext}
                className="h-10 px-5 bg-accent text-black rounded-xl text-sm font-bold flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? labels.finish : labels.next}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;