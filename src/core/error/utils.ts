import { ERROR_MESSAGES } from '@core/constants/messages';
import { AppError, GeolocationError, ErrorSeverity } from './types';

/**
 * アプリケーションエラーオブジェクトを作成する
 */
export function createError(
  category: keyof typeof ERROR_MESSAGES,
  type: string,
  details?: string,
  code?: string,
): AppError {
  const message =
    ERROR_MESSAGES[category]?.[type as keyof (typeof ERROR_MESSAGES)[typeof category]] || ERROR_MESSAGES.SYSTEM.UNKNOWN;
  const errorCode = code || `${category}_${type}`.toUpperCase();

  return {
    message,
    code: errorCode,
    details,
    category,
    severity: getErrorSeverity({ message, code: errorCode, details, category }),
  };
}

/**
 * API関連のエラーを処理し、アプリケーションエラーに変換する
 */
export function handleApiError(
  error: unknown,
  retryCount: number,
  maxRetries: number,
  retryDelay: number,
  entityName: string = 'データ',
): AppError {
  console.error(`${entityName}取得エラー:`, error);

  // ...existing code...
}

/**
 * 位置情報エラーをアプリケーションエラーに変換する
 */
export function handleGeolocationError(error: GeolocationPositionError | Error): GeolocationError {
  // ...existing code...
}

/**
 * 再試行可能なエラーかどうかを判定する
 */
export function isRetryableError(error: AppError | null): boolean {
  // ...existing code...
}

/**
 * エラーの重大度を判定する
 */
export function getErrorSeverity(error: AppError | null): ErrorSeverity {
  // ...existing code...
}

/**
 * エラー詳細を整形する
 */
export function formatErrorDetails(error: AppError | null): string {
  // ...existing code...
}
