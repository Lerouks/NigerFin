import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Next.js recommended rules (core-web-vitals includes React + Next.js + TypeScript plugins)
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Project-specific overrides
  {
    rules: {
      // Warn on unused vars but allow underscore-prefixed ones
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Allow explicit any as warning (not error) during migration
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow img element in components that don't need optimization
      '@next/next/no-img-element': 'warn',
    },
  },

  // Ignore build artifacts and generated files
  {
    ignores: [
      '.next/',
      'node_modules/',
      'out/',
      'coverage/',
      '*.config.js',
      '*.config.mjs',
      'sentry.*.config.*',
    ],
  },
];
