import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import a11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedRequiringTypeChecking,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': a11y,
      'import': importPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      // パスエイリアスの設定
      'import/resolver': {
        typescript: {}, // これによりtsconfig.jsonのパスが解決される
      }
    },
    rules: {
      // React関連のルール
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off', // TypeScriptを使用するため
      'react/react-in-jsx-scope': 'off', // React 17以降では不要

      // コード品質関連のルール
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-unused-vars': 'off', // TypeScriptの@typescript-eslint/no-unused-varsを使用
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 複雑性の制限
      'complexity': ['warn', 15], // 関数の循環的複雑性を制限
      'max-depth': ['warn', 4], // ネストの深さを制限
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],

      // アクセシビリティルール
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',

      // インポート順序と整理
      'import/order': ['warn', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        'pathGroups': [
          {
            'pattern': '@/**',
            'group': 'internal',
            'position': 'after'
          }
        ],
        'alphabetize': { 'order': 'asc', 'caseInsensitive': true }
      }],
      'import/no-duplicates': 'error',

      // 一貫性とフォーマット関連のルール
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'prefer-const': 'warn',
      'no-var': 'error',
      
      // TypeScript固有の厳格なルール
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
    },
  },
  // テストファイル用の特別な設定
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'max-lines-per-function': 'off', // テストは長くなりがち
      'max-depth': 'off',
      'complexity': 'off',
    },
  },
];