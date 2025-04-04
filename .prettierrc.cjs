/**
 * プロジェクト共通のコードフォーマット設定
 *
 * 基本設定:
 * - シングルクォート優先 (singleQuote: true)
 * - セミコロン必須 (semi: true)
 * - 2スペースインデント (tabWidth: 2)
 * - 行の最大長 100文字 (printWidth: 100)
 * - 末尾カンマは ES5 互換 (trailingComma: 'es5')
 *
 * 最適化ポイント:
 * - TypeScript/React固有の設定を強化
 * - 環境変数とロガー使用ガイドラインとの整合性向上
 * - コード構造と設計原則に沿った一貫性のある設定
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

  // モダンJavaScript機能のサポート強化
  parser: 'babel', // 最新のJavaScript機能をサポート

  // ファイル形式ごとの個別設定
  overrides: [
    // TypeScript/React ファイル用の設定
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'typescript',
        importOrder: [
          '^@/types/(.*)$', // 型定義を最初に
          '^@/constants/(.*)$', // 定数を次に
          '^@/utils/(.*)$', // ユーティリティ
          '^@/hooks/(.*)$', // カスタムフック
          '^@/components/(.*)$', // コンポーネント
          '^@/assets/(.*)$', // アセット
          '^[./]', // 相対パスのインポートを最後に
        ],
        importOrderSeparation: true, // インポート宣言グループ間に空行を追加
        importOrderGroupNamespaceSpecifiers: true, // 名前空間インポートをグループ化
      },
    },
    // マークダウンファイル用の設定
    {
      files: '*.md',
      options: {
        proseWrap: 'always', // マークダウンファイルでは常にテキストを折り返す
        printWidth: 80, // マークダウンドキュメントは読みやすさのために行長を短く
      },
    },
    // JSONファイル用の設定（ロガー構造化データに最適化）
    {
      files: ['*.json', '*.jsonc'],
      options: {
        printWidth: 80, // JSONファイルは行長を短く
        tabWidth: 2,
      },
    },
    // CSS関連ファイル用の設定
    {
      files: '*.{css,scss,less}',
      options: {
        singleQuote: false, // CSSファイルでは二重引用符を使用
        printWidth: 100, // CSSファイルの行長
      },
    },
    // HTMLファイル用の設定
    {
      files: '*.html',
      options: {
        printWidth: 120, // HTMLファイルは長い行を許容
        htmlWhitespaceSensitivity: 'strict', // HTML要素間の空白を厳密に扱う
      },
    },
    // 環境変数関連ファイル用の設定
    {
      files: ['*.env', '.env.*', '*.env.example'],
      options: {
        parser: 'sh', // 環境変数ファイルをシェルスクリプトとして解析
      },
    },
    // テストファイル用の設定
    {
      files: ['*.test.{js,ts,jsx,tsx}', '**/__tests__/**/*.{js,ts,jsx,tsx}'],
      options: {
        printWidth: 120, // テストファイルでは長いテストケース名を許容
      },
    },
  ],
};
