import { initializeStyleProfile, getOnboardingQuestions, OnboardingQuestion } from '@app/core';
import { Button, CategoryChip } from '@app/ui-kit';
import { api } from '@convex-api';
import { useMutation } from 'convex/react';
import { Effect } from 'effect';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, XStack, H1, H2, Text, Button as TamaguiButton, Progress } from 'tamagui';

export function OnboardingScreen() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const questions = Effect.runSync(getOnboardingQuestions()) as OnboardingQuestion[];

    const updateStyleProfile = useMutation(api.users.updateStyleProfile);

    const currentQuestion = questions[step];
    const progress = ((step + 1) / questions.length) * 100;

    const handleSelect = (option: string) => {
        setAnswers({ ...answers, [currentQuestion.id]: option });
    };

    const handleNext = async () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            // Final step - save profile, NavigationGuard will handle transition
            const styleProfile = initializeStyleProfile(answers);
            try {
                await updateStyleProfile({ styleProfile });
                // NavigationGuard in App.tsx will automatically navigate to Discovery
            } catch (e) {
                console.error("Failed to save onboarding", e);
            }
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <YStack flex={1} padding="$4" space="$6" justifyContent="center">
                <YStack space="$2">
                    <H1 textAlign="center">Personalize Your Style</H1>
                    <Progress value={progress} size="$2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Progress.Indicator animation={"quick" as any} />
                    </Progress>
                    <Text textAlign="center" color="$textSecondary">
                        Question {step + 1} of {questions.length}
                    </Text>
                </YStack>

                <YStack space="$4">
                    <H2 textAlign="center">{currentQuestion.question}</H2>
                    <XStack flexWrap="wrap" justifyContent="center" gap="$3">
                        {currentQuestion.options.map((option) => (
                            <CategoryChip
                                key={option}
                                label={option}
                                size="large"
                                selected={answers[currentQuestion.id] === option}
                                onToggle={() => handleSelect(option)}
                            />
                        ))}
                    </XStack>
                </YStack>

                <XStack space="$4" justifyContent="center">
                    {step > 0 && (
                        <TamaguiButton
                            onPress={handleBack}
                            variant="outlined"
                        >
                            Back
                        </TamaguiButton>
                    )}
                    <Button
                        variant="primary"
                        onPress={handleNext}
                        disabled={!answers[currentQuestion.id]}
                    >
                        {step === questions.length - 1 ? "Finish" : "Next"}
                    </Button>
                </XStack>
            </YStack>
        </SafeAreaView>
    );
}
