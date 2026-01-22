/**
 * Product Tour State Management Hook
 * Manages the interactive onboarding tour for first-time users
 */

import { useState, useEffect, useCallback } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for spotlight
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Optional action to perform when step is shown
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Kushim',
    description: 'Your ambient work ledger that automatically connects conversations, issues, and PRs across all your tools. Let\'s take a quick tour to get you started.',
    position: 'center',
  },
  {
    id: 'command-bar',
    title: 'Command Bar - Your Control Center',
    description: 'Press ⌘K anytime to search artifacts or execute commands. Type to search, or use commands like "comment PR-123 Looks good!" to take action.',
    targetSelector: '#search',
    position: 'bottom',
  },
  {
    id: 'graph-viz',
    title: 'Context Graph Visualization',
    description: 'Navigate to the Context Graph to see how Kushim automatically links your work. Zoom, pan, and click nodes to explore connections. ML-assisted links are marked with a brain icon.',
    targetSelector: 'a[href="/context"]',
    position: 'right',
  },
  {
    id: 'context-groups',
    title: 'Auto-Discovered Context Groups',
    description: 'Kushim automatically clusters related artifacts into context groups using deterministic linking and ML scoring. Each group represents a coherent work context.',
    targetSelector: 'main',
    position: 'center',
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description: 'Start by connecting your data sources, then watch Kushim assemble your work graph in real-time. Press ⌘? anytime to access help and keyboard shortcuts.',
    position: 'center',
  },
];

const TOUR_STORAGE_KEY = 'kushim_tour_completed';

export function useTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true);

  // Check if user has completed tour
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(completed === 'true');
    
    // Auto-start tour for new users
    if (!completed) {
      // Delay to allow page to load
      setTimeout(() => setIsActive(true), 1000);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    completeTour();
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setHasCompletedTour(true);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(false);
    startTour();
  }, [startTour]);

  return {
    isActive,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    step: TOUR_STEPS[currentStep],
    hasCompletedTour,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    restartTour,
  };
}
