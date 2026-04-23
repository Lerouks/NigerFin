import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
        serif: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        background: '#fafaf9',
        foreground: '#1a1a1a',
        primary: '#111111',
        secondary: '#f5f5f0',
        muted: '#f0efe9',
        gold: '#d4a843',
        accent: '#d4a843',
        success: '#22c55e',
        warning: '#eab308',
        error: '#ef4444',
        surface: '#ffffff',
      },
    },
  },
  plugins: [typography],
};

export default config;
