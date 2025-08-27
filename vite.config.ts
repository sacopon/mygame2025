import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/',
  // base: '/repo-name/', // GitHub Pages にアップロードする場合
  root: path.resolve(__dirname, 'src'),
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  }
});
