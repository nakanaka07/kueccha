/**
 * Prettier設定ファイル
 *
 * このファイルはプロジェクト全体のコードフォーマット規則を定義します。
 * React/TypeScriptプロジェクト向けに最適化されています。
 *
 * @see https://prettier.io/docs/en/options.html
 */
module.exports = {
  // 基本フォーマット設定
  printWidth: 100, // モバイルでのコードレビューを考慮
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',

  // React/JSX特有の設定
  jsxSingleQuote: false, // JSX属性には二重引用符を使用
  jsxBracketSameLine: false, // JSX要素の閉じタグは改行

  // パーサーオプション
  embeddedLanguageFormatting: 'auto',

  // ファイルタイプ別オーバーライド
  overrides: [
    {
      // マークダウンファイル用の設定
      files: ['*.md', '*.markdown'],
      options: {
        printWidth: 80, // ドキュメントは読みやすさ優先
        proseWrap: 'always',
      },
    },
    {
      // JSON系ファイル用の設定
      files: ['*.json', '*.jsonc', '.eslintrc'],
      options: {
        parser: 'json',
      },
    },
  ],
};
