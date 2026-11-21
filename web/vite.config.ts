import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages project site: https://velvetfasion-a11y.github.io/BusinessCalendar/
  base: process.env.GITHUB_PAGES === '1' ? '/BusinessCalendar/' : './',
  plugins: [react()],
  build: {
    outDir: process.env.GITHUB_PAGES === '1' ? '../docs' : 'dist',
    emptyOutDir: true,
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', 'kokoro-js'],
  },
})
