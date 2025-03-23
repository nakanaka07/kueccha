/**
 * プロジェクト共通のコードフォーマット設定
 * - シングルクォート優先
 * - セミコロン必須
 * - 一貫したインデント（2スペース）
 * - 適切な行の長さ制限（100文字）
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
};
