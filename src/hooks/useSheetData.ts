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

// 指定したミリ秒だけ待機する関数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// エラーハンドリング関数
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

// フェッチ関数をリトライする関数
const retryFetch = async (
  fetchFunction: () => Promise<any>,
  retryCount: number,
): Promise<any> => {
  try {
    return await fetchFunction();
  } catch (error) {
    if (retryCount < API_CONFIG.MAX_RETRIES) {
      await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
      return retryFetch(fetchFunction, retryCount + 1);
    }
    throw error;
  }
};

// WKT形式の文字列をパースして座標を取得する関数
const parseWKT = (wkt: string): { lat: number; lng: number } | null => {
  try {
    const match = wkt.match(/POINT\s*\(([0-9.]+)\s+([0-9.]+)\)/);
    if (match) {
      const lng = Number(match[1]); // 経度
      const lat = Number(match[2]); // 緯度

      // 座標の妥当性チェック
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('Invalid coordinate values:', { lat, lng });
        return null;
      }

      // 佐渡島周辺の座標範囲チェック
      if (
        lat < 37.5 ||
        lat > 38.5 || // 佐渡島の緯度範囲
        lng < 138.0 ||
        lng > 138.6 // 佐渡島の経度範囲
      ) {
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

  // CONFIGの検証
  const validateConfig = () => {
    if (!CONFIG.sheets.spreadsheetId || !CONFIG.sheets.apiKey) {
      throw new Error(ERROR_MESSAGES.CONFIG.MISSING);
    }
  };

  // 指定されたエリアのデータを取得
  const fetchAreaData = useCallback(
    async (area: string, retryCount = 0): Promise<Poi[]> => {
      const areaName = AREAS[area as AreaType];
      const url = `${API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${area === 'RECOMMEND' ? 'おすすめ' : areaName}!A:AX?key=${CONFIG.sheets.apiKey}`;

      const fetchFunction = async () => {
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
          .filter((row: string[]) => row[1] && row[33]) // WKTとAG列（名称）が存在するものをフィルタリング
          .map((row: string[]): Poi | null => {
            const coordinates = parseWKT(row[1]);
            if (!coordinates) {
              return null;
            }

            return {
              id: row[1], // WKTをIDとして使用
              name: String(row[32]), // 名称
              area: area as AreaType,
              location: coordinates,
              genre: row[33], // ジャンル
              category: row[34], // カテゴリー
              parking: row[35], // 駐車場情報
              payment: row[36], // キャッシュレス
              monday: row[37], // 月曜
              tuesday: row[38], // 火曜
              wednesday: row[39], // 水曜
              thursday: row[40], // 木曜
              friday: row[41], // 金曜
              saturday: row[42], // 土曜
              sunday: row[43], // 日曜
              holiday: row[44], // 祝祭
              holidayInfo: row[45], // 定休日について
              information: row[46], // 関連情報
              view: row[47], // Google マップで見る
              phone: row[48], // 問い合わせ
              address: row[49], // 所在地
            };
          })
          .filter((poi: Poi | null): poi is Poi => poi !== null);
      };

      return retryFetch(fetchFunction, retryCount);
    },
    [],
  );

  // 全エリアのデータを取得
  const fetchData = useCallback(async () => {
    if (isLoading || isFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      validateConfig();
      const normalAreas = Object.keys(AREAS).filter(
        (area) => area !== 'RECOMMEND' && area !== 'CURRENT_LOCATION',
      );
      const normalPoisArrays = await Promise.all(
        normalAreas.map((area) => fetchAreaData(area)),
      );
      const recommendPois = await fetchAreaData('RECOMMEND');

      // POIデータをマージして一意のIDを持つマップを作成
      const poisMap = new Map(
        normalPoisArrays.flat().map((poi) => [poi.id, poi]),
      );
      recommendPois.forEach((poi) => poisMap.set(poi.id, poi));

      // マップから配列に変換して状態を更新
      setPois(Array.from(poisMap.values()));
      setIsFetched(true);
    } catch (err) {
      console.error(err);
      setError(handleError(err, API_CONFIG.MAX_RETRIES));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFetched, fetchAreaData]);

  // コンポーネントのマウント時にデータを取得
  useEffect(() => {
    if (!isFetched) {
      fetchData();
    }
  }, [fetchData, isFetched]);

  // データの再取得
  const refetch = useCallback(() => {
    setIsFetched(false);
    setError(null);
  }, []);

  return { pois, isLoading, error, refetch };
}
