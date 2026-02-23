import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Use '/' for Vercel/Netlify, '/Gundam-Forge/' for GitHub Pages.
// Override via: VITE_BASE_URL=/ npm run build
const base = process.env.VITE_BASE_URL ?? '/Gundam-Forge/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
