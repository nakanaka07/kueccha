const prettierPlugin = require('eslint-plugin-prettier'); // Prettierプラグインをインポート
const tsPlugin = require('@typescript-eslint/eslint-plugin'); // TypeScript ESLintプラグインをインポート
const tsParser = require('@typescript-eslint/parser'); // TypeScriptパーサーをインポート
const reactPlugin = require('eslint-plugin-react'); // Reactプラグインをインポート

module.exports = [
  {
    languageOptions: {
      parser: tsParser, // TypeScriptパーサーを設定
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
      '@typescript-eslint': tsPlugin, // TypeScript ESLintプラグインを設定
      prettier: prettierPlugin, // Prettierプラグインを設定
      react: reactPlugin, // Reactプラグインを設定
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
      '.prettierrc.cjs', // Prettier設定ファイルを除外
      'eslint.config.cjs', // ESLint設定ファイルを除外
      'vite.config.js', // Vite設定ファイルを除外
      'dist/**', // 出力ディレクトリを除外
      '.vscode/**', // VSCode設定ディレクトリを除外
      'node_modules/**', // node_modulesディレクトリを除外
    ], // 特定のファイルを除外
  },
];
