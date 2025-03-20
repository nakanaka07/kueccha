/**
 * 文字列操作関連のユーティリティ関数
 *
 * テンプレート文字列の処理など、文字列関連の操作を行う関数を提供します。
 */

/**
 * メッセージのプレースホルダーを置換する関数
 * {param}形式のプレースホルダーを実際の値に置換します
 */
export function formatMessage(
  message: string,
  params?: Record<string, string | number | null | undefined>,
): string {
  if (!message) return '';
  if (!params || Object.keys(params).length === 0) return message;

  return Object.entries(params).reduce((text, [key, value]) => {
    // 値がnullまたはundefinedの場合は空文字に置換
    const safeValue = value == null ? '' : String(value);
    // プレースホルダーを置換（正規表現でエスケープ処理）
    const pattern = new RegExp(`\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
    return text.replace(pattern, safeValue);
  }, message);
}

/**
 * 文字列を指定された長さに切り詰める関数
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}