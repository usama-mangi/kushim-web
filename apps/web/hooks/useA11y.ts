/**
 * Accessibility Hooks for Kushim
 * WCAG 2.1 Level AA compliance utilities
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Screen reader announcements hook
 * Creates a live region for dynamic content updates
 * 
 * @example
 * const announce = useA11yAnnounce();
 * announce('Form submitted successfully', 'polite');
 */
export function useA11yAnnounce() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!regionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
      regionRef.current = liveRegion;
    }

    return () => {
      if (regionRef.current) {
        document.body.removeChild(regionRef.current);
        regionRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority);
      regionRef.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return announce;
}

/**
 * Focus trap hook for modals and dialogs
 * Ensures focus stays within a container
 * 
 * @example
 * const trapRef = useFocusTrap(isOpen);
 * <div ref={trapRef}>...</div>
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab on first element -> go to last
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab on last element -> go to first
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Keyboard navigation hook for lists and grids
 * Handles arrow key navigation
 * 
 * @example
 * const { selectedIndex, handleKeyDown } = useKeyboardNav(items.length, onSelect);
 * <div onKeyDown={handleKeyDown}>...</div>
 */
export function useKeyboardNav(
  itemCount: number,
  onSelect: (index: number) => void,
  orientation: 'vertical' | 'horizontal' = 'vertical'
) {
  const selectedIndexRef = useRef(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = selectedIndexRef.current;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, itemCount - 1);
          selectedIndexRef.current = nextIndex;
          onSelect(nextIndex);
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          selectedIndexRef.current = prevIndex;
          onSelect(prevIndex);
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, itemCount - 1);
          selectedIndexRef.current = nextIndex;
          onSelect(nextIndex);
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          selectedIndexRef.current = prevIndex;
          onSelect(prevIndex);
        }
        break;

      case 'Home':
        e.preventDefault();
        selectedIndexRef.current = 0;
        onSelect(0);
        break;

      case 'End':
        e.preventDefault();
        selectedIndexRef.current = itemCount - 1;
        onSelect(itemCount - 1);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(selectedIndexRef.current);
        break;
    }
  }, [itemCount, onSelect, orientation]);

  return { handleKeyDown, selectedIndex: selectedIndexRef.current };
}

/**
 * Generates unique IDs for ARIA relationships
 * 
 * @example
 * const { labelId, descriptionId } = useA11yIds('input');
 * <label id={labelId}>Name</label>
 * <input aria-labelledby={labelId} aria-describedby={descriptionId} />
 */
export function useA11yIds(prefix: string) {
  const idRef = useRef<string>(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);

  return {
    id: idRef.current,
    labelId: `${idRef.current}-label`,
    descriptionId: `${idRef.current}-desc`,
    errorId: `${idRef.current}-error`,
  };
}

/**
 * Detects if user prefers reduced motion
 * 
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 * <div className={prefersReducedMotion ? 'no-animation' : 'animated'} />
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useA11yState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Helper to avoid React import issues
function useA11yState<T>(initialValue: T): [T, (value: T) => void] {
  const ref = useRef<T>(initialValue);
  const setStateRef = useRef<(value: T) => void>(() => {});
  
  useEffect(() => {
    let mounted = true;
    setStateRef.current = (value: T) => {
      if (mounted) {
        ref.current = value;
      }
    };
    return () => { mounted = false; };
  }, []);

  return [ref.current, setStateRef.current];
}
