'use client';

import { useEffect, useState, useRef } from 'react';
import { useTour } from '@/hooks/useTour';
import { useA11yAnnounce, useFocusTrap } from '@/hooks/useA11y';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function ProductTour() {
  const { 
    isActive, 
    currentStep, 
    totalSteps, 
    step, 
    nextStep, 
    prevStep, 
    skipTour 
  } = useTour();
  
  const announce = useA11yAnnounce();
  const trapRef = useFocusTrap(isActive);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  // Calculate target element position for spotlight
  useEffect(() => {
    if (!isActive || !step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(step.targetSelector!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, step.targetSelector]);

  // Calculate card position based on step position
  useEffect(() => {
    if (!isActive) return;

    const calculateCardPosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cardWidth = 480; // max-w-md
      const cardHeight = 300; // approximate

      let top = 0;
      let left = 0;

      if (step.position === 'center' || !targetRect) {
        // Center on screen
        top = (viewportHeight - cardHeight) / 2;
        left = (viewportWidth - cardWidth) / 2;
      } else if (step.position === 'bottom' && targetRect) {
        // Below target with some spacing
        top = targetRect.bottom + 20;
        left = targetRect.left + (targetRect.width - cardWidth) / 2;
      } else if (step.position === 'right' && targetRect) {
        // To the right of target
        top = targetRect.top + (targetRect.height - cardHeight) / 2;
        left = targetRect.right + 20;
      } else if (step.position === 'top' && targetRect) {
        // Above target
        top = targetRect.top - cardHeight - 20;
        left = targetRect.left + (targetRect.width - cardWidth) / 2;
      } else if (step.position === 'left' && targetRect) {
        // To the left of target
        top = targetRect.top + (targetRect.height - cardHeight) / 2;
        left = targetRect.left - cardWidth - 20;
      }

      // Ensure card stays within viewport
      top = Math.max(20, Math.min(top, viewportHeight - cardHeight - 20));
      left = Math.max(20, Math.min(left, viewportWidth - cardWidth - 20));

      setCardPosition({ top, left });
    };

    calculateCardPosition();
    window.addEventListener('resize', calculateCardPosition);

    return () => window.removeEventListener('resize', calculateCardPosition);
  }, [isActive, step.position, targetRect]);

  // Announce step changes to screen readers
  useEffect(() => {
    if (isActive && step) {
      announce(`Tour step ${currentStep + 1} of ${totalSteps}: ${step.title}`, 'polite');
    }
  }, [isActive, currentStep, totalSteps, step, announce]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          skipTour();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentStep > 0) prevStep();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, nextStep, prevStep, skipTour]);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />

      {/* Spotlight effect around target element */}
      {targetRect && (
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '12px',
          }}
        />
      )}

      {/* Tour Card */}
      <div
        ref={trapRef as React.RefObject<HTMLDivElement>}
        className="absolute bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full transition-all duration-300 ease-out"
        style={{
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" aria-hidden="true" />
            </div>
            <div>
              <h2 id="tour-title" className="text-lg font-bold text-white">
                {step.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={skipTour}
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            aria-label="Skip tour"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p id="tour-description" className="text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="px-6 pb-4 flex items-center justify-center space-x-2" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep 
                  ? 'w-8 bg-indigo-500' 
                  : i < currentStep 
                    ? 'w-1.5 bg-indigo-500/50' 
                    : 'w-1.5 bg-slate-700'
              }`}
              aria-label={`Step ${i + 1}${i === currentStep ? ' (current)' : i < currentStep ? ' (completed)' : ''}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between">
          <button
            onClick={skipTour}
            className="text-sm text-slate-500 hover:text-slate-300 transition font-medium"
          >
            Skip Tour
          </button>
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition flex items-center"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition flex items-center shadow-lg shadow-indigo-500/20"
              aria-label={currentStep === totalSteps - 1 ? 'Finish tour' : 'Next step'}
            >
              {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Screen reader instructions */}
      <div className="sr-only" role="status" aria-live="polite">
        Use arrow keys to navigate, Enter to continue, or Escape to skip the tour.
      </div>
    </div>
  );
}
