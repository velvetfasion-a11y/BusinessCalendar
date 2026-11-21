import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// SharedArrayBuffer (WebLLM / Kokoro) needs cross-origin isolation.
export default defineConfig({
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
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', 'kokoro-js'],
  },
  worker: {
    format: 'es',
  },
})
