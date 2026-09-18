import { Button } from '@app/ui-kit';
import React from 'react';
import { YStack, XStack, Text, H1, Image } from 'tamagui';

import { AppLogo } from '../../components/AppLogo';

export interface WelcomeSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    id: 0,
    title: 'Swipe to discover',
    subtitle: 'Swipe right on styles you love, left on those you do not. Your taste, your rules.',
    image: 'https://placehold.co/400x500/CD0268/FFFFFF?text=Swipe',
  },
  {
    id: 1,
    title: 'AI learns your style',
    subtitle: 'Our AI curates a feed just for you. The more you swipe, the smarter it gets.',
    image: 'https://placehold.co/400x500/34889E/FFFFFF?text=AI+Style',
  },
  {
    id: 2,
    title: 'Shop with Partner',
    subtitle: 'Blend styles with your partner for shared discovery. Shop together, decide together.',
    image: 'https://placehold.co/400x500/212739/FFFFFF?text=Partner',
  },
];

type Props = {
  currentSlide: number;
  onNext: () => void;
  onSkip: () => void;
  onSlideChange: (index: number) => void;
};

export const WelcomeSlides: React.FC<Props> = ({ currentSlide, onNext, onSkip, onSlideChange }) => {
  const slide = WELCOME_SLIDES[currentSlide];

  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" justifyContent="space-between">
      <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
        <AppLogo />
        <Text color="$textSecondary" onPress={onSkip} pressStyle={{ opacity: 0.6 }}>
          Skip
        </Text>
      </XStack>

      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Image
          source={{ uri: slide.image }}
          width={280}
          height={320}
          borderRadius="$4"
          resizeMode="cover"
        />
        <YStack gap="$2" alignItems="center" paddingHorizontal="$4">
          <H1 textAlign="center" color="$textPrimary">
            {slide.title}
          </H1>
          <Text textAlign="center" color="$textSecondary" fontSize="$4">
            {slide.subtitle}
          </Text>
        </YStack>
        <XStack gap="$2" marginTop="$4">
          {WELCOME_SLIDES.map((_, idx) => (
            <YStack
              key={idx}
              width={idx === currentSlide ? 24 : 8}
              height={8}
              borderRadius="$full"
              backgroundColor={idx === currentSlide ? '$primary' : '$neutral300'}
              onPress={() => onSlideChange(idx)}
            />
          ))}
        </XStack>
      </YStack>

      <YStack gap="$3">
        <Button variant="primary" size="large" onPress={onNext}>
          {currentSlide === WELCOME_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
        </Button>
        {currentSlide < WELCOME_SLIDES.length - 1 && (
          <Button variant="ghost" onPress={onSkip}>
            Skip
          </Button>
        )}
      </YStack>
    </YStack>
  );
};
