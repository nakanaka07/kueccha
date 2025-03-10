/**
 * 機能: アプリケーション全体で使用するエラー処理サービス
 * 依存関係:
 *   - React hooks (useMemo)
 *   - エラーメッセージ定数 (messages.ts)
 *   - 共通型定義 (types/common.ts)
 * 注意点:
 *   - エラーオブジェクトは統一された形式で生成されます
 *   - エラーの重大度に基づいてUI表示を変更可能
 *   - 再試行可能なエラーを識別する機能があります
 *   - エラーの種類によって適切なメッセージを提供します
 *   - 複数ソースからのエラーを統合して処理できます
 */
import { useMemo } from 'react';
import { ERROR_MESSAGES } from '../../core/constants/messages';
import type { AppError } from '../../core/types/common';

export const createError = (
  category: keyof typeof ERROR_MESSAGES,
  type: string, // 単純化
  details?: string,
  code?: string,
): AppError => {
  // 型キャストを使用して安全にプロパティアクセス
  const message =
    ERROR_MESSAGES[category]?.[type as keyof (typeof ERROR_MESSAGES)[typeof category]] || ERROR_MESSAGES.SYSTEM.UNKNOWN;
  const errorCode = code || `${category}_${type}`.toUpperCase();

  return {
    message,
    code: errorCode,
    details,
    category,
  };
};

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

  // エラーコードが存在することを確認済みなので安全に使用可能
  return retryableCodes.includes(error.code);
};

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

export const formatErrorDetails = (error: AppError | null): string => {
  if (!error) return '';

  const { code, details, category } = error;
  return [
    code ? `エラーコード: ${code}` : 'エラーコード: 不明',
    category ? `カテゴリ: ${String(category)}` : 'カテゴリ: 不明', // String()でラップ
    details ? `詳細: ${details}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

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
