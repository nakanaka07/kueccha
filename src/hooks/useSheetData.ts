import { useState, useEffect, useCallback } from 'react';
import { CONFIG, validateConfig } from '../utils/config';
import { AREAS, ERROR_MESSAGES } from '../utils/constants';
import type { Poi, AreaType } from '../utils/types';

/**
 * Google Sheets APIからPOI（Point of Interest）データを取得・管理するカスタムフック
 *
 * このフックは、Google Sheets APIを使用して複数エリアのPOIデータを非同期で取得し、
 * データのロード状態、エラー状態を管理します。リトライ機能、WKT形式の座標変換、
 * データの重複排除などの処理も実装しています。
 *
 * @returns {Object} POIデータと関連する状態を含むオブジェクト
 *   @property {Poi[]} pois - 取得したPOI（Point of Interest）データの配列
 *   @property {boolean} isLoading - データ取得処理中かどうか
 *   @property {boolean} isLoaded - データが正常に読み込まれたかどうか
 *   @property {FetchError|null} error - エラー情報（存在する場合）
 *   @property {function} refetch - データを再取得するための関数
 *
 * @example
 * function MapComponent() {
 *   const { pois, isLoading, isLoaded, error, refetch } = useSheetData();
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   if (error) {
 *     return (
 *       <div>
 *         <p>エラー: {error.message}</p>
 *         <button onClick={refetch}>再試行</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <div>
 *       <h2>POI一覧 ({pois.length}件)</h2>
 *       <ul>
 *         {pois.map(poi => (
 *           <li key={poi.id}>{poi.name}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - このフックを使用する前に、CONFIG内にGoogle Sheets APIキーと対象スプレッドシートIDが設定されている必要があります
 * - 各エリアのデータは並行して取得され、重複するPOIはIDに基づいて統合されます
 * - ネットワークエラーが発生した場合、最大3回のリトライを行います
 * - WKT形式の座標データは緯度・経度オブジェクトに変換され、範囲外の座標は除外されます
 */

/**
 * APIからのデータ取得エラーを表すインターフェース
 */
interface FetchError {
  message: string;
  code: string;
}

/**
 * API接続に関する設定
 */
const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
} as const;

/**
 * 指定されたミリ秒だけ処理を遅延させる関数
 * @param {number} ms - 遅延時間（ミリ秒）
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * エラーを処理し、適切なエラーメッセージを生成する関数
 * @param {unknown} error - 発生したエラー
 * @param {number} retryCount - 現在のリトライ回数
 * @returns {FetchError} フォーマット済みエラーオブジェクト
 */
const handleError = (error: unknown, retryCount: number): FetchError => {
  console.error(error);
  if (retryCount < API_CONFIG.MAX_RETRIES) {
    return { message: ERROR_MESSAGES.DATA.FETCH_FAILED, code: 'FETCH_ERROR' };
  }
  return {
    message: 'データの取得に失敗しました。インターネット接続を確認し、再試行してください。',
    code: 'FETCH_ERROR',
  };
};

/**
 * WKT形式の座標文字列を解析し、緯度・経度オブジェクトに変換する関数
 * @param {string} wkt - WKT形式の座標文字列（例: 'POINT(138.3 38.2)'）
 * @returns {Object|null} 緯度・経度オブジェクトまたは無効な場合はnull
 */
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
  // POIデータを管理する状態
  const [pois, setPois] = useState<Poi[]>([]);
  // データ読み込み中の状態
  const [isLoading, setIsLoading] = useState(false);
  // エラー情報の状態
  const [error, setError] = useState<FetchError | null>(null);
  // データの取得が完了したかどうかの状態
  const [isFetched, setIsFetched] = useState(false);
  // データが正常にロードされたかどうかの状態
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * 指定されたエリアのデータをGoogle Sheetsから取得する関数
   * @param {AreaType} area - 取得対象のエリアタイプ
   * @param {number} retryCount - 現在のリトライ回数
   * @returns {Promise<Poi[]>} 取得したPOIデータの配列
   */
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
  }, []);

  /**
   * 全エリアのPOIデータを取得する関数
   * 各エリアのデータを並行して取得し、結果を統合します
   */
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

      // IDに基づいてPOIデータを統合し、重複を排除
      const poisMap = new Map(normalPoisArrays.flat().map((poi) => [poi.id, poi]));
      recommendPois.forEach((poi) => poisMap.set(poi.id, poi));

      setPois(Array.from(poisMap.values()));
      setIsFetched(true);
      setIsLoaded(true); // データフェッチ完了後に isLoaded を true に設定
    } catch (err) {
      setError(handleError(err, API_CONFIG.MAX_RETRIES));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isFetched, fetchAreaData]);

  // コンポーネントのマウント時またはisFetched状態変更時に自動的にデータを取得
  useEffect(() => {
    if (!isFetched) {
      fetchData();
    }
  }, [fetchData, isFetched]);

  /**
   * データを再取得するための関数
   * エラーをクリアし、フェッチフラグをリセットして新たにデータ取得を開始します
   */
  const refetch = useCallback(() => {
    setIsFetched(false);
    setError(null);
  }, []);

  return { pois, isLoading, isLoaded, error, refetch };
}
