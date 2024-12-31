// hooks/useSheetData.ts
import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config';
import type { Poi, AreaType } from '../types';
import { AREAS } from '../constants';

// Google Maps型
type LatLngLiteral = google.maps.LatLngLiteral;

// エラー型の定義
interface FetchError {
  message: string;
  code: string;
}

// APIフェッチの設定
const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
} as const;

// ユーティリティ関数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useSheetData() {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FetchError | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const validateConfig = useCallback(() => {
    if (!CONFIG.sheets.spreadsheetId || !CONFIG.sheets.apiKey) {
      throw new Error('API configuration missing');
    }
  }, []);

  const fetchAreaData = useCallback(async (area: string, retryCount = 0): Promise<Poi[]> => {
    const areaName = AREAS[area as AreaType];
    const url = `${API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${areaName}!A:AY?key=${CONFIG.sheets.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      return (data.values?.slice(1) || [])
        .filter((row: string[]) => row[49] && row[43])
        .map(
          (row: string[]): Poi => ({
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
      if (retryCount < API_CONFIG.MAX_RETRIES) {
        await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
        return fetchAreaData(area, retryCount + 1);
      }
      throw err;
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (isLoading || isFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      validateConfig();
      const areaPromises = Object.keys(AREAS).map((area) => fetchAreaData(area));
      const poisArrays = await Promise.all(areaPromises);
      const uniquePois = Array.from(
        new Map(poisArrays.flat().map((poi) => [poi.id, poi])).values(),
      );

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

  const refetch = useCallback(() => {
    setIsFetched(false);
    setError(null);
  }, []);

  return { pois, isLoading, error, refetch };
}
