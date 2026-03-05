import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
    // Deduplicate these packages to ensure only one instance is loaded
    dedupe: ['react', 'react-dom', 'jotai'],
  },
  optimizeDeps: {
    // Force Vite to optimize these dependencies
    include: ['react', 'react-dom'],
    // Exclude problematic packages from optimization if needed
    exclude: [],
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
