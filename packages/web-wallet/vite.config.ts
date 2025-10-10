import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'events': path.resolve(__dirname, 'node_modules/events'),
      'buffer': path.resolve(__dirname, 'node_modules/buffer'),
      'process/browser': path.resolve(__dirname, 'node_modules/process/browser.js'),
      'assert': path.resolve(__dirname, 'node_modules/assert')
    },
    dedupe: ['react', 'react-dom']
  },
  define: {
    global: 'globalThis',
    'process.env.SNAP_ORIGIN': JSON.stringify('local:http://localhost:8080')
  },
  optimizeDeps: {
    include: ['@hathor/snap-utils', 'react', 'react-dom', 'react/jsx-runtime', 'events', 'buffer', 'process/browser', 'assert'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
