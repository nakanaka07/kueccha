/**
 * Prettier設定 - GitHub Pages最適化版
 *
 * コード最適化ガイドラインに沿った設定:
 * - 一貫したコーディングスタイルを強制
 * - 可読性とメンテナンス性の向上
 * - チーム全体での統一されたフォーマット
 */
module.exports = {
  // 基本設定 - 可読性優先
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,

  // JSX関連設定 - React 19との互換性確保
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // 特殊設定
  arrowParens: 'always',
  endOfLine: 'lf', // Git LF標準化
  embeddedLanguageFormatting: 'auto',

  // 大規模ファイル処理の最適化
  rangeStart: 0,
  rangeEnd: Infinity,

  // ファイルタイプごとの上書き設定
  overrides: [
    {
      // マークダウンファイル - ドキュメント可読性重視
      files: ['*.md', '*.markdown'],
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      // JSON - GitHub Pagesで使用されるJSONファイル用
      files: ['*.json'],
      options: {
        printWidth: 80,
      },
    },
    {
      // CSS/SCSSファイル - モバイルファースト設計向け
      files: ['*.css', '*.scss'],
      options: {
        singleQuote: false,
      },
    },
    {
      // HTMLファイル - SEO最適化用
      files: ['*.html'],
      options: {
        printWidth: 120,
        htmlWhitespaceSensitivity: 'css',
      },
    },
    {
      // Tailwind対応
      files: ['*.{js,jsx,ts,tsx}'],
      options: {
        plugins: ['prettier-plugin-tailwindcss'], // Tailwindプラグインを使用する場合
      },
    },
  ],
};
