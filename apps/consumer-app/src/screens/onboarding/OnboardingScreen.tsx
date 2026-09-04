import { GetOnboardingQuestions, InitializeStyleProfile } from '@app/core';
import { useAnalytics, useCompleteOnboarding, useCurrentUser, useUpdateStyleProfile } from '@app/infrastructure';
import { Button, useToast } from '@app/ui-kit';
import { Effect } from 'effect';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, XStack, H1, H2, Text, Progress, Spinner } from 'tamagui';

import { generateEmbedding } from '../../infrastructure/InferenceEngine';
import { LocalDatabase } from '../../infrastructure/LocalDatabase';
import { VisualQuiz } from './VisualQuiz';
import { WelcomeSlides } from './WelcomeSlides';

export function OnboardingScreen() {
  const user = useCurrentUser();
  const questions = Effect.runSync(GetOnboardingQuestions.getOnboardingQuestions());
  const completeOnboarding = useCompleteOnboarding(generateEmbedding);
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();
  const updateStyleProfile = useUpdateStyleProfile();

  const [welcomeDone, setWelcomeDone] = useState<boolean>(false);
  const [welcomeSlide, setWelcomeSlide] = useState<number>(0);
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Load persisted state
  React.useEffect(() => {
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
        // ignore
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on change
  React.useEffect(() => {
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

  React.useEffect(() => {
    trackEvent('onboarding_started', undefined, { variant: 'onboarding_v1' });
  }, [trackEvent]);

  const currentQuestion = questions[step];
  const progress = welcomeDone ? ((step + 1) / questions.length) * 100 : 0;

  const handleWelcomeNext = (): void => {
    trackEvent('onboarding_slide_viewed', { slide: welcomeSlide }, { variant: 'onboarding_v1' });
    if (welcomeSlide < 2) {
      setWelcomeSlide(welcomeSlide + 1);
    } else {
      setWelcomeDone(true);
    }
  };

  const handleWelcomeSkip = (): void => {
    trackEvent('onboarding_slide_viewed', { slide: welcomeSlide, skipped: true }, { variant: 'onboarding_v1' });
    setWelcomeDone(true);
  };

  const handleAnswerChange = (value: string): void => {
    if (!currentQuestion) return;
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = async (): Promise<void> => {
    if (!currentQuestion) return;
    await trackEvent(
      'onboarding_step_completed',
      {
        step: step + 1,
        totalSteps: questions.length,
        questionId: currentQuestion.id,
        selectedOption: answers[currentQuestion.id],
      },
      { variant: 'onboarding_v1' },
    );

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setIsGenerating(true);
      try {
        if (user?._id) {
          await completeOnboarding(user._id, answers);
        }
        await trackEvent('onboarding_completed', { answers }, { variant: 'onboarding_v1' });
        const db = await LocalDatabase.getInstance();
        await db.clearOnboardingState();
      } catch (e) {
        console.error('Failed to save onboarding', e);
        showToast({ message: 'Failed to save preferences. Please try again.', variant: 'error' });
        setIsGenerating(false);
      }
    }
  };

  const handleSkip = async (): Promise<void> => {
    await trackEvent('onboarding_skipped', { step }, { variant: 'onboarding_v1' });
    try {
      if (user?._id) {
        const profile = Effect.runSync(InitializeStyleProfile.initializeStyleProfile({ gender: 'both' }));
        // Use default vector via infrastructure hook directly (Convex mutation)
        await updateStyleProfile({ styleProfile: profile as unknown as never });
      }
      const db = await LocalDatabase.getInstance();
      await db.clearOnboardingState();
      showToast({ message: 'You can personalize later in Profile', variant: 'info' });
    } catch (e) {
      console.error('Skip failed', e);
      showToast({ message: 'Could not skip. Please try again.', variant: 'error' });
    }
  };

  const handleBack = (): void => {
    if (step > 0) setStep(step - 1);
    else if (welcomeDone) setWelcomeDone(false);
  };

  if (!loaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      </SafeAreaView>
    );
  }

  if (!welcomeDone) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <WelcomeSlides
          currentSlide={welcomeSlide}
          onNext={handleWelcomeNext}
          onSkip={handleWelcomeSkip}
          onSlideChange={(idx) => {
            trackEvent('onboarding_slide_viewed', { slide: idx }, { variant: 'onboarding_v1' });
            setWelcomeSlide(idx);
          }}
        />
      </SafeAreaView>
    );
  }

  if (isGenerating) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" gap="$6" justifyContent="center" alignItems="center">
          <Spinner size="large" color="$primary" />
          <H2 textAlign="center">Designing Your Experience...</H2>
          <Text textAlign="center" color="$textSecondary">
            We are analyzing your preferences to curate the best styles for you.
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  const canProceed = Boolean(currentQuestion && answers[currentQuestion.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$4" gap="$6" justifyContent="center">
        <YStack gap="$2">
          <H1 textAlign="center">Personalize Your Style</H1>
          <Progress value={progress} size="$2">
            <Progress.Indicator />
          </Progress>
          <XStack justifyContent="space-between" alignItems="center">
            <Text color="$textSecondary">
              Question {step + 1} of {questions.length}
            </Text>
            <Text color="$primary" onPress={handleSkip} pressStyle={{ opacity: 0.6 }}>
              Skip
            </Text>
          </XStack>
          {step === 0 && Object.keys(answers).length > 0 && (
            <Text color="$textSecondary" fontSize="$2" textAlign="center">
              Continue where you left off
            </Text>
          )}
        </YStack>

        <YStack gap="$4" flex={1} justifyContent="center">
          {currentQuestion && (
            <VisualQuiz question={currentQuestion} value={answers[currentQuestion.id] ?? ''} onChange={handleAnswerChange} />
          )}
        </YStack>

        <XStack gap="$4" justifyContent="center">
          <Button onPress={handleBack} variant="outlined">
            Back
          </Button>
          <Button variant="primary" onPress={handleNext} disabled={!canProceed}>
            {step === questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </XStack>
      </YStack>
    </SafeAreaView>
  );
}
