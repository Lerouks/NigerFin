import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'out/',
      'coverage/',
      'IPAY/',
      'test-results/',
      'playwright-report/',
      'next-env.d.ts',
      '*.config.js',
      '*.config.mjs',
      'sentry.*.config.*',
    ],
  },
];
