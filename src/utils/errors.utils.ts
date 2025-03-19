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
 * エラーメッセージをカテゴリとコードから取得する内部ヘルパー関数
 *
 * @param category - エラーカテゴリ
 * @param code - エラーコード
 * @returns エラーメッセージまたはエラーメッセージオブジェクト
 */
function getMessageFromCategoryAndCode<T extends ErrorCategory>(
  category: T,
  code: ErrorCode<T>,
): Record<string, string> | string {
  try {
    return ERROR_MESSAGES[category][code as keyof (typeof ERROR_MESSAGES)[T]];
  } catch (error) {
    console.error(`エラーメッセージが見つかりません: ${category}.${String(code)}`);
    return `未定義のエラー (${category}.${String(code)})`;
  }
}

/**
 * エラーメッセージを取得する
 *
 * 指定されたカテゴリとコードに対応するエラーメッセージを取得します。
 * 多言語対応されたメッセージの場合はデフォルト言語（日本語）のメッセージを返します。
 *
 * @param category - エラーカテゴリ
 * @param code - エラーコード
 * @param params - プレースホルダー置換パラメータ
 * @returns エラーメッセージ文字列
 */
export function getErrorMessage<T extends ErrorCategory>(
  category: T,
  code: ErrorCode<T>,
  params?: Record<string, string | number>,
): string {
  const message = getMessageFromCategoryAndCode(category, code);
  const baseMessage = typeof message === 'object' ? message[DEFAULT_LANGUAGE] : message;
  return formatMessage(baseMessage, params);
}

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
  const message = getMessageFromCategoryAndCode(category, code);

  let baseMessage: string;
  if (typeof message === 'object') {
    // 優先順位: 指定された言語 > デフォルト言語 > 最初に見つかった言語
    baseMessage = message[locale] || message[DEFAULT_LANGUAGE] || Object.values(message)[0];
  } else {
    baseMessage = message;
  }

  return formatMessage(baseMessage, params);
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
 * @param locale - 言語コード（オプション、デフォルト: 現在の言語）
 * @param originalError - 元のエラーオブジェクト（オプション）
 * @returns 標準化されたAppErrorオブジェクト
 */
export function createErrorObject<T extends ErrorCategory, D = unknown>(
  category: T,
  code: ErrorCode<T>,
  params?: Record<string, string | number>,
  details?: D,
  locale?: SupportedLanguage,
  originalError?: Error,
): AppError<D> {
  const effectiveLocale = locale || getCurrentLanguage();

  return {
    category,
    code: String(code),
    message: getLocalizedErrorMessage(category, code, effectiveLocale, params),
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
 * エラーメッセージとエラーコードの整合性を検証する
 *
 * エラーメッセージの定義に欠落があるかどうかをチェックします。
 * デバッグ用途やテスト環境でのみ使用することを想定しています。
 *
 * @returns 欠落しているエラーコードのリスト
 */
export function validateErrorMessages(): Array<string> {
  const missingMessages: Array<string> = [];

  // 本番環境での実行を防止
  if (import.meta.env.PROD) {
    console.warn('validateErrorMessages は開発/テスト環境専用です');
    return ['本番環境では検証をスキップしました'];
  }

  Object.keys(ERROR_MESSAGES).forEach((category) => {
    // カテゴリに対応するエラーコード列挙型の名前（例: 'API' → 'APIErrorCode'）
    const categoryName = `${category}ErrorCode`;

    try {
      // 列挙型オブジェクトを取得（注: 型安全ではありません）
      const enumObj = (global as Record<string, Record<string, string>>)[categoryName];

      if (enumObj) {
        // 列挙型に定義されているが、メッセージにないコードをチェック
        Object.keys(enumObj).forEach((code) => {
          if (
            typeof enumObj[code] === 'string' &&
            !ERROR_MESSAGES[category as ErrorCategory][code]
          ) {
            missingMessages.push(`${category}.${code} にメッセージがありません`);
          }
        });

        // メッセージにあるが、列挙型にないコードをチェック
        Object.keys(ERROR_MESSAGES[category as ErrorCategory]).forEach((code) => {
          if (!Object.values(enumObj).includes(code)) {
            missingMessages.push(`${category}.${code} は ${categoryName} に定義されていません`);
          }
        });
      } else {
        missingMessages.push(`${categoryName} 列挙型が定義されていません`);
      }
    } catch (error) {
      missingMessages.push(`${categoryName} の検証中にエラーが発生しました: ${String(error)}`);
    }
  });

  return missingMessages;
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
