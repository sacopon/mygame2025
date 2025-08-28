import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    base: isProd ? '/mygame2025/' : '/', // GitHub Pages にアップロードする場合はサブディレクトリ指定
    root: path.resolve(__dirname, 'src'),
    publicDir: path.resolve(__dirname, 'public'),
    build: {
      outDir: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      dedupe: ['pixi.js'],  // pixi の重複取り込みを防ぐ
    },
    // 依存最適化で pixi.js をひとつにまとめる
    optimizeDeps: {
      include: ['pixi.js'],
    },
    server: {
      host: true,
      port: 5173,
    }
  };
});
