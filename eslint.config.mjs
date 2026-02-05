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
    rules: {
      'hexagonal-architecture/enforce': ['error'],
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
    ignores: ['node_modules/', 'dist/', '.expo/', '.next/', 'convex/_generated/'],
  },
);
