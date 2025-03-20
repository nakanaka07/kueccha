/**
 * 国際化関連の定数ファイル
 */
import { formatMessage } from '../utils/string.utils';

// 基本言語設定
export const SUPPORTED_LANGUAGES = ['ja', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ja';

// 多言語メッセージ型定義
export type LocalizedMessage = {
  [key in SupportedLanguage]: string;
};

// 環境判定
const isBrowser =
  typeof window !== 'undefined' &&
  typeof localStorage !== 'undefined' &&
  typeof navigator !== 'undefined';

// キャッシュ管理
let cachedLanguage: SupportedLanguage | null = null;
let cacheTimestamp = 0;
const LANGUAGE_CACHE_TTL = 60000; // 1分

/**
 * キャッシュされた言語設定をリセット
 */
export function resetLanguageCache(): void {
  cachedLanguage = null;
  cacheTimestamp = 0;
}

/**
 * 現在の言語を取得
 */
export function getCurrentLanguage(skipCache = false): SupportedLanguage {
  const now = Date.now();
  if (!skipCache && cachedLanguage && now - cacheTimestamp < LANGUAGE_CACHE_TTL) {
    return cachedLanguage;
  }

  let selectedLanguage = DEFAULT_LANGUAGE;

  if (isBrowser) {
    try {
      const storedLang = localStorage.getItem('userLanguage');
      if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang as SupportedLanguage)) {
        selectedLanguage = storedLang as SupportedLanguage;
      } else {
        const browserLang = navigator.language.split('-')[0];
        if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
          selectedLanguage = browserLang as SupportedLanguage;
        }
      }
    } catch (error) {
      console.warn('言語設定の取得中にエラーが発生しました', error);
    }
  }

  cachedLanguage = selectedLanguage;
  cacheTimestamp = now;
  return selectedLanguage;
}

/**
 * 言語設定を保存
 */
export function setLanguage(language: SupportedLanguage): boolean {
  if (!SUPPORTED_LANGUAGES.includes(language) || !isBrowser) {
    return false;
  }

  try {
    localStorage.setItem('userLanguage', language);
    cachedLanguage = language;
    cacheTimestamp = Date.now();

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
    }
    return true;
  } catch (error) {
    console.error('言語設定の保存中にエラーが発生しました', error);
    return false;
  }
}

/**
 * ローカライズされたメッセージを取得
 */
export function getLocalizedMessage(
  message: LocalizedMessage | string,
  language: SupportedLanguage = getCurrentLanguage(),
  params?: Record<string, string | number>,
): string {
  if (message === undefined || message === null) {
    return '';
  }

  if (typeof message === 'string') {
    return params ? formatMessage(message, params) : message;
  }

  const rawMessage =
    message[language] || message[DEFAULT_LANGUAGE] || Object.values(message)[0] || '';
  return params ? formatMessage(rawMessage, params) : rawMessage;
}

/**
 * 日付フォーマッターを取得
 */
export function getDateFormatter(
  language: SupportedLanguage = getCurrentLanguage(),
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(language, options);
}

/**
 * 数値フォーマッターを取得
 */
export function getNumberFormatter(
  language: SupportedLanguage = getCurrentLanguage(),
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  return new Intl.NumberFormat(language, options);
}