import { Effect } from 'effect';

export type OnboardingQuestionType = 'text' | 'visual' | 'budget' | 'size' | 'age';

export interface OnboardingQuestion {
  id: string;
  question: string;
  options: string[];
  type?: OnboardingQuestionType;
  imageUrls?: Record<string, string>;
  multiSelect?: boolean;
}

export const VISUAL_VIBE_OPTIONS: string[] = [
  'Streetwear',
  'Minimalist',
  'Old Money',
  'Boho Chic',
  'Dark Academia',
  'Athleisure',
  'Y2K',
  'Cottagecore',
  'Smart Casual',
  'Luxe',
];

export const getOnboardingQuestions = (): Effect.Effect<OnboardingQuestion[], never, never> => {
  return Effect.succeed([
    {
      id: 'gender',
      question: 'Which collection should we show you?',
      options: ['Men', 'Women', 'Both'],
      type: 'text',
    },
    {
      id: 'age',
      question: 'What is your age range?',
      options: ['18-24', '25-34', '35-44', '45+'],
      type: 'age',
    },
    {
      id: 'vibe',
      question: 'Pick the styles that speak to you',
      options: VISUAL_VIBE_OPTIONS,
      type: 'visual',
      multiSelect: true,
      imageUrls: {
        Streetwear: 'https://placehold.co/400x500/CD0268/FFFFFF?text=Streetwear',
        Minimalist: 'https://placehold.co/400x500/F8F9FA/212739?text=Minimalist',
        'Old Money': 'https://placehold.co/400x500/34889E/FFFFFF?text=Old+Money',
        'Boho Chic': 'https://placehold.co/400x500/E8338A/FFFFFF?text=Boho+Chic',
        'Dark Academia': 'https://placehold.co/400x500/212739/FFFFFF?text=Dark+Academia',
        Athleisure: 'https://placehold.co/400x500/10B981/FFFFFF?text=Athleisure',
        Y2K: 'https://placehold.co/400x500/F59E0B/FFFFFF?text=Y2K',
        Cottagecore: 'https://placehold.co/400x500/60A5FA/FFFFFF?text=Cottagecore',
        'Smart Casual': 'https://placehold.co/400x500/6C757D/FFFFFF?text=Smart+Casual',
        Luxe: 'https://placehold.co/400x500/212739/CD0268?text=Luxe',
      },
    },
    {
      id: 'sizes',
      question: 'What are your sizes?',
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      type: 'size',
    },
    {
      id: 'budget',
      question: 'What is your usual spend per item?',
      options: ['0-999', '1000-1999', '2000-3999', '4000-7999', '8000+'],
      type: 'budget',
    },
  ]);
};
