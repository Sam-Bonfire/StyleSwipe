import { useCallback, useEffect, useState } from 'react';

import { LocalDatabase } from '../infrastructure/LocalDatabase';

export interface OnboardingProgress {
  step: number;
  answers: Record<string, string>;
  welcomeDone: boolean;
}

/**
 * Persists onboarding progress to the app-local database.
 * Screens read/write progress through this hook instead of
 * touching LocalDatabase directly.
 */
export function useOnboardingProgress() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [welcomeDone, setWelcomeDone] = useState<boolean>(false);

  // Load persisted state once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await LocalDatabase.getInstance();
        const saved = await db.getOnboardingState();
        if (!cancelled && saved) {
          setStep(saved.step);
          setAnswers(saved.answers);
          setWelcomeDone(saved.welcomeDone);
        }
      } catch {
        // ignore — start fresh
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const db = await LocalDatabase.getInstance();
        await db.saveOnboardingState({ step, answers, welcomeDone });
      } catch {
        // ignore
      }
    })();
  }, [step, answers, welcomeDone, loaded]);

  const clear = useCallback(async (): Promise<void> => {
    const db = await LocalDatabase.getInstance();
    await db.clearOnboardingState();
  }, []);

  return { loaded, step, setStep, answers, setAnswers, welcomeDone, setWelcomeDone, clear };
}
