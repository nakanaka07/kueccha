import { useState, useEffect, useCallback, useMemo } from 'react';
import { AREAS } from '../../../constants/areas';
import { fetchAllAreaData } from '../../../services/sheets';
import { createError } from '../../../services/errors';
import { useDataCache } from '../../../hooks/useDataCache';
import type { Poi, AreaType, AppError } from '../../../types/common';

/**
 * Google Sheetsからデータを取得して利用するカスタムフック
 */
export function useSheetData() {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { lastCacheCleared, clearCache } = useDataCache();

  // データ取得ロジック
  const fetchData = useCallback(async (useCache = true) => {
    // すでに読み込み中の場合は処理しない
    if (isLoading) return;

    // キャッシュを使うか判断
    const shouldUseCache = useCache && isFetched;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedPois = await fetchAllAreaData(shouldUseCache);
      setPois(fetchedPois);
      setIsFetched(true);
      setIsLoaded(true);
    } catch (err) {
      console.error('データ取得エラー:', err);
      let appError: AppError;

      if (err instanceof Error) {
        appError = createError(
          'DATA',
          'FETCH_FAILED',
          err.message,
          err.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'FETCH_ERROR'
        );
      } else {
        appError = createError('DATA', 'UNKNOWN', String(err));
      }

      setError(appError);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFetched]);

  // 最初のレンダリングでデータをフェッチする
  useEffect(() => {
    if (!isFetched) {
      fetchData(true);
    }
  }, [fetchData, isFetched]);

  // キャッシュがクリアされたら再取得
  useEffect(() => {
    if (lastCacheCleared && isFetched) {
      fetchData(false);
    }
  }, [lastCacheCleared, fetchData, isFetched]);

  // データを再取得するための関数
  const refetch = useCallback((forceRefresh = false) => {
    if (forceRefresh) {
      // 強制リフレッシュの場合はキャッシュもクリア
      clearCache();
    }

    setIsFetched(false);
    setError(null);
  }, [clearCache]);

  // カテゴリー別にPOIを分類したデータを提供
  const poisByCategory = useMemo(() => {
    const result: Record<string, Poi[]> = {};

    pois.forEach((poi) => {
      const category = poi.category || 'その他';
      if (!result[category]) {
        result[category] = [];
      }
      result[category].push(poi);
    });

    return result;
  }, [pois]);

  // エリア別にPOIを分類したデータを提供
  const poisByArea = useMemo(() => {
    const result: Record<AreaType, Poi[]> = {} as Record<AreaType, Poi[]>;

    Object.keys(AREAS).forEach((area) => {
      result[area as AreaType] = pois.filter((poi) => poi.area === area);
    });

    return result;
  }, [pois]);

  return {
    pois,
    poisByCategory,
    poisByArea,
    isLoading,
    isLoaded,
    error,
    refetch,
  };
}
