import { ERROR_MESSAGES } from '../constants/messages';
import type { AppError } from '../types/common';

/**
 * アプリケーションエラーを作成する関数
 */
export const createError = (
  category: keyof typeof ERROR_MESSAGES,
  type: string,
  details?: string,
  code?: string
): AppError => {
  // カテゴリとタイプからメッセージを取得
  const message = ERROR_MESSAGES[category]?.[type] || ERROR_MESSAGES.SYSTEM.UNKNOWN;
  // コードが指定されていない場合は自動生成
  const errorCode = code || `${category}_${type}`.toUpperCase();

  return {
    message,
    code: errorCode,
    details,
    category // エラーカテゴリの追加で分類しやすくする
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
  entityName: string = 'データ'
): AppError => {
  console.error(`${entityName}取得エラー:`, error);

  // ネットワークエラーの特定
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      return createError('DATA', 'FETCH_FAILED', error.message, 'NETWORK_ERROR');
    }

    // APIキーエラーの特定
    if (error.message.includes('API key') || error.message.includes('403')) {
      return createError('CONFIG', 'INVALID', error.message, 'API_KEY_ERROR');
    }

    // タイムアウトエラーの特定
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return createError('DATA', 'TIMEOUT', error.message, 'REQUEST_TIMEOUT');
    }
  }

  // リトライ中または最大リトライ回数に達した場合
  if (retryCount < maxRetries) {
    return createError(
      'DATA',
      'FETCH_FAILED',
      error instanceof Error ? error.message : String(error),
      'FETCH_ERROR_RETRYING'
    );
  }

  return createError(
    'DATA',
    'FETCH_FAILED',
    error instanceof Error ? error.message : String(error),
    'FETCH_ERROR_MAX_RETRIES'
  );
};

/**
 * エラーが再試行可能かどうかを判定する関数
 */
export const isRetryableError = (error: AppError | null): boolean => {
  if (!error || !error.code) return false;

  // 再試行可能なエラーコード
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

  // クリティカルエラー (アプリ機能に重大な影響を与えるもの)
  const criticalErrors = ['CONFIG_MISSING', 'API_KEY_ERROR', 'MAP_CONFIG_MISSING'];
  if (criticalErrors.includes(error.code)) return 'critical';

  // 警告レベルのエラー (一部機能が制限されるが、アプリは動作可能)
  const warningErrors = ['FETCH_ERROR_MAX_RETRIES', 'GEOLOCATION_PERMISSION_DENIED'];
  if (warningErrors.includes(error.code)) return 'warning';

  // 情報レベルのエラー (再試行可能で一時的な問題)
  const infoErrors = ['FETCH_ERROR_RETRYING', 'NETWORK_ERROR', 'REQUEST_TIMEOUT'];
  if (infoErrors.includes(error.code)) return 'info';

  return 'warning'; // デフォルトは警告レベル
};

/**
 * エラー詳細情報をフォーマットする関数
 */
export const formatErrorDetails = (error: AppError | null): string => {
  if (!error) return '';

  const { code, details, category } = error;
  return [
    `エラーコード: ${code || '不明'}`,
    `カテゴリ: ${category || '不明'}`,
    details ? `詳細: ${details}` : '',
  ].filter(Boolean).join('\n');
};