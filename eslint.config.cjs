import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import tsConfigs from '@typescript-eslint/eslint-plugin';
import reactConfigs from 'eslint-plugin-react';

module.exports = {
  // TypeScriptパーサーの設定
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
};
