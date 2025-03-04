import { useMemo } from 'react';
import { ERROR_MESSAGES } from '../constants/messages';
import type { AppError } from '../types/common';

/**
 * エラーコードに基づいて適切なエラーメッセージを取得
 */
function getErrorMessage(error: AppError): string {
  if (!error) return '';

  // エラーコードに基づいたメッセージマッピング
  if (error.code) {
    switch (error.code) {
      // マップ関連エラー
      case 'MAP_LOAD_FAILED':
        return ERROR_MESSAGES.MAP.LOAD_FAILED;
      case 'MAP_CONFIG_MISSING':
        return ERROR_MESSAGES.MAP.CONFIG_MISSING;

      // データ関連エラー
      case 'DATA_FETCH_FAILED':
        return ERROR_MESSAGES.DATA.FETCH_FAILED;
      case 'DATA_LOADING_FAILED':
        return ERROR_MESSAGES.DATA.LOADING_FAILED;

      // 設定関連エラー
      case 'CONFIG_INVALID':
        return ERROR_MESSAGES.CONFIG.INVALID;
      case 'CONFIG_MISSING':
        return ERROR_MESSAGES.CONFIG.MISSING;

      // 位置情報関連エラー
      case 'GEOLOCATION_PERMISSION_DENIED':
        return ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
      case 'GEOLOCATION_POSITION_UNAVAILABLE':
        return ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
      case 'GEOLOCATION_TIMEOUT':
        return ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
    }
  }

  // エラーメッセージがある場合はそれを返し、なければデフォルトエラー
  return error.message || ERROR_MESSAGES.SYSTEM.UNKNOWN;
}

/**
 * エラーが再試行可能かどうかを判定
 */
function isRetryableError(error: AppError): boolean {
  if (!error || !error.code) return false;

  // 再試行可能なエラーコード
  const retryableCodes = [
    'MAP_LOAD_FAILED',
    'DATA_FETCH_FAILED',
    'DATA_LOADING_FAILED',
    'GEOLOCATION_TIMEOUT',
    'GEOLOCATION_POSITION_UNAVAILABLE',
  ];

  return retryableCodes.includes(error.code);
}

/**
 * 複数ソースからのエラーを処理するカスタムフック
 * エラーの優先順位付け、メッセージ生成、再試行可能性の判定を行う
 *
 * @param mapError マップ関連のエラー
 * @param poisError POIデータ関連のエラー
 * @returns 統合されたエラー情報とエラーメッセージ、詳細、再試行可否
 */
export function useErrorHandling(mapError: AppError | null, poisError: AppError | null) {
  // マップエラーを優先する（マップが動かなければPOIデータは意味がない）
  const combinedError = useMemo<AppError | null>(() => {
    return mapError || poisError || null;
  }, [mapError, poisError]);

  // エラーメッセージの生成
  const errorMessage = useMemo(() => {
    if (!combinedError) return '';
    return getErrorMessage(combinedError);
  }, [combinedError]);

  // エラー詳細の提供
  const errorDetails = useMemo(() => {
    return combinedError?.details || '';
  }, [combinedError]);

  // エラーが再試行可能かどうか
  const isRetryable = useMemo(() => {
    return combinedError ? isRetryableError(combinedError) : false;
  }, [combinedError]);

  // エラータイプの判別（デバッグやログ記録に有用）
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
    errorType,
  };
}
