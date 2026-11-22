import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages project site: https://velvetfasion-a11y.github.io/BusinessCalendar/
  base: process.env.GITHUB_PAGES === '1' ? '/BusinessCalendar/' : './',
  plugins: [react()],
  build: {
    outDir: process.env.GITHUB_PAGES === '1' ? '../docs' : 'dist',
    emptyOutDir: true,
    target: 'es2022',
    cssMinify: true,
    modulePreload: { polyfill: false },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
  },
})
