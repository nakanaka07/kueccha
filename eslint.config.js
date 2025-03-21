/**
 * ESLint設定 - GitHub Pages静的サイト向け最適化
 */
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.d.ts',
      '.vite/**',
      'public/**',
      // 削除したサーバーコード関連ファイル
      'server.ts',
      'localhost.key',
      'localhost.crt',
      'openssl.cnf',
    ],
  },

  // メイン設定
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsx-a11y': jsxA11yPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    settings: {
      react: { version: '19', runtime: 'automatic' },
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },

    // 厳選したルール - GitHub Pages静的サイト向けに最適化
    rules: {
      // TypeScript
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unnecessary-condition': 'warn', // 不要な条件分岐を警告
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // null/undefinedチェックの最適化

      // React
      ...reactPlugin.configs.recommended.rules,
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/no-array-index-key': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-no-useless-fragment': 'warn', // 不要なフラグメントを警告
      'react/jsx-pascal-case': 'error', // コンポーネント名のPascalCase強制

      // Hooks
      ...reactHooksPlugin.configs.recommended.rules,
      'react-hooks/exhaustive-deps': 'warn',

      // アクセシビリティ - PWAとしての品質向上
      ...jsxA11yPlugin.configs.recommended.rules,
      'jsx-a11y/alt-text': 'error', // 画像代替テキスト必須
      'jsx-a11y/anchor-has-content': 'error', // リンクにコンテンツ必須

      // インポート順
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error', // 重複インポート防止

      // パフォーマンス関連 - 静的サイト向け
      'react/jsx-no-constructed-context-values': 'warn', // レンダリング時のコンテキスト作成回避

      // 一般
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error', // デバッガー文を禁止（本番環境向け）
      'max-lines-per-function': ['warn', 150],
      'prefer-const': 'error', // 再代入されない変数はconstを強制
      'no-unused-expressions': 'error', // 使われない式を禁止
    },
  },

  // テストファイル用
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**', '**/tests/**', '**/mocks/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
    },
  },

  // 設定ファイル用
  {
    files: ['*.config.{js,ts}', 'vite.config.*', 'scripts/**/*'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'no-console': 'off', // スクリプトでのコンソール出力を許可
    },
  },
];
