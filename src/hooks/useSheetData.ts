// Reactのフックをインポートします。
// useState: 状態管理のためのフック
// useEffect: 副作用を処理するためのフック
// useCallback: メモ化されたコールバック関数を作成するためのフック
import { useState, useEffect, useCallback } from 'react';
// アプリケーションの設定と検証関数をインポートします。
import { CONFIG } from '../utils/config';
import { validateConfig } from '../utils/config';
// 定数とエラーメッセージをインポートします。
import { AREAS, ERROR_MESSAGES } from '../utils/constants';
// 型定義をインポートします。
// Poi: POI（ポイントオブインタレスト）の型
// AreaType: エリアの型
import type { Poi, AreaType } from '../utils/types';

// FetchErrorインターフェースの定義
// エラーメッセージとエラーコードを含むオブジェクトの型を定義します。
interface FetchError {
  message: string;
  code: string;
}

// APIの設定
// 最大リトライ回数、リトライ間隔、ベースURLを定義します。
const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
} as const;

// 指定した時間だけ待機する関数
// 非同期処理で指定した時間(ms)だけ待機します。
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// エラーハンドリング関数
// エラーが発生した場合の処理を定義します。
const handleError = (error: unknown, retryCount: number): FetchError => {
  console.error(error);
  if (retryCount < API_CONFIG.MAX_RETRIES) {
    return { message: ERROR_MESSAGES.DATA.FETCH_FAILED, code: 'FETCH_ERROR' };
  }
  return {
    message:
      'データの取得に失敗しました。インターネット接続を確認し、再試行してください。',
    code: 'FETCH_ERROR',
  };
};

// WKT形式の座標を解析する関数
// WKT形式の文字列から緯度経度を抽出します。
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

// useSheetDataフックの定義
// Google Sheetsからデータを取得し、状態を管理するカスタムフックです。
export function useSheetData() {
  // POIの配列を管理する状態変数
  const [pois, setPois] = useState<Poi[]>([]);
  // ローディング状態を管理する状態変数
  const [isLoading, setIsLoading] = useState(false);
  // エラー情報を管理する状態変数
  const [error, setError] = useState<FetchError | null>(null);
  // データが取得済みかどうかを管理する状態変数
  const [isFetched, setIsFetched] = useState(false);

  // エリアデータを取得する関数
  const fetchAreaData = useCallback(
    async (area: AreaType, retryCount = 0): Promise<Poi[]> => {
      const areaName = AREAS[area];
      const url = `${API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${area === 'RECOMMEND' ? 'おすすめ' : areaName}!A:AX?key=${CONFIG.sheets.apiKey}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 429 && retryCount < API_CONFIG.MAX_RETRIES) {
            await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
            return fetchAreaData(area, retryCount + 1);
          }
          throw new Error();
        }
        const data = await response.json();

        return (data.values?.slice(1) || [])
          .filter((row: string[]) => row[1] && row[33])
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
    },
    [],
  );

  // データを取得する関数
  const fetchData = useCallback(async () => {
    if (isLoading || isFetched) return;

    setIsLoading(true);
    setError(null);
    console.log('Fetching data...');

    try {
      validateConfig(CONFIG);
      const normalAreas = Object.keys(AREAS).filter(
        (area) => area !== 'RECOMMEND' && area !== 'CURRENT_LOCATION',
      ) as AreaType[];
      const normalPoisArrays = await Promise.all(
        normalAreas.map((area) => fetchAreaData(area)),
      );
      const recommendPois = await fetchAreaData('RECOMMEND');

      const poisMap = new Map(
        normalPoisArrays.flat().map((poi) => [poi.id, poi]),
      );
      recommendPois.forEach((poi) => poisMap.set(poi.id, poi));

      setPois(Array.from(poisMap.values()));
      setIsFetched(true);
      console.log('Data fetched successfully:', Array.from(poisMap.values()));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(handleError(err, API_CONFIG.MAX_RETRIES));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFetched, fetchAreaData]);

  // コンポーネントのマウント時にデータを取得する
  useEffect(() => {
    if (!isFetched) {
      fetchData();
    }
  }, [fetchData, isFetched]);

  // データの再取得を行う関数
  const refetch = useCallback(() => {
    setIsFetched(false);
    setError(null);
  }, []);

  return { pois, isLoading, error, refetch };
}
