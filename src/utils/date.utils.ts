/**
 * 日付操作関連のユーティリティ関数
 *
 * 日付のフォーマット、変換、比較など、日付に関する便利な関数を提供します。
 */

import { RegionSettings } from '../constants/app.constants';
import { getCurrentLanguage } from '../constants/i18n.constants';

import type { SupportedLanguage } from '../types';

// 日本の祝日データを別ファイルに移動
import { JAPANESE_HOLIDAYS } from '../constants/holiday.constants';

/**
 * 日付が有効かどうかを検証する
 *
 * @param date 検証する日付文字列または日付オブジェクト
 * @returns 有効な日付であればtrue、そうでなければfalse
 */
export function isValidDate(date: string | Date | number): boolean {
  if (date === null || date === undefined) {
    return false;
  }

  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * 現在の言語設定に基づいて日付をフォーマットする
 *
 * @param date フォーマットする日付
 * @param format カスタムフォーマット（オプション）
 * @returns 現在の言語に合わせてフォーマットされた日付文字列
 */
export function formatDate(
  date: Date | string | number,
  format?: 'short' | 'long' | 'full',
): string {
  if (!isValidDate(date)) {
    return getCurrentLanguage() === 'ja' ? '無効な日付' : 'Invalid date';
  }

  const d = new Date(date);
  const lang = getCurrentLanguage();

  try {
    // Intl.DateTimeFormatを使用して国際化されたフォーマットを適用
    const options: Intl.DateTimeFormatOptions = {
      timeZone: RegionSettings.TIMEZONE,
    };

    // フォーマットに基づいてオプションを設定
    switch (format) {
      case 'short':
        options.year = 'numeric';
        options.month = 'numeric';
        options.day = 'numeric';
        break;

      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.weekday = 'short';
        break;

      case 'full':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.weekday = 'long';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;

      default:
        // デフォルト: 標準的な日付フォーマット
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
    }

    return new Intl.DateTimeFormat(lang, options).format(d);
  } catch (error) {
    // フォールバック: 基本的な日付フォーマット
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    return lang === 'ja' ? `${year}年${month}月${day}日` : `${month}/${day}/${year}`;
  }
}

/**
 * 日付を相対的な表現に変換する（例: "3日前", "1時間前"）
 *
 * @param date 変換する日付
 * @param lang 言語設定（デフォルト: 現在の言語）
 * @returns 相対的な日付表現
 */
export function toRelativeTime(
  date: Date | string | number,
  lang: SupportedLanguage = getCurrentLanguage(),
): string {
  if (!isValidDate(date)) {
    return lang === 'ja' ? '無効な日付' : 'Invalid date';
  }

  const now = new Date();
  const pastDate = new Date(date);
  const diff = now.getTime() - pastDate.getTime();

  // ミリ秒→秒→分→時間→日
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (lang === 'ja') {
    if (seconds < 60) return '今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 30) return `${days}日前`;
    if (months < 12) return `${months}ヶ月前`;
    return `${years}年前`;
  } else {
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}

/**
 * 日付の操作関数（加算・減算）
 *
 * @param date 基準日
 * @param amount 加算する量（負の値で減算）
 * @param unit 単位（'days'|'hours'|'months'|'years'）
 * @returns 計算後の新しい日付
 */
export function addToDate(
  date: Date,
  amount: number,
  unit: 'days' | 'hours' | 'months' | 'years' = 'days',
): Date {
  const result = new Date(date);

  switch (unit) {
    case 'days':
      result.setDate(result.getDate() + amount);
      break;
    case 'hours':
      result.setHours(result.getHours() + amount);
      break;
    case 'months':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + amount);
      break;
  }

  return result;
}

/**
 * 2つの日付が同じ日かどうかを比較する
 *
 * @param first 1つ目の日付
 * @param second 2つ目の日付
 * @returns 同じ日であればtrue、そうでなければfalse
 */
export function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

/**
 * 指定した日付が週末（土日）かどうかを判定
 *
 * @param date 判定する日付
 * @returns 週末の場合はtrue、そうでなければfalse
 */
export function isWeekend(date: Date | string | number): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const d = new Date(date);
  const day = d.getDay();

  // 0: 日曜日, 6: 土曜日
  return day === 0 || day === 6;
}

/**
 * 指定した日付が日本の祝日かどうかを判定
 *
 * @param date 判定する日付
 * @returns 祝日の場合はtrue、そうでなければfalse
 */
export function isJapaneseHoliday(date: Date | string | number): boolean {
  if (!isValidDate(date)) {
    return false;
  }

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return JAPANESE_HOLIDAYS.includes(dateStr);
}

/**
 * 指定した日付が営業日（平日かつ祝日でない）かどうかを判定
 *
 * @param date 判定する日付
 * @returns 営業日の場合はtrue、そうでなければfalse
 */
export function isBusinessDay(date: Date | string | number): boolean {
  return !isWeekend(date) && !isJapaneseHoliday(date);
}

/**
 * 日付が営業時間内かどうかを判定する
 *
 * @param date チェックする日付
 * @param openTime 開始時間（例: "09:00"）
 * @param closeTime 終了時間（例: "18:00"）
 * @returns 営業時間内の場合はtrue、そうでない場合はfalse
 */
export function isWithinBusinessHours(date: Date, openTime: string, closeTime: string): boolean {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const hours = date.getHours();
  const minutes = date.getMinutes();

  const timeValue = hours * 60 + minutes;
  const openValue = openHour * 60 + openMinute;
  const closeValue = closeHour * 60 + closeMinute;

  // 終了時間が開始時間より前の場合（例: 22:00〜翌6:00）は、日付をまたいでいると判定
  if (closeValue < openValue) {
    return timeValue >= openValue || timeValue <= closeValue;
  }

  return timeValue >= openValue && timeValue <= closeValue;
}
