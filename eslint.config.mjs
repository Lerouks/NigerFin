import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

export default [
  ...nextCoreWebVitals,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    rules: {
      '@next/next/no-img-element': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  {
    ignores: [
      '.next/',
      '.next.nosync/',
      'node_modules/',
      'out/',
      'coverage/',
      'IPAY/',
      'test-results/',
      'playwright-report/',
      'scripts/',
      'next-env.d.ts',
      '*.config.js',
      '*.config.mjs',
      'sentry.*.config.*',
    ],
  },
];
