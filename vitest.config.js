import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests-ui/setup.js'],
    include: ['tests-ui/**/*.test.{js,jsx}'],
    restoreMocks: true,
    css: true,
  },
})
