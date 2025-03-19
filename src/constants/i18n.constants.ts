/**
 * 国際化関連の定数ファイル
 *
 * アプリケーション全体で使用される言語設定や国際化関連の定数を定義します。
 * 言語の切り替えやメッセージのローカライズ機能を提供します。
 */

import { formatMessage } from '../utils/string.utils';

// ============================================================================
// 基本言語設定
// ============================================================================

/**
 * サポートされている言語の配列
 * 新しい言語サポートを追加する場合はここに言語コードを追加してください
 */
export const SUPPORTED_LANGUAGES = ['ja', 'en'] as const;

/**
 * サポートされている言語の型
 * 型チェックとコード補完を可能にします
 */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * デフォルト言語設定
 * 言語が明示的に指定されていない場合に使用される言語
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ja';

// ============================================================================
// 多言語メッセージ型定義
// ============================================================================

/**
 * 多言語対応メッセージの型定義
 * 各言語に対応するメッセージテキストを持つオブジェクト型
 */
export type LocalizedMessage = {
  [key in SupportedLanguage]: string;
};

// ============================================================================
// キャッシュと内部状態
// ============================================================================

/**
 * 言語設定のキャッシュタイムアウト (ミリ秒)
 * この期間が過ぎるとキャッシュが無効になり再評価されます
 */
const LANGUAGE_CACHE_TTL = 60000; // 1分

/**
 * 言語設定のキャッシュ
 * パフォーマンス向上のために言語設定を一時的に保存します
 */
let cachedLanguage: SupportedLanguage | null = null;
let cacheTimestamp: number = 0;

/**
 * キャッシュされた言語設定をリセット
 * 言語が変更されたとき、またはキャッシュを無効にしたいときに呼び出します
 */
export function resetLanguageCache(): void {
  cachedLanguage = null;
  cacheTimestamp = 0;
}

// ============================================================================
// 言語関連ユーティリティ関数
// ============================================================================

/**
 * 環境がブラウザかどうかを判定
 * SSRなどのNode環境でエラーを避けるために使用
 */
const isBrowser =
  typeof window !== 'undefined' && typeof localStorage !== 'undefined' && typeof navigator !== 'undefined';

/**
 * 現在の言語を取得する関数
 *
 * 以下の優先順位で言語を決定します:
 * 1. キャッシュされた言語設定（存在し、有効期限内の場合）
 * 2. ローカルストレージの設定
 * 3. ブラウザの言語設定
 * 4. デフォルト言語
 *
 * @param skipCache キャッシュを無視して再評価するか
 * @returns 現在の言語
 */
export function getCurrentLanguage(skipCache: boolean = false): SupportedLanguage {
  // キャッシュが有効なら使用
  const now = Date.now();
  if (!skipCache && cachedLanguage && now - cacheTimestamp < LANGUAGE_CACHE_TTL) {
    return cachedLanguage;
  }

  let selectedLanguage = DEFAULT_LANGUAGE;

  if (isBrowser) {
    try {
      // 1. ローカルストレージからユーザー設定を確認
      const storedLang = localStorage.getItem('userLanguage');
      if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang as SupportedLanguage)) {
        selectedLanguage = storedLang as SupportedLanguage;
      } else {
        // 2. ブラウザ言語設定を確認
        const browserLang = navigator.language.split('-')[0] as string;
        if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
          selectedLanguage = browserLang as SupportedLanguage;
        }
      }
    } catch (error) {
      // エラーログを詳細に
      console.warn(
        '言語設定の取得中にエラーが発生しました。デフォルト言語を使用します。',
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    // ブラウザ環境以外（SSRなど）ではデフォルト言語を使用
    console.debug('ブラウザ環境ではないため、デフォルト言語を使用します。');
  }

  // キャッシュを更新
  cachedLanguage = selectedLanguage;
  cacheTimestamp = now;

  return selectedLanguage;
}

/**
 * 言語設定を保存する関数
 *
 * @param language 保存する言語設定
 * @returns 保存に成功したかどうか
 */
export function setLanguage(language: SupportedLanguage): boolean {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    console.warn(`言語 "${language}" はサポートされていません。`);
    return false;
  }

  if (!isBrowser) {
    console.warn('ブラウザ環境でないため、言語設定を保存できません。');
    return false;
  }

  try {
    localStorage.setItem('userLanguage', language);

    // キャッシュを更新
    cachedLanguage = language;
    cacheTimestamp = Date.now();

    // 言語変更イベントを発行（オプション）
    if (typeof window.dispatchEvent === 'function') {
      const event = new CustomEvent('languagechange', { detail: { language } });
      window.dispatchEvent(event);
    }

    return true;
  } catch (error) {
    console.error('言語設定の保存中にエラーが発生しました', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * ローカライズされたメッセージを取得する関数
 *
 * @param message ローカライズされたメッセージオブジェクトまたは文字列
 * @param language 使用する言語（省略時は現在の言語）
 * @param params メッセージ内のプレースホルダーを置き換えるパラメータ
 * @returns ローカライズされフォーマットされたメッセージ文字列
 */
export function getLocalizedMessage(
  message: LocalizedMessage | string,
  language: SupportedLanguage = getCurrentLanguage(),
  params?: Record<string, string | number>,
): string {
  // メッセージが undefined または null の場合
  if (message === undefined || message === null) {
    console.warn('getLocalizedMessage: メッセージがnullまたはundefinedです。');
    return '';
  }

  // 文字列の場合はそのまま返す
  if (typeof message === 'string') {
    return params ? formatMessage(message, params) : message;
  }

  // 指定された言語のメッセージがない場合はデフォルト言語を使用
  const rawMessage = message[language] || message[DEFAULT_LANGUAGE] || Object.values(message)[0] || '';

  // パラメータがあればフォーマット
  return params ? formatMessage(rawMessage, params) : rawMessage;
}

/**
 * 指定した言語の日付フォーマット用オブジェクトを取得
 *
 * @param language 言語コード
 * @returns 言語に適したDateTimeFormatオブジェクト
 */
export function getDateFormatter(
  language: SupportedLanguage = getCurrentLanguage(),
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(language, options);
}

/**
 * 指定した言語の数値フォーマット用オブジェクトを取得
 *
 * @param language 言語コード
 * @returns 言語に適したNumberFormatオブジェクト
 */
export function getNumberFormatter(
  language: SupportedLanguage = getCurrentLanguage(),
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormat {
  return new Intl.NumberFormat(language, options);
}
