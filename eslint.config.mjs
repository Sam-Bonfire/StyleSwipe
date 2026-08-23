import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import hexagonal from 'eslint-plugin-hexagonal-architecture';
import perfectionist from 'eslint-plugin-perfectionist';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      perfectionist,
      'hexagonal-architecture': hexagonal,
    },
    rules: {
      /* Automated Sorting & Scannability */
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: [
            'type',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'object',
            'unknown',
          ],
        },
      ],

      /* Hexagonal Architecture Guardrails - Logic specific */
      'hexagonal-architecture/enforce': ['off'],
    },
  },
  {
    /* Targeting core domain logic for strict hexagonal enforcement */
    files: ['packages/core/**/*.ts', 'packages/infrastructure/**/*.ts'],
    ignores: ['packages/core/src/index.ts', 'packages/core/*.config.ts', 'packages/infrastructure/*.config.ts'],
    rules: {
      'hexagonal-architecture/enforce': ['error'],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    /* CORE PURITY: Block infrastructure imports in domain layer */
    files: ['packages/core/**/*.ts'],
    ignores: ['packages/core/src/index.ts', 'packages/core/*.config.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['convex', 'convex/*'],
              message: 'Core must be pure TS. Convex belongs in packages/infrastructure.',
            },
            {
              group: ['react', 'react-native', 'react-native/*', 'react/*'],
              message: 'Core must be framework-agnostic. React belongs in apps/ or ui-kit.',
            },
            {
              group: ['expo', 'expo-*', 'expo/*'],
              message: 'Core must be framework-agnostic. Expo belongs in apps/.',
            },
            {
              group: ['tamagui', '@tamagui/*'],
              message: 'Core must be pure TS. Tamagui belongs in packages/ui-kit.',
            },
          ],
        },
      ],
      /* EFFECT ENFORCEMENT: Ban imperative error patterns in core */
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ThrowStatement',
          message: 'Use Effect.fail(new TaggedError(...)) instead of throw. Core must use Effect for error handling.',
        },
        {
          selector: 'TryStatement',
          message: 'Use Effect.catchTag or Effect.catchAll instead of try/catch. Core must use Effect for error handling.',
        },
      ],
    },
  },
  {
    /* UI Kit - Relaxing type strictness for styling library compatibility */
    files: ['packages/ui-kit/**/*.tsx', 'packages/ui-kit/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    /* APPS - UI Adapter Layer: Block direct infrastructure imports */
    files: ['apps/**/*.tsx', 'apps/**/*.ts'],
    ignores: ['apps/scraper-service/**'], // Scraper service is a backend service, effectively infra
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['convex/react', 'convex/browser'],
              message: 'Violation of Hexagonal Architecture. UI adapters must use @app/infrastructure hooks, not direct Convex bindings.',
            },
            {
              group: ['@app/convex'],
              message: 'Violation of Hexagonal Architecture. UI adapters must use @app/infrastructure hooks, not direct Convex bindings.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/.expo/',
      '**/.next/',
      '**/.turbo/',
      '**/.graphite/',
      '**/convex/_generated/',
      '**/metro.config.js',
    ],
  },
);
