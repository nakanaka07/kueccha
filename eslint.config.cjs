const prettierPlugin = require('eslint-plugin-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');

module.exports = [
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest', // ECMAScriptのバージョンを設定
        sourceType: 'module', // モジュールシステムを設定
        ecmaFeatures: {
          jsx: true, // JSXのサポートを有効にする
        },
        project: './tsconfig.json', // TypeScriptのプロジェクト設定ファイルを指定
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      react: reactPlugin,
    },
    settings: {
      react: {
        version: 'detect', // Reactのバージョンを自動検出
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules, // TypeScriptの推奨ルールを適用
      ...reactPlugin.configs.recommended.rules, // Reactの推奨ルールを適用
      'prettier/prettier': 'error', // Prettierのルールをエラーとして扱う
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ], // 未使用の変数をエラーとして扱う
    },
    ignores: [
      '.prettierrc.cjs',
      'eslint.config.cjs',
      'vite.config.js',
      'dist/**',
      '.vscode/**',
      'node_modules/**',
    ], // 特定のファイルを除外
  },
];
