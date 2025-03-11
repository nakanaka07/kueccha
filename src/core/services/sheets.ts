import { SheetData, FetchStatus } from '@core/types/sheets';
import { handleApiError } from '@core/utils/errorHandling';
import { useState, useEffect } from 'react';
import { AREAS } from '@core/constants/areas';
import { CONFIG } from '@core/constants/config';
import { Poi, AreaType, AppError } from '@core/types';
import { createError } from './errors';

export const SHEETS_API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 30000,
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
  GEOGRAPHIC_BOUNDS: {
    LAT_MIN: 37.5,
    LAT_MAX: 38.5,
    LNG_MIN: 138.0,
    LNG_MAX: 138.6,
  },
  CACHE_TTL: 10 * 60 * 1000,
} as const;

interface CacheEntry {
  data: Poi[];
  timestamp: number;
}
const dataCache: Record<string, CacheEntry> = {};

export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const handleSheetsError = (error: unknown, retryCount: number): AppError => {
  return handleApiError(error, retryCount, SHEETS_API_CONFIG.MAX_RETRIES, SHEETS_API_CONFIG.RETRY_DELAY, 'シート');
};

export const parseWKT = (wkt: string): { lat: number; lng: number } | null => {
  try {
    const match = wkt.match(/POINT\s*\(([0-9.]+)\s+([0-9.]+)\)/);
    if (match) {
      const lng = Number(match[1]);
      const lat = Number(match[2]);

      if (isNaN(lat) || isNaN(lng)) {
        console.warn('無効な座標値です:', { lat, lng });
        return null;
      }

      const { LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX } = SHEETS_API_CONFIG.GEOGRAPHIC_BOUNDS;

      if (lat < LAT_MIN || lat > LAT_MAX || lng < LNG_MIN || lng > LNG_MAX) {
        console.warn('座標が佐渡島の範囲外です:', { lat, lng });
        return null;
      }

      return { lat, lng };
    }
  } catch (error) {
    console.warn('WKT解析エラー:', error);
  }
  return null;
};

export const getAreaEndpoint = (area: AreaType): string => {
  const areaName = AREAS[area];
  return `${SHEETS_API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${
    area === 'RECOMMEND' ? 'おすすめ' : areaName
  }!A:AX?key=${CONFIG.sheets.apiKey}`;
};

export const convertSheetRowToPoi = (row: string[], area: AreaType): Poi | null => {
  if (!row[1] || !row[32]) return null;

  const coordinates = parseWKT(row[1]);
  if (!coordinates) return null;

  return {
    id: row[1],
    name: String(row[32]),
    area: area as AreaType,
    location: coordinates,
    genre: row[33] || '',
    category: row[34] || '',
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
};

export const processSheetResponse = async (response: Response, area: AreaType): Promise<Poi[]> => {
  if (!response.ok) {
    const statusCode = response.status;
    const errorText = await response.text();

    throw new Error(`エリア ${area} のデータ取得に失敗しました。ステータス: ${statusCode}, 詳細: ${errorText}`);
  }

  const data = await response.json();

  return (data.values?.slice(1) || [])
    .map((row: string[]) => convertSheetRowToPoi(row, area))
    .filter((poi: Poi | null): poi is Poi => poi !== null);
};

export const isCacheValid = (cacheKey: string): boolean => {
  const entry = dataCache[cacheKey];
  if (!entry) return false;

  const now = Date.now();
  return now - entry.timestamp < SHEETS_API_CONFIG.CACHE_TTL;
};

export const fetchAreaData = async (area: AreaType, retryCount = 0, useCache = true): Promise<Poi[]> => {
  const cacheKey = `area_${area}`;
  if (useCache && isCacheValid(cacheKey)) {
    console.log(`キャッシュから ${area} のデータを使用`);
    return dataCache[cacheKey].data;
  }

  const url = getAreaEndpoint(area);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SHEETS_API_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const pois = await processSheetResponse(response, area);

    if (useCache) {
      dataCache[cacheKey] = {
        data: pois,
        timestamp: Date.now(),
      };
    }

    return pois;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw createError('DATA', 'TIMEOUT', `エリア ${area} のデータ取得がタイムアウトしました`, 'SHEET_TIMEOUT');
    }

    if (retryCount < SHEETS_API_CONFIG.MAX_RETRIES) {
      console.warn(`エラー発生、再試行中 (${retryCount + 1}/${SHEETS_API_CONFIG.MAX_RETRIES})`, error);
      await delay(SHEETS_API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
      return fetchAreaData(area, retryCount + 1, useCache);
    }

    throw error;
  }
};

export const fetchAllAreaData = async (useCache = true): Promise<Poi[]> => {
  const cacheKey = 'all_areas';
  if (useCache && isCacheValid(cacheKey)) {
    console.log('キャッシュから全エリアデータを使用');
    return dataCache[cacheKey].data;
  }

  try {
    const normalAreas = Object.keys(AREAS).filter(
      (area) => area !== 'RECOMMEND' && area !== 'CURRENT_LOCATION',
    ) as AreaType[];

    const results = await Promise.allSettled(normalAreas.map((area) => fetchAreaData(area, 0, useCache)));

    let normalPois: Poi[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        normalPois = normalPois.concat(result.value);
      } else {
        console.error(`エリア ${normalAreas[index]} の取得に失敗:`, result.reason);
      }
    });

    let recommendPois: Poi[] = [];
    try {
      recommendPois = await fetchAreaData('RECOMMEND', 0, useCache);
    } catch (error) {
      console.error('おすすめデータの取得に失敗:', error);
    }

    const poisMap = new Map(normalPois.map((poi) => [poi.id, poi]));
    recommendPois.forEach((poi) => poisMap.set(poi.id, poi));

    const result = Array.from(poisMap.values());

    if (useCache) {
      dataCache[cacheKey] = {
        data: result,
        timestamp: Date.now(),
      };
    }

    return result;
  } catch (error) {
    console.error('全エリアデータの取得中にエラーが発生しました:', error);
    throw createError(
      'DATA',
      'FETCH_FAILED',
      error instanceof Error ? error.message : String(error),
      'ALL_AREAS_ERROR',
    );
  }
};

export const clearCache = (areaKey?: string): void => {
  if (areaKey) {
    delete dataCache[`area_${areaKey}`];
  } else {
    Object.keys(dataCache).forEach((key) => delete dataCache[key]);
  }
};

export const fetchSheetData = async (): Promise<SheetData> => {
  return {} as SheetData;
};

export const useSheetData = () => {
  const [data, setData] = useState<SheetData | null>(null);
  const [status, setStatus] = useState<FetchStatus>('idle');

  useEffect(() => {
    const loadData = async () => {
      try {
        setStatus('loading');
        const result = await fetchSheetData();
        setData(result);
        setStatus('success');
      } catch (error) {
        console.error('Failed to fetch sheet data:', error);
        setStatus('error');
      }
    };

    loadData();
  }, []);

  return { data, status };
};
