// eslint.config.js
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import securityPlugin from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended, // 型チェックのない推奨設定を使用
  {
    // 型チェック付きの設定はソースコードファイルにのみ適用
    files: ['**/*.{ts,tsx}'],
    ...tseslint.configs.recommendedTypeChecked[0],
    languageOptions: {
      parserOptions: {
        projectService: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // React設定
  {
    files: ['**/*.{jsx,tsx}', '**/*.{js,ts}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      // React関連のルール
      'react/prop-types': 'off', // TypeScriptを使用しているため不要
      'react/react-in-jsx-scope': 'off', // React 17以降は不要
      'react/jsx-uses-react': 'off', // React 17以降は不要
      'react-hooks/rules-of-hooks': 'error', // Hooksのルールを厳格に
      'react-hooks/exhaustive-deps': 'warn', // 依存配列の問題を警告
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // アクセシビリティ
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/aria-props': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // インポート関連
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-unresolved': 'off', // TypeScriptが対応
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  // セキュリティ関連
  {
    plugins: {
      security: securityPlugin,
    },
    rules: {
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'warn',
    },
  },
  // 環境変数のキー名とGoogle Mapsの最適化関連
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'event',
          message: 'Use local parameter instead.',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-unused-vars': 'off', // TypeScriptで管理
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
  // Prettierとの競合を避ける
  prettierConfig
);
