/**
 * プロジェクト共通のコードフォーマット設定
 *
 * 基本設定:
 * - シングルクォート優先
 * - セミコロン必須
 * - 2スペースインデント
 * - 行の最大長 100文字
 * - 末尾カンマは ES5 互換
 */
module.exports = {
  // 基本スタイル設定
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,

  // コード構文設定
  trailingComma: 'es5',
  quoteProps: 'as-needed',
  arrowParens: 'avoid',

  // スペーシング設定
  bracketSpacing: true,
  bracketSameLine: false,

  // 環境設定
  endOfLine: 'auto',

  // 言語処理設定
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  vueIndentScriptAndStyle: false,
  proseWrap: 'preserve',

  // ファイル形式ごとの個別設定
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
  ],
};