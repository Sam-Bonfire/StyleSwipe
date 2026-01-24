import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';
import hexagonal from 'eslint-plugin-hexagonal-architecture';
import prettier from 'eslint-config-prettier';

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
            'perfectionist/sort-imports': ['error', {
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
            }],

            /* Hexagonal Architecture Guardrails */
            'hexagonal-architecture/enforce': ['error', {
                /* domain can only import from domain */
                /* application can import from domain + application */
                /* infrastructure can import from all */
            }],
        },
    },
    {
        /* Targeting core domain logic for strict hexagonal enforcement */
        files: ['packages/core/**/*.ts'],
        rules: {
            'hexagonal-architecture/enforce': ['error'],
        },
    },
    {
        ignores: ['node_modules/', 'dist/', '.expo/', '.next/', 'convex/_generated/'],
    }
);