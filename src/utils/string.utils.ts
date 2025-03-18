/**
 * 文字列操作関連のユーティリティ関数
 *
 * テンプレート文字列の処理など、文字列関連の操作を行う関数を提供します。
 */

/**
 * 正規表現の特殊文字をエスケープする関数
 *
 * @param str エスケープする文字列
 * @returns エスケープされた文字列
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * メッセージのプレースホルダーを置換する関数
 * {param}形式のプレースホルダーを実際の値に置換します
 *
 * @param message メッセージテンプレート
 * @param params 置換パラメータ
 * @returns フォーマット済みメッセージ
 * @example
 * formatMessage('こんにちは、{name}さん！', { name: '太郎' }) // => 'こんにちは、太郎さん！'
 */
export function formatMessage(message: string, params?: Record<string, string | number | null | undefined>): string {
  if (!message) return '';
  if (!params || Object.keys(params).length === 0) return message;

  return Object.entries(params).reduce((text, [key, value]) => {
    // 値がnullまたはundefinedの場合は空文字に置換
    const safeValue = value == null ? '' : String(value);
    // 値に含まれる$記号を$$にエスケープ（特殊置換パターンとして解釈されるのを防ぐ）
    const escapedValue = safeValue.replace(/\$/g, '$$$$');
    // キーを正規表現用にエスケープしてプレースホルダーを置換
    const pattern = new RegExp(`\\{${escapeRegExp(key)}\\}`, 'g');

    return text.replace(pattern, escapedValue);
  }, message);
}

/**
 * 文字列を指定された長さに切り詰める関数
 *
 * @param text 切り詰める文字列
 * @param maxLength 最大長
 * @param suffix 切り詰めた場合に末尾に付加する文字列（デフォルト: '...'）
 * @returns 切り詰められた文字列
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}
