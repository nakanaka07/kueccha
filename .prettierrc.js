/**
 * プロジェクト共通のコードフォーマット設定
 * - シングルクォート優先
 * - セミコロン必須
 * - 一貫したインデント（2スペース）
 * - 適切な行の長さ制限（100文字）
 * - MDXや様々なファイル形式の一貫したフォーマット
 */
export default {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  arrowParens: 'avoid',
  endOfLine: 'auto',
  bracketSpacing: true,
  // 以下の設定を追加して一貫性を確保
  jsxSingleQuote: true,
  useTabs: false,
  quoteProps: 'as-needed',
  // 追加の最適化設定
  bracketSameLine: false, // JSX要素の閉じ括弧を次の行に配置
  embeddedLanguageFormatting: 'auto', // テンプレートリテラル内のコード自動フォーマット
  htmlWhitespaceSensitivity: 'css', // HTMLの空白処理をCSSの表示方法に合わせる
  vueIndentScriptAndStyle: false, // Vueファイルのscript/styleタグをインデントしない
  proseWrap: 'preserve', // Markdownテキストの折り返し方法を保持
  // ファイル形式ごとの設定を統一
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