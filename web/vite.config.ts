import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// SharedArrayBuffer (WebLLM / Kokoro) needs cross-origin isolation.
export default defineConfig({
  base: './',
  plugins: [react()],
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
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        engine: resolve(import.meta.dirname, 'engine.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', 'kokoro-js'],
  },
  worker: {
    format: 'es',
  },
})
