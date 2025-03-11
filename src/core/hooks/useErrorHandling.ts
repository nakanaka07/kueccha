import { useMemo, useState, useCallback } from 'react';
import { formatErrorDetails, isRetryableError, getErrorSeverity } from '../utils/errorHandling';
import type { AppError } from '../types/common';

/**
 * 複数のエラーソースを組み合わせ、エラー状態を管理するフック
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

/**
 * 単一のエラーソース用のシンプルなエラー状態管理フック
 */
export function useErrorState() {
  const [error, setError] = useState<AppError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setErrorWithTimeout = useCallback(
    (newError: AppError, timeoutMs = 5000) => {
      setError(newError);

      if (timeoutMs > 0) {
        const timer = setTimeout(() => {
          clearError();
        }, timeoutMs);

        return () => clearTimeout(timer);
      }
    },
    [clearError],
  );

  return {
    error,
    setError,
    clearError,
    setErrorWithTimeout,
    isRetryable: isRetryableError(error),
    severity: getErrorSeverity(error),
    errorDetails: formatErrorDetails(error),
  };
}

// ErrorComponent生成ユーティリティ - 循環インポート防止のためフックファイルに移動
export function createErrorComponent(ErrorDisplayComponent: React.ComponentType<any>) {
  return function getErrorComponent(error: AppError | null, onRetry?: () => void) {
    return () => <ErrorDisplayComponent error={error} onRetry={onRetry} />;
  };
}
