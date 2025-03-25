import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  // エイリアス設定 - tsconfig.jsonと同期させる
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, './src/assets'),
      '@components': resolve(__dirname, './src/components'),
      '@constants': resolve(__dirname, './src/constants'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  test: {
    // jsdomを使用してブラウザ環境をシミュレート
    environment: 'jsdom',
    // テストファイルでグローバル関数（describe, it, expect）を使用可能に
    globals: true,
    // テスト前に実行するセットアップファイル
    setupFiles: ['./src/setupTests.ts'],
    // カバレッジ設定
    coverage: {
      provider: 'v8', // より正確なカバレッジ情報を提供
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        'src/setupTests.ts',
      ],
    },
    // CI環境での安定性を向上させる設定
    testTimeout: 10000, // タイムアウト時間を延長
    retry: process.env.CI ? 2 : 0, // CI環境では失敗したテストを再試行
  },
});
