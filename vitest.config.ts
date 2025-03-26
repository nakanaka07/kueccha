import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// プロジェクトのルートディレクトリからの相対パス解決を簡略化する関数
const resolvePath = (path: string) => resolve(__dirname, path);

export default defineConfig({
  plugins: [react()],

  // エイリアス設定 - tsconfig.jsonと完全に同期
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@assets': resolvePath('./src/assets'),
      '@components': resolvePath('./src/components'),
      '@constants': resolvePath('./src/constants'),
      '@hooks': resolvePath('./src/hooks'),
      '@types': resolvePath('./src/types'),
      '@utils': resolvePath('./src/utils'),
    },
  },

  test: {
    // 環境設定
    environment: 'jsdom', // ブラウザ環境をシミュレート
    globals: true, // グローバル関数（describe, it, expect）を使用可能に
    setupFiles: ['./src/setupTests.ts'],

    // カバレッジ設定
    coverage: {
      provider: 'v8', // より正確なカバレッジ情報
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        'src/setupTests.ts',
      ],
      // より詳細なカバレッジ設定を追加
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },

    // 安定性設定
    testTimeout: 10000, // タイムアウトを10秒に設定
    retry: process.env.CI ? 2 : 0, // CI環境では失敗したテストを再試行
    maxThreads: process.env.CI ? 2 : undefined, // CI環境ではスレッド数を制限
    minThreads: process.env.CI ? 1 : undefined,
  },
});
