/**
 * エラー関連ユーティリティ関数
 *
 * エラーメッセージの取得や標準化されたエラーオブジェクトの作成に関するユーティリティ関数を提供します。
 */

import { formatMessage } from './string.utils';
import { ERROR_MESSAGES } from '../constants/errors.constants';
import { DEFAULT_LANGUAGE, getCurrentLanguage } from '../constants/i18n.constants';
import type { SupportedLanguage } from '../constants/i18n.constants';
import type { AppError, ErrorCategory, ErrorCode } from '../types/errors.types';

/**
 * 多言語対応エラーメッセージを取得する
 *
 * 指定されたカテゴリ、コード、ロケールに対応するエラーメッセージを取得します。
 * 指定されたロケールのメッセージがない場合はデフォルト言語のメッセージにフォールバックします。
 *
 * @param category - エラーカテゴリ
 * @param code - エラーコード
 * @param locale - 言語コード（デフォルト: 現在の言語設定）
 * @param params - プレースホルダー置換パラメータ
 * @returns ローカライズされたエラーメッセージ文字列
 */
export function getLocalizedErrorMessage<T extends ErrorCategory>(
  category: T,
  code: ErrorCode<T>,
  locale: SupportedLanguage = getCurrentLanguage(),
  params?: Record<string, string | number>,
): string {
  try {
    const message = ERROR_MESSAGES[category][code as keyof (typeof ERROR_MESSAGES)[T]];

    let baseMessage: string;
    if (typeof message === 'object') {
      // 優先順位: 指定された言語 > デフォルト言語 > 最初に見つかった言語
      baseMessage = message[locale] || message[DEFAULT_LANGUAGE] || Object.values(message)[0];
    } else {
      baseMessage = message;
    }

    return formatMessage(baseMessage, params);
  } catch (error) {
    console.error(`エラーメッセージが見つかりません: ${category}.${String(code)}`);
    return `未定義のエラー (${category}.${String(code)})`;
  }
}

/**
 * 標準化されたエラーオブジェクトを作成する
 *
 * アプリケーション全体で一貫したエラーオブジェクトを作成します。
 * タイムスタンプが自動的に設定され、オプションで追加詳細を含めることができます。
 *
 * @param category - エラーカテゴリ
 * @param code - エラーコード
 * @param params - プレースホルダー置換パラメータ（オプション）
 * @param details - エラーに関する追加情報（オプション）
 * @param originalError - 元のエラーオブジェクト（オプション）
 * @returns 標準化されたAppErrorオブジェクト
 */
export function createErrorObject<T extends ErrorCategory, D = unknown>(
  category: T,
  code: ErrorCode<T>,
  params?: Record<string, string | number>,
  details?: D,
  originalError?: Error,
): AppError<D> {
  return {
    category,
    code: String(code),
    message: getLocalizedErrorMessage(category, code, getCurrentLanguage(), params),
    localized: {
      ja: getLocalizedErrorMessage(category, code, 'ja', params),
      en: getLocalizedErrorMessage(category, code, 'en', params),
    },
    timestamp: new Date(),
    details,
    params,
    originalError,
  };
}

/**
 * エラーコードが有効かどうか検証する関数
 *
 * @param category - エラーカテゴリ
 * @param code - 検証するコード
 * @returns コードが有効かどうかを示すブール値
 */
export function isValidErrorCode<T extends ErrorCategory>(
  category: T,
  code: unknown,
): code is ErrorCode<T> {
  try {
    return (
      category in ERROR_MESSAGES &&
      code !== undefined &&
      code !== null &&
      String(code) in ERROR_MESSAGES[category]
    );
  } catch {
    return false;
  }
}
