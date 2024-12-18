import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true, // ソースマップを生成 (デバッグに役立つ)
    rollupOptions: {
      output: {
        // ライブラリを個別のチャンクに分割
        // キャッシュ効率が向上し、ページの読み込み速度が改善される可能性がある
        manualChunks: {
          vendor: ['react', 'react-dom', '@react-google-maps/api', "@googlemaps/markerclusterer"], // react, react-dom, Google Maps API関連ライブラリをvendorチャンクにまとめる
        },
      },
    },
    chunkSizeWarningLimit: 1600, // チャンクサイズの警告制限を1600KBに設定
  },
});
