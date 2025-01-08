import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../utils/config';
import type { Poi, AreaType } from '../utils/types';
import { AREAS, ERROR_MESSAGES } from '../utils/constants';

type LatLngLiteral = google.maps.LatLngLiteral;

interface FetchError {
  message: string;
  code: string;
}

const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
} as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useSheetData() {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FetchError | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const validateConfig = () => {
    if (!CONFIG.sheets.spreadsheetId || !CONFIG.sheets.apiKey) {
      throw new Error(ERROR_MESSAGES.CONFIG.MISSING);
    }
  };

  const fetchAreaData = useCallback(async (area: string, retryCount = 0): Promise<Poi[]> => {
    const areaName = AREAS[area as AreaType];
    const url = `${API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${area === 'RECOMMEND' ? 'おすすめ' : areaName}!A:AY?key=${CONFIG.sheets.apiKey}`;

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
      console.error(err);
      if (retryCount < API_CONFIG.MAX_RETRIES) {
        await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
        return fetchAreaData(area, retryCount + 1);
      }
      throw new Error(ERROR_MESSAGES.DATA.FETCH_FAILED);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (isLoading || isFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      validateConfig();
      const normalAreas = Object.keys(AREAS).filter((area) => area !== 'RECOMMEND');
      const normalPoisArrays = await Promise.all(normalAreas.map((area) => fetchAreaData(area)));
      const recommendPois = await fetchAreaData('RECOMMEND');

      const poisMap = new Map(normalPoisArrays.flat().map((poi) => [poi.id, poi]));
      recommendPois.forEach((poi) => poisMap.set(poi.id, poi));

      setPois(Array.from(poisMap.values()));
      setIsFetched(true);
    } catch (err) {
      console.error(err);
      setError({
        message:
          err instanceof Error
            ? err.message
            : 'データの取得に失敗しました。インターネット接続を確認し、再試行してください。',
        code: 'FETCH_ERROR',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFetched, fetchAreaData]);

  useEffect(() => {
    if (!isFetched) {
      fetchData();
    }
  }, [fetchData, isFetched]);

  const refetch = useCallback(() => {
    setIsFetched(false);
    setError(null);
  }, []);

  return { pois, isLoading, error, refetch };
}
