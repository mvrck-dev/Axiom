import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, '../engine/axiom-bridge/pkg'),
    },
  },
  server: {
    port: 4200,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
