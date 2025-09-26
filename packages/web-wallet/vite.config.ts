import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
    process: '{"env": {"SNAP_ORIGIN": "local:http://localhost:8080"}}'
  },
  optimizeDeps: {
    exclude: ['snap-utils']
  }
})
