/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project sites live under /<repo>/
const repoBase = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base: repoBase,
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
})
