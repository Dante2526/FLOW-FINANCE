import React, { useState, useEffect, useLayoutEffect } from 'react';
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
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const activeStep = steps[currentStep];

  const updateHighlight = () => {
    if (!activeStep) return;
    const element = document.querySelector(activeStep.element);
    if (element) {
      setHighlightRect(element.getBoundingClientRect());
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
      // If element is not found, maybe skip this step or end tour
      handleNext();
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay to allow UI to render before highlighting
      const timer = setTimeout(updateHighlight, 100);
      window.addEventListener('resize', updateHighlight);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateHighlight);
      };
    }
  }, [isOpen, currentStep]);

  useLayoutEffect(() => {
    if (isOpen) {
      updateHighlight();
    }
  }, [isOpen, currentStep]);

  if (!isOpen || !activeStep || !highlightRect) {
    return null;
  }

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

  const getDialogPosition = () => {
    const dialogHeight = 180; // Approximate height of the dialog
    const dialogWidth = 300;  // Approximate width
    const gap = 16; // Gap between highlight and dialog
    const pos = activeStep.position || 'bottom';

    switch (pos) {
      case 'top':
        return {
          top: highlightRect.top - dialogHeight - gap,
          left: highlightRect.left + (highlightRect.width / 2) - (dialogWidth / 2),
        };
      case 'left':
        return {
          top: highlightRect.top + (highlightRect.height / 2) - (dialogHeight / 2),
          left: highlightRect.left - dialogWidth - gap,
        };
      case 'right':
         return {
          top: highlightRect.top + (highlightRect.height / 2) - (dialogHeight / 2),
          left: highlightRect.right + gap,
        };
      case 'center':
        return {
          top: window.innerHeight / 2 - dialogHeight / 2,
          left: window.innerWidth / 2 - dialogWidth / 2,
        };
      case 'bottom':
      default:
        return {
          top: highlightRect.bottom + gap,
          left: highlightRect.left + (highlightRect.width / 2) - (dialogWidth / 2),
        };
    }
  };

  const dialogPos = getDialogPosition();

  // Clamp dialog position to be within viewport
  const clampedLeft = Math.max(16, Math.min(dialogPos.left, window.innerWidth - 300 - 16));
  
  const highlightStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${highlightRect.top}px`,
    left: `${highlightRect.left}px`,
    width: `${highlightRect.width}px`,
    height: `${highlightRect.height}px`,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
    borderRadius: '1.5rem', 
    zIndex: 100,
    transition: 'all 0.3s ease-in-out',
    pointerEvents: 'none',
  };

  const dialogStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${dialogPos.top}px`,
    left: `${clampedLeft}px`,
    width: '300px',
    zIndex: 101,
    transition: 'all 0.3s ease-in-out',
  };

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
      <div style={highlightStyle} />
      
      <div style={dialogStyle}>
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
