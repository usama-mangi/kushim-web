'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
  maxWidth?: number;
}

export default function Tooltip({ 
  content, 
  children, 
  position = 'auto', 
  delay = 500,
  maxWidth = 250,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [calculatedPosition, setCalculatedPosition] = useState(position);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Calculate optimal position based on viewport space
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 8; // Gap between trigger and tooltip

    let top = 0;
    let left = 0;
    let finalPosition = position;

    // Auto-calculate best position if set to auto
    if (position === 'auto') {
      const spaceTop = triggerRect.top;
      const spaceBottom = viewportHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewportWidth - triggerRect.right;

      // Choose position with most space
      if (spaceBottom >= tooltipRect.height + spacing) {
        finalPosition = 'bottom';
      } else if (spaceTop >= tooltipRect.height + spacing) {
        finalPosition = 'top';
      } else if (spaceRight >= tooltipRect.width + spacing) {
        finalPosition = 'right';
      } else if (spaceLeft >= tooltipRect.width + spacing) {
        finalPosition = 'left';
      } else {
        finalPosition = 'bottom'; // Fallback
      }
    }

    // Calculate coordinates based on final position
    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Keep tooltip within viewport bounds
    top = Math.max(spacing, Math.min(top, viewportHeight - tooltipRect.height - spacing));
    left = Math.max(spacing, Math.min(left, viewportWidth - tooltipRect.width - spacing));

    setCalculatedPosition(finalPosition);
    setCoords({ top, left });
  };

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Recalculate position when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition);

      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition);
      };
    }
  }, [isVisible]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  };

  const arrowClasses = {
    top: 'absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45',
    bottom: 'absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45',
    left: 'absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45',
    right: 'absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45',
    auto: '',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
        className="inline-block"
        aria-describedby={isVisible ? 'tooltip' : undefined}
      >
        {children}
      </div>

      {isVisible && (
        <div
          id="tooltip"
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-50 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-xl transition-opacity pointer-events-none"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            maxWidth: `${maxWidth}px`,
          }}
        >
          {content}
          <div className={arrowClasses[calculatedPosition]} />
        </div>
      )}
    </>
  );
}
