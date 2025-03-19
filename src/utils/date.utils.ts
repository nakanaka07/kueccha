/**
 * 日付操作関連のユーティリティ関数
 *
 * 日付のフォーマット、変換、比較など、日付に関する便利な関数を提供します。
 */

import { RegionSettings } from '../constants/app.constants';
import { getCurrentLanguage } from '../constants/i18n.constants';

import type { SupportedLanguage } from '../types';

// ============================================================================
// 基本日付操作
// ============================================================================

/**
 * 日付をISO文字列に変換する
 *
 * @param date 日付オブジェクトまたは日付を表す文字列
 * @returns ISO 8601形式の文字列（YYYY-MM-DDTHH:mm:ss.sssZ）
 */
export function toISOString(date: Date | string | number): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return dateObj.toISOString();
}

/**
 * 現在の日本時間（JST）を取得する
 *
 * @returns 日本時間の現在時刻を表すDateオブジェクト
 */
export function getNowJST(): Date {
  const now = new Date();

  // JSTタイムゾーンオフセット (UTC+9)
  const jstOffset = 9 * 60;

  // 現在のUTC時間（分）を取得
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  // JSTの時間（分）を計算
  const jstMinutes = (utcMinutes + jstOffset) % (24 * 60);

  // JSTの時・分を設定
  now.setUTCHours(Math.floor(jstMinutes / 60), jstMinutes % 60);

  return now;
}

// ============================================================================
// 日付比較と検証
// ============================================================================

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

// ============================================================================
// 日付フォーマット
// ============================================================================

/**
 * 日付を「YYYY年MM月DD日」形式にフォーマットする（日本語向け）
 *
 * @param date フォーマットする日付
 * @returns フォーマットされた日付文字列
 */
export function formatJapaneseDate(date: Date | string | number): string {
  if (!isValidDate(date)) {
    return '無効な日付';
  }

  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  return `${year}年${month}月${day}日`;
}

/**
 * 日付を「MM/DD/YYYY」形式にフォーマットする（英語向け）
 *
 * @param date フォーマットする日付
 * @returns フォーマットされた日付文字列
 */
export function formatEnglishDate(date: Date | string | number): string {
  if (!isValidDate(date)) {
    return 'Invalid date';
  }

  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  return `${month}/${day}/${year}`;
}

/**
 * 現在の言語設定に基づいて日付をフォーマットする
 *
 * @param date フォーマットする日付
 * @param format カスタムフォーマット（オプション）
 * @returns 現在の言語に合わせてフォーマットされた日付文字列
 */
export function formatDate(date: Date | string | number, format?: 'short' | 'long' | 'full'): string {
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
    // フォールバック: 組み込みのフォーマット関数を使用
    return lang === 'ja' ? formatJapaneseDate(date) : formatEnglishDate(date);
  }
}

/**
 * 日付を相対的な表現に変換する（例: "3日前", "1時間前"）
 *
 * @param date 変換する日付
 * @param lang 言語設定（デフォルト: 現在の言語）
 * @returns 相対的な日付表現
 */
export function toRelativeTime(date: Date | string | number, lang: SupportedLanguage = getCurrentLanguage()): string {
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

// ============================================================================
// 日付の加算・減算
// ============================================================================

/**
 * 指定した日数を日付に加算する
 *
 * @param date 基準日
 * @param days 加算する日数（負の値で減算）
 * @returns 加算後の新しい日付
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 指定した時間（時間単位）を日付に加算する
 *
 * @param date 基準日
 * @param hours 加算する時間（負の値で減算）
 * @returns 加算後の新しい日付
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * 指定した月数を日付に加算する
 *
 * @param date 基準日
 * @param months 加算する月数（負の値で減算）
 * @returns 加算後の新しい日付
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ============================================================================
// 祝日・休業日判定
// ============================================================================

/**
 * 日本の主要な祝日一覧（2023-2025年）
 * YYYY-MM-DD形式
 */
const JAPANESE_HOLIDAYS: string[] = [
  // 2023年の祝日
  '2023-01-01',
  '2023-01-02',
  '2023-01-09',
  '2023-02-11',
  '2023-02-23',
  '2023-03-21',
  '2023-04-29',
  '2023-05-03',
  '2023-05-04',
  '2023-05-05',
  '2023-07-17',
  '2023-08-11',
  '2023-09-18',
  '2023-09-23',
  '2023-10-09',
  '2023-11-03',
  '2023-11-23',
  '2023-12-31',

  // 2024年の祝日
  '2024-01-01',
  '2024-01-08',
  '2024-02-11',
  '2024-02-12',
  '2024-02-23',
  '2024-03-20',
  '2024-04-29',
  '2024-05-03',
  '2024-05-04',
  '2024-05-05',
  '2024-05-06',
  '2024-07-15',
  '2024-08-11',
  '2024-08-12',
  '2024-09-16',
  '2024-09-22',
  '2024-09-23',
  '2024-10-14',
  '2024-11-03',
  '2024-11-04',
  '2024-11-23',
  '2024-12-31',

  // 2025年の祝日
  '2025-01-01',
  '2025-01-13',
  '2025-02-11',
  '2025-02-23',
  '2025-02-24',
  '2025-03-20',
  '2025-04-29',
  '2025-05-03',
  '2025-05-04',
  '2025-05-05',
  '2025-05-06',
  '2025-07-21',
  '2025-08-11',
  '2025-09-15',
  '2025-09-23',
  '2025-10-13',
  '2025-11-03',
  '2025-11-23',
  '2025-11-24',
  '2025-12-31',
];

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
 * 指定した日付が営業日（平日かつ祝日でない）かどうかを判定
 *
 * @param date 判定する日付
 * @returns 営業日の場合はtrue、そうでなければfalse
 */
export function isBusinessDay(date: Date | string | number): boolean {
  return !isWeekend(date) && !isJapaneseHoliday(date);
}
