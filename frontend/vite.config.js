import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Entire polyfill with globals
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true, // also covers `node:` imports
    })
  ],
  resolve: {
    alias: {
      // particularly cover `events` and others
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      // optional, but good practice:
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
    },
  },
  server: {
    port: 3000,
    proxy: {
     '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
})
