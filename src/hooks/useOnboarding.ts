import { useState, useCallback } from 'react';

/* ---------------------------------------------------------------------------
   Onboarding Hook
   Manages onboarding state and localStorage persistence.
   --------------------------------------------------------------------------- */

const ONBOARDING_STORAGE_KEY = 'setsunaread-onboarding-completed';
const ONBOARDING_TOTAL_STEPS = 6;

export interface UseOnboardingReturn {
  /** Whether to show the onboarding guide */
  showGuide: boolean;
  /** Current step (0-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Skip the guide entirely */
  skipGuide: () => void;
  /** Mark the guide as completed */
  completeGuide: () => void;
}

/**
 * Custom hook for managing onboarding guide state.
 * Checks localStorage for first-time users and provides navigation controls.
 */
export function useOnboarding(): UseOnboardingReturn {
  const [showGuide, setShowGuide] = useState(() => {
    try {
      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return completed !== 'true';
    } catch {
      // localStorage not available (SSR or restricted), show guide
      return true;
    }
  });

  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_TOTAL_STEPS - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const skipGuide = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage errors
    }
    setShowGuide(false);
  }, []);

  const completeGuide = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage errors
    }
    setShowGuide(false);
  }, []);

  return {
    showGuide,
    currentStep,
    totalSteps: ONBOARDING_TOTAL_STEPS,
    nextStep,
    prevStep,
    skipGuide,
    completeGuide,
  };
}
