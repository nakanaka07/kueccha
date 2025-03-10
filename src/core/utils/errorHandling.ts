import { ERROR_MESSAGES } from '../constants/messages';
import type { AppError, GeolocationError } from '../types/common';

/**
 * アプリケーションエラーオブジェクトを作成する
 */
export const createError = (
  category: keyof typeof ERROR_MESSAGES,
  type: string,
  details?: string,
  code?: string,
): AppError => {
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
};

/**
 * API関連のエラーを処理し、アプリケーションエラーに変換する
 */
export const handleApiError = (
  error: unknown,
  retryCount: number,
  maxRetries: number,
  retryDelay: number,
  entityName: string = 'データ',
): AppError => {
  console.error(`${entityName}取得エラー:`, error);

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      return createError('DATA', 'FETCH_FAILED', error.message, 'NETWORK_ERROR');
    }

    if (error.message.includes('API key') || error.message.includes('403')) {
      return createError('CONFIG', 'INVALID', error.message, 'API_KEY_ERROR');
    }

    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return createError('DATA', 'TIMEOUT', error.message, 'REQUEST_TIMEOUT');
    }
  }

  if (retryCount < maxRetries) {
    return createError(
      'DATA',
      'FETCH_FAILED',
      error instanceof Error ? error.message : String(error),
      'FETCH_ERROR_RETRYING',
    );
  }

  return createError(
    'DATA',
    'FETCH_FAILED',
    error instanceof Error ? error.message : String(error),
    'FETCH_ERROR_MAX_RETRIES',
  );
};

/**
 * 位置情報エラーをアプリケーションエラーに変換する
 */
export const handleGeolocationError = (error: GeolocationPositionError | Error): GeolocationError => {
  if (error instanceof GeolocationPositionError) {
    let message: string;
    let details: string | undefined;

    switch (error.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        message = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
        details = '位置情報の使用が許可されていません。ブラウザの設定を確認してください。';
        break;
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        message = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
        details = '位置情報を取得できませんでした。ネットワーク接続を確認してください。';
        break;
      case GeolocationPositionError.TIMEOUT:
        message = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
        details = '位置情報の取得がタイムアウトしました。';
        break;
      default:
        message = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
        details = error.message || '詳細不明のエラーが発生しました。';
    }

    return { code: error.code, message, details };
  }

  // Errorオブジェクトの場合
  return {
    code: -1,
    message: ERROR_MESSAGES.GEOLOCATION.UNKNOWN,
    details: error.message,
  };
};

/**
 * 再試行可能なエラーかどうかを判定する
 */
export const isRetryableError = (error: AppError | null): boolean => {
  if (!error || !error.code) return false;

  const retryableCodes = [
    'MAP_LOAD_FAILED',
    'DATA_FETCH_FAILED',
    'NETWORK_ERROR',
    'FETCH_ERROR_RETRYING',
    'REQUEST_TIMEOUT',
    'GEOLOCATION_TIMEOUT',
    'GEOLOCATION_POSITION_UNAVAILABLE',
  ];

  return retryableCodes.includes(error.code);
};

/**
 * エラーの重大度を判定する
 */
export const getErrorSeverity = (error: AppError | null): 'critical' | 'warning' | 'info' | null => {
  if (!error || !error.code) return null;

  const criticalErrors = ['CONFIG_MISSING', 'API_KEY_ERROR', 'MAP_CONFIG_MISSING'];
  if (criticalErrors.includes(error.code)) return 'critical';

  const warningErrors = ['FETCH_ERROR_MAX_RETRIES', 'GEOLOCATION_PERMISSION_DENIED'];
  if (warningErrors.includes(error.code)) return 'warning';

  const infoErrors = ['FETCH_ERROR_RETRYING', 'NETWORK_ERROR', 'REQUEST_TIMEOUT'];
  if (infoErrors.includes(error.code)) return 'info';

  return 'warning';
};

/**
 * エラー詳細を整形する
 */
export const formatErrorDetails = (error: AppError | null): string => {
  if (!error) return '';

  const { code, details, category } = error;
  return [
    code ? `エラーコード: ${code}` : 'エラーコード: 不明',
    category ? `カテゴリ: ${String(category)}` : 'カテゴリ: 不明',
    details ? `詳細: ${details}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

// 注: フック関連の実装はすべてuseErrorHandling.tsに移動
