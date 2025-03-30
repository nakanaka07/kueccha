/**
 * プロジェクト共通のコードフォーマット設定
 *
 * 基本設定:
 * - シングルクォート優先 (singleQuote: true)
 * - セミコロン必須 (semi: true)
 * - 2スペースインデント (tabWidth: 2)
 * - 行の最大長 100文字 (printWidth: 100)
 * - 末尾カンマは ES5 互換 (trailingComma: 'es5')
 */
module.exports = {
  // 基本コードスタイル
  printWidth: 100, // 行の最大長
  tabWidth: 2, // インデントのスペース数
  useTabs: false, // タブの代わりにスペースを使用
  semi: true, // ステートメントの最後にセミコロンを追加

  // 引用符の設定
  singleQuote: true, // 二重引用符の代わりに単一引用符を使用
  jsxSingleQuote: true, // JSXでも単一引用符を使用
  quoteProps: 'as-needed', // 必要な場合のみプロパティ名を引用符で囲む

  // コード構文とフォーマット
  trailingComma: 'es5', // ES5で有効な場所に末尾カンマを追加（オブジェクト、配列など）
  bracketSpacing: true, // オブジェクトリテラルの括弧の間にスペースを入れる
  bracketSameLine: false, // 複数行のHTML要素の閉じ括弧を次の行に配置
  arrowParens: 'avoid', // 可能な場合、アロー関数の引数に括弧を省略

  // 環境とファイル設定
  endOfLine: 'auto', // プラットフォームに合わせて改行コードを自動選択

  // 多言語対応
  embeddedLanguageFormatting: 'auto', // 埋め込まれた言語を自動的にフォーマット
  htmlWhitespaceSensitivity: 'css', // HTMLの空白の扱いをCSSの表示方法に基づいて決定
  vueIndentScriptAndStyle: false, // Vueファイルのscriptとstyleブロックをインデントしない
  proseWrap: 'preserve', // マークダウンのテキスト折り返しを維持

  // ファイル形式ごとの個別設定
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'always', // マークダウンファイルでは常にテキストを折り返す
      },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: {
        printWidth: 80, // JSONファイルは行長を短く
      },
    },
    {
      files: '*.{css,scss,less}',
      options: {
        singleQuote: false, // CSSファイルでは二重引用符を使用
      },
    },
  ],
};
