import { AREAS } from '../constants/areas';
import { CONFIG } from '../constants/config';
import { ERROR_MESSAGES } from '../constants/messages';
import type { Poi, AreaType, AppError } from '../types/common';

// API関連の定数
export const SHEETS_API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
  GEOGRAPHIC_BOUNDS: {
    LAT_MIN: 37.5,
    LAT_MAX: 38.5,
    LNG_MIN: 138.0,
    LNG_MAX: 138.6,
  },
} as const;

/**
 * 指定したミリ秒待機するためのユーティリティ関数
 */
export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * エラーハンドリングを行う関数
 */
export const handleSheetsError = (error: unknown, retryCount: number): AppError => {
  console.error('データ取得エラー:', error);

  // ネットワークエラーの特定
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
      return {
        message: ERROR_MESSAGES.DATA.FETCH_FAILED,
        code: 'NETWORK_ERROR',
        details: error.message,
      };
    }

    // APIキーに関連する問題の特定
    if (error.message.includes('API key') || error.message.includes('403')) {
      return {
        message: ERROR_MESSAGES.CONFIG.INVALID,
        code: 'API_KEY_ERROR',
        details: error.message,
      };
    }
  }

  if (retryCount < SHEETS_API_CONFIG.MAX_RETRIES) {
    return {
      message: `${ERROR_MESSAGES.DATA.FETCH_FAILED} 再試行しています (${retryCount + 1}/${SHEETS_API_CONFIG.MAX_RETRIES})`,
      code: 'FETCH_ERROR_RETRYING',
      details: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    message: ERROR_MESSAGES.DATA.FETCH_FAILED,
    code: 'FETCH_ERROR_MAX_RETRIES',
    details: error instanceof Error ? error.message : String(error),
  };
};

/**
 * WKT形式の座標を解析する関数
 */
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

      // 座標が佐渡島の範囲内かチェック
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

/**
 * APIエンドポイントを構築する関数
 */
export const getAreaEndpoint = (area: AreaType): string => {
  const areaName = AREAS[area];
  return `${SHEETS_API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${
    area === 'RECOMMEND' ? 'おすすめ' : areaName
  }!A:AX?key=${CONFIG.sheets.apiKey}`;
};

/**
 * 1つのエリアのデータを取得する関数
 */
export const fetchAreaData = async (area: AreaType, retryCount = 0): Promise<Poi[]> => {
  const url = getAreaEndpoint(area);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const statusCode = response.status;
      const errorText = await response.text();

      // サーバーエラーや率制限エラーの場合は再試行
      if ((statusCode === 429 || statusCode >= 500) && retryCount < SHEETS_API_CONFIG.MAX_RETRIES) {
        console.warn(`サーバーエラー (${statusCode}), 再試行中 (${retryCount + 1}/${SHEETS_API_CONFIG.MAX_RETRIES})`);
        await delay(SHEETS_API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount)); // 指数バックオフ
        return fetchAreaData(area, retryCount + 1);
      }

      throw new Error(`エリア ${area} のデータ取得に失敗しました。ステータス: ${statusCode}, 詳細: ${errorText}`);
    }

    const data = await response.json();

    // データの変換と整形を行う
    return (data.values?.slice(1) || [])
      .filter((row: string[]) => row[1] && row[32]) // 座標と名前が存在するデータのみ
      .map((row: string[]): Poi | null => {
        const coordinates = parseWKT(row[1]);
        if (!coordinates) {
          return null;
        }

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
      })
      .filter((poi: Poi | null): poi is Poi => poi !== null);
  } catch (error) {
    // エラー時のリトライ処理
    if (retryCount < SHEETS_API_CONFIG.MAX_RETRIES) {
      await delay(SHEETS_API_CONFIG.RETRY_DELAY * (retryCount + 1));
      return fetchAreaData(area, retryCount + 1);
    }
    throw error;
  }
};

/**
 * 全エリアのデータを取得する関数
 */
export const fetchAllAreaData = async (): Promise<Poi[]> => {
  // 通常エリア（CURRENT_LOCATIONとRECOMMEND以外）を取得
  const normalAreas = Object.keys(AREAS).filter(
    (area) => area !== 'RECOMMEND' && area !== 'CURRENT_LOCATION',
  ) as AreaType[];

  // 並列でデータを取得
  const normalPoisArrays = await Promise.all(normalAreas.map((area) => fetchAreaData(area)));

  // おすすめのPOIも取得
  const recommendPois = await fetchAreaData('RECOMMEND');

  // 重複を削除して統合
  const poisMap = new Map(normalPoisArrays.flat().map((poi) => [poi.id, poi]));
  recommendPois.forEach((poi) => poisMap.set(poi.id, poi));

  return Array.from(poisMap.values());
};
