import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Fichier .mts : Vite le charge en ESM sans détour. Un .ts dans un paquet sans
// "type": "module" était lu comme du CommonJS et Vite 8.3 le signale à chaque
// lancement des tests. import.meta.url remplace __dirname, absent en ESM.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
