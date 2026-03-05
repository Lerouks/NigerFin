import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: '#fafaf9',
        foreground: '#1a1a1a',
        primary: '#111111',
        secondary: '#f5f5f0',
        muted: '#f0efe9',
        gold: '#d4a843',
      },
    },
  },
  plugins: [typography],
};

export default config;
