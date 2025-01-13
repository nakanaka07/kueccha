const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const tsConfigs = require('@typescript-eslint/eslint-plugin');
const reactConfigs = require('eslint-plugin-react');

module.exports = [
  {
    // TypeScriptパーサーの設定
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // ECMAScriptのバージョンを設定
        ecmaVersion: 'latest',
        // モジュールシステムを設定
        sourceType: 'module',
        // JSXのサポートを有効にする
        ecmaFeatures: {
          jsx: true,
        },
        // TypeScriptのプロジェクト設定ファイルを指定
        project: './tsconfig.json',
      },
    },
    // 使用するプラグインを設定
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      react: reactPlugin,
    },
    // Reactの設定
    settings: {
      react: {
        // Reactのバージョンを自動検出
        version: 'detect',
      },
    },
    // ESLintのルールを設定
    rules: {
      // TypeScriptの推奨ルールを適用
      ...tsConfigs.configs.recommended.rules,
      // Reactの推奨ルールを適用
      ...reactConfigs.configs.recommended.rules,
      // Prettierのルールをエラーとして扱う
      'prettier/prettier': 'error',
      // 未使用の変数をエラーとして扱う
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
    // 特定のファイルを除外
    ignores: ['.prettierrc.cjs', 'eslint.config.cjs', 'vite.config.js'],
  },
];
