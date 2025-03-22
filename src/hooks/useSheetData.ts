import { useState, useEffect, useCallback } from 'react';

import { AREAS, ERROR_MESSAGES } from '../constants/constants';
import { CONFIG, validateConfig } from '../services/config.services';
import type { Poi, AreaType } from '../types/types';

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

const handleError = (error: unknown, retryCount: number): FetchError => {
  console.error(error);
  const message =
    retryCount < API_CONFIG.MAX_RETRIES
      ? ERROR_MESSAGES.DATA.FETCH_FAILED
      : 'データの取得に失敗しました。インターネット接続を確認し、再試行してください。';

  return { message, code: 'FETCH_ERROR' };
};

const parseWKT = (wkt: string): { lat: number; lng: number } | null => {
  try {
    const match = wkt.match(/POINT\s*\(([0-9.]+)\s+([0-9.]+)\)/);
    if (match) {
      const lng = Number(match[1]);
      const lat = Number(match[2]);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinate values:', { lat, lng });
        return null;
      }

      if (lat < 37.5 || lat > 38.5 || lng < 138.0 || lng > 138.6) {
        console.warn('Coordinates outside Sado Island area:', { lat, lng });
        return null;
      }

      return { lat, lng };
    }
  } catch (error) {
    console.warn('WKT parse error:', error);
  }
  return null;
};

export function useSheetData() {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FetchError | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchAreaData = useCallback(async (area: AreaType, retryCount = 0): Promise<Poi[]> => {
    const areaName = AREAS[area];
    const url = `${API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${area === 'RECOMMEND' ? 'おすすめ' : areaName}!A:AX?key=${CONFIG.sheets.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429 && retryCount < API_CONFIG.MAX_RETRIES) {
          await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
          return fetchAreaData(area, retryCount + 1);
        }
        throw new Error(`Failed to fetch data for area: ${area}`);
      }
      const data = await response.json();

      return (data.values?.slice(1) || [])
        .filter((row: string[]) => row[1] && row[33])
        .map((row: string[]): Poi | null => {
          const coordinates = parseWKT(row[1]);
          if (!coordinates) return null;

          return {
            id: row[1],
            name: String(row[32]),
            area: area as AreaType,
            location: coordinates,
            genre: row[33],
            category: row[34],
            parking: row[35],
            payment: row[36],
            monday: row[37],
            tuesday: row[38],
            wednesday: row[39],
            thursday: row[40],
            friday: row[41],
            saturday: row[42],
            sunday: row[43],
            holiday: row[44],
            holidayInfo: row[45],
            information: row[46],
            view: row[47],
            phone: row[48],
            address: row[49],
          };
        })
        .filter((poi: Poi | null): poi is Poi => poi !== null);
    } catch (error) {
      if (retryCount < API_CONFIG.MAX_RETRIES) {
        await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
        return fetchAreaData(area, retryCount + 1);
      }
      throw error;
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (isLoading || isFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      validateConfig(CONFIG);

      const normalAreas = Object.keys(AREAS).filter(
        (area) => area !== 'RECOMMEND' && area !== 'CURRENT_LOCATION',
      ) as AreaType[];

      const normalPoisArrays = await Promise.all(normalAreas.map((area) => fetchAreaData(area)));
      const recommendPois = await fetchAreaData('RECOMMEND');

      const poisMap = new Map(normalPoisArrays.flat().map((poi) => [poi.id, poi]));
      recommendPois.forEach((poi) => poisMap.set(poi.id, poi));

      setPois(Array.from(poisMap.values()));
      setIsFetched(true);
      setIsLoaded(true);
    } catch (err) {
      setError(handleError(err, API_CONFIG.MAX_RETRIES));
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

  return { pois, isLoading, isLoaded, error, refetch };
}
