import { useState, useEffect, useCallback, useMemo } from 'react';
import { AREAS } from '../../../constants/areas';
import { fetchAllAreaData, handleSheetsError, SHEETS_API_CONFIG } from '../../../services/sheets';
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

  // データ取得ロジックはサービスに委譲
  const fetchData = useCallback(async () => {
    // すでに読み込み中または取得済みの場合は処理しない
    if (isLoading || isFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedPois = await fetchAllAreaData();
      setPois(fetchedPois);
      setIsFetched(true);
      setIsLoaded(true);
    } catch (err) {
      setError(handleSheetsError(err, SHEETS_API_CONFIG.MAX_RETRIES));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFetched]);

  // 最初のレンダリングでデータをフェッチする
  useEffect(() => {
    if (!isFetched) {
      fetchData();
    }
  }, [fetchData, isFetched]);

  // データを再取得するための関数
  const refetch = useCallback(() => {
    setIsFetched(false);
    setError(null);
  }, []);

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
