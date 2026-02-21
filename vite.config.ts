import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-radix': ['@radix-ui/react-slot', '@radix-ui/react-separator', 'radix-ui'],
        },
      },
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.wrangler/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
