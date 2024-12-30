// hooks/useSheetData.ts
import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config';
import type { Poi, AreaType } from '../types';
import { AREAS } from '../types';

// 型定義
type LatLngLiteral = google.maps.LatLngLiteral;
type FetchError = {
  message: string;
  code: string;
};

// 定数
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ユーティリティ関数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useSheetData() {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FetchError | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  // API設定のバリデーション
  const validateConfig = useCallback(() => {
    if (!CONFIG.sheets.spreadsheetId || !CONFIG.sheets.apiKey) {
      throw new Error('API configuration missing');
    }
  }, []);

  // 単一エリアのデータフェッチ
  const fetchAreaData = useCallback(async (area: string, retryCount = 0): Promise<Poi[]> => {
    const areaName = AREAS[area as AreaType];
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.sheets.spreadsheetId}/values/${areaName}!A:AY?key=${CONFIG.sheets.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const values: string[][] | undefined = data.values;

      return (values?.slice(1) || [])
        .filter((row) => row[49] && row[43])
        .map(
          (row): Poi => ({
            id: String(row[49]),
            name: String(row[43]),
            area: area as AreaType,
            location: {
              lat: Number(row[47]),
              lng: Number(row[46]),
            } as LatLngLiteral,
            category: row[26],
            genre: row[27],
            description: row[36],
            reservation: row[37],
            payment: row[38],
            phone: row[39],
            address: row[40],
            information: row[41],
            view: row[42],
            monday: row[28],
            tuesday: row[29],
            wednesday: row[30],
            thursday: row[31],
            friday: row[32],
            saturday: row[33],
            sunday: row[34],
            holiday: row[35],
          }),
        );
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        await delay(RETRY_DELAY * (retryCount + 1));
        return fetchAreaData(area, retryCount + 1);
      }
      throw err;
    }
  }, []);

  // メインのデータフェッチ関数
  const fetchData = useCallback(async () => {
    if (isLoading || isFetched) return;

    setIsLoading(true);
    try {
      validateConfig();

      const areaPromises = Object.keys(AREAS).map((area) => fetchAreaData(area));
      const poisArrays = await Promise.all(areaPromises);
      const allPois = poisArrays.flat();

      const uniquePois = Array.from(new Map(allPois.map((poi) => [poi.id, poi])).values());

      setPois(uniquePois);
      setIsFetched(true);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : '未知のエラーが発生しました',
        code: 'FETCH_ERROR',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFetched, fetchAreaData, validateConfig]);

  useEffect(() => {
    const abortController = new AbortController();

    if (!isFetched) {
      fetchData();
    }

    return () => {
      abortController.abort();
    };
  }, [fetchData, isFetched]);

  // データの再フェッチ用の関数
  const refetch = useCallback(() => {
    setIsFetched(false);
    setError(null);
  }, []);

  return { pois, isLoading, error, refetch };
}
