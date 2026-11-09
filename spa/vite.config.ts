import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 8080,
    strictPort: false,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
  },
  preview: {
    port: 8080,
    strictPort: false,
    host: true,
    open: true
  }
});