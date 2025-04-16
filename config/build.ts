import type { BuildOptions } from 'vite';

import { getEnvVar } from '../src/utils/env/core';

/**
 * Vite用のビルド設定を生成
 * @param isProd 本番環境かどうか
 * @returns ビルド設定オブジェクト
 */
export function createBuildOptions(isProd: boolean): BuildOptions {
  // 静的サイト向け最適化設定
  const optimizeMaps =
    isProd && getEnvVar({ key: 'VITE_OPTIMIZE_MAPS', defaultValue: 'true' }) === 'true';
  const enableCompression =
    isProd && getEnvVar({ key: 'VITE_ENABLE_COMPRESSION', defaultValue: 'true' }) === 'true';

  return {
    outDir: 'dist',
    sourcemap: !isProd,
    minify: isProd ? 'esbuild' : false,
    emptyOutDir: true,
    cssCodeSplit: false, // 静的サイト向けにCSSを一つのファイルに結合
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    target: 'esnext', // 最新ブラウザ向け最適化
    assetsInlineLimit: 4096, // 小さな画像をインライン化（4KB以下）
    // 静的サイト向け圧縮・最適化設定
    terserOptions: isProd
      ? {
          compress: {
            drop_console: getEnvVar({ key: 'VITE_DROP_CONSOLE', defaultValue: 'false' }) === 'true',
            pure_funcs:
              getEnvVar({ key: 'VITE_DROP_CONSOLE', defaultValue: 'false' }) === 'true'
                ? ['console.log', 'console.debug']
                : [],
          },
        }
      : undefined,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          maps: optimizeMaps
            ? ['@googlemaps/js-api-loader', '@googlemaps/markerclusterer', '@react-google-maps/api']
            : undefined,
          material: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          utils: ['dayjs', 'axios', 'lodash-es', 'csv-parse'],
        },
        // 静的サイト向け出力形式の最適化
        entryFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
        chunkFileNames: isProd ? 'assets/[name]-[hash].js' : 'assets/[name].js',
        assetFileNames: isProd ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
      },
    },
  };
}
