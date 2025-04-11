/* global module */
/**
 * プロジェクト共通のコードフォーマット設定
 *
 * KISS原則（シンプルさ優先）に基づく最小限の設定
 * すべての設定はプロジェクトのコード最適化ガイドラインに準拠
 */
module.exports = {
  // 基本設定（KISS原則：最小限の設定で明確さを実現）
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'es5',
  arrowParens: 'avoid',

  // 環境設定
  endOfLine: 'auto',
  // ファイル形式ごとの個別設定（YAGNI原則：現在必要な設定のみ）
  overrides: [
    // TypeScript/React ファイル用の設定
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript',
      },
    },

    // マークダウンファイル用の設定
    {
      files: '*.md',
      options: {
        printWidth: 80,
      },
    },

    // JSONファイル用の設定
    {
      files: ['*.json', '*.jsonc'],
      options: {
        printWidth: 80,
      },
    },

    // CSSファイル用の設定
    {
      files: '*.{css,scss,less}',
      options: {
        singleQuote: false,
      },
    },

    // テストファイル用の設定
    {
      files: ['*.test.{js,ts,jsx,tsx}', '**/__tests__/**/*.{js,ts,jsx,tsx}'],
      options: {
        printWidth: 120, // テストの記述に十分な幅を確保
      },
    },
  ],
};
