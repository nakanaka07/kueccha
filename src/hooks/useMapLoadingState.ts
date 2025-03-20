import { useState, useEffect } from 'react';
import { UI } from '../constants';
import { DEFAULT_LOADING_TIMEOUT } from '../constants/loading.constants';
import { logError } from '../utils/logger';

/**
 * ローディング状態とタイムアウト検知を管理するカスタムフック
 */
export function useMapLoadingState(
  isLoaded: boolean,
  loadError: Error | null | undefined,
  timeoutDuration = DEFAULT_LOADING_TIMEOUT,
  errorCategory = 'MAP'
) {
  const [isTimeout, setIsTimeout] = useState(false);

  // タイムアウト検知のエフェクト
  useEffect(() => {
    if (!isLoaded && !loadError) {
      const timer = setTimeout(() => {
        setIsTimeout(true);
        logError(
          errorCategory,
          'LOAD_TIMEOUT',
          UI.Loading.default.message || 'コンテンツの読み込みがタイムアウトしました'
        );
      }, timeoutDuration);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, loadError, timeoutDuration, errorCategory]);

  return {
    isTimeout,
    resetState: () => setIsTimeout(false)
  };
}