import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/out/**',
      '**/.source/**',
      '**/next-env.d.ts',
      'docs/mockups/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Core must never log (credentials and phone numbers could leak).
      'no-console': 'error',
    },
  },
  {
    // Free packages run in browsers, edge and Node (no Node-only imports),
    // and must never pull in commercial code. packages/core has no @types/node,
    // so Node globals like Buffer or process also fail typecheck there.
    files: ['packages/**/*.{ts,tsx}', 'registry/**/*.{ts,tsx}'],
    // Tool configs run in Node at build time and never ship.
    ignores: ['**/*.config.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['node:*'], message: 'Core must not use Node-only APIs.' },
            { group: ['**/pro/**', 'pro/**'], message: 'Never import pro/ from free packages.' },
          ],
        },
      ],
    },
  },
);
