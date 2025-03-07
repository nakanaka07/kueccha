import { useMemo } from 'react';
import { ERROR_MESSAGES } from '../../constants/messages';
import type { AppError } from '../../types/common';

/**
 * アプリケーションエラーを作成する関数
 */
export const createError = (
  category: keyof typeof ERROR_MESSAGES,
  type: string,
  details?: string,
  code?: string,
): AppError => {
  const message = ERROR_MESSAGES[category]?.[type] || ERROR_MESSAGES.SYSTEM.UNKNOWN;
  const errorCode = code || `${category}_${type}`.toUpperCase();

  return {
    message,
    code: errorCode,
    details,
    category,
  };
};

/**
 * API関連エラーを処理する関数
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
 * エラーが再試行可能かどうかを判定する関数
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
 * エラーの重大度を取得する関数
 */
export const getErrorSeverity = (error: AppError | null): 'critical' | 'warning' | 'info' | null => {
  if (!error) return null;

  const criticalErrors = ['CONFIG_MISSING', 'API_KEY_ERROR', 'MAP_CONFIG_MISSING'];
  if (criticalErrors.includes(error.code)) return 'critical';

  const warningErrors = ['FETCH_ERROR_MAX_RETRIES', 'GEOLOCATION_PERMISSION_DENIED'];
  if (warningErrors.includes(error.code)) return 'warning';

  const infoErrors = ['FETCH_ERROR_RETRYING', 'NETWORK_ERROR', 'REQUEST_TIMEOUT'];
  if (infoErrors.includes(error.code)) return 'info';

  return 'warning';
};

/**
 * エラー詳細情報をフォーマットする関数
 */
export const formatErrorDetails = (error: AppError | null): string => {
  if (!error) return '';

  const { code, details, category } = error;
  return [`エラーコード: ${code || '不明'}`, `カテゴリ: ${category || '不明'}`, details ? `詳細: ${details}` : '']
    .filter(Boolean)
    .join('\n');
};

/**
 * 複数ソースからのエラーを処理するカスタムフック
 * エラーの優先順位付け、メッセージ生成、再試行可能性の判定を行う
 *
 * @param mapError マップ関連のエラー
 * @param poisError POIデータ関連のエラー
 * @returns 統合されたエラー情報とエラーメッセージ、詳細、再試行可否
 */
export function useErrorHandling(mapError: AppError | null, poisError: AppError | null) {
  const combinedError = useMemo<AppError | null>(() => {
    return mapError || poisError || null;
  }, [mapError, poisError]);

  const errorMessage = useMemo(() => {
    return combinedError?.message || '';
  }, [combinedError]);

  const errorDetails = useMemo(() => {
    return formatErrorDetails(combinedError);
  }, [combinedError]);

  const isRetryable = useMemo(() => {
    return isRetryableError(combinedError);
  }, [combinedError]);

  const severity = useMemo(() => {
    return getErrorSeverity(combinedError);
  }, [combinedError]);

  const errorType = useMemo(() => {
    if (!combinedError) return null;
    if (mapError) return 'map';
    if (poisError) return 'data';
    return 'unknown';
  }, [combinedError, mapError, poisError]);

  return {
    combinedError,
    errorMessage,
    errorDetails,
    isRetryable,
    severity,
    errorType,
  };
}
