import { useState, useEffect, useCallback } from 'react'; // Reactのフックをインポート
import { CONFIG } from '../utils/config'; // 設定をインポート
import type { Poi, AreaType } from '../utils/types'; // 型定義をインポート
import { AREAS, ERROR_MESSAGES } from '../utils/constants'; // 定数をインポート

type LatLngLiteral = google.maps.LatLngLiteral; // Google MapsのLatLngLiteral型をエイリアスとして定義

interface FetchError {
  message: string; // エラーメッセージ
  code: string; // エラーコード
}

const API_CONFIG = {
  MAX_RETRIES: 3, // 最大リトライ回数
  RETRY_DELAY: 1000, // リトライ間隔（ミリ秒）
  BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets', // APIのベースURL
} as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)); // 指定した時間だけ待機する関数

export function useSheetData() {
  const [pois, setPois] = useState<Poi[]>([]); // POIのリストを管理するローカルステート
  const [isLoading, setIsLoading] = useState(false); // ローディング状態を管理するローカルステート
  const [error, setError] = useState<FetchError | null>(null); // エラー状態を管理するローカルステート
  const [isFetched, setIsFetched] = useState(false); // データがフェッチされたかどうかを管理するローカルステート

  const validateConfig = () => {
    if (!CONFIG.sheets.spreadsheetId || !CONFIG.sheets.apiKey) {
      throw new Error(ERROR_MESSAGES.CONFIG.MISSING); // 設定が不足している場合はエラーをスロー
    }
  };

  const fetchAreaData = useCallback(
    async (area: string, retryCount = 0): Promise<Poi[]> => {
      const areaName = AREAS[area as AreaType]; // エリア名を取得
      const url = `${API_CONFIG.BASE_URL}/${CONFIG.sheets.spreadsheetId}/values/${area === 'RECOMMEND' ? 'おすすめ' : areaName}!A:AY?key=${CONFIG.sheets.apiKey}`;

      try {
        const response = await fetch(url); // データをフェッチ
        if (!response.ok) {
          if (response.status === 429 && retryCount < API_CONFIG.MAX_RETRIES) {
            await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1)); // リトライ間隔を待機
            return fetchAreaData(area, retryCount + 1); // リトライ
          }
          throw new Error(`HTTP error! status: ${response.status}`); // HTTPエラーの場合はエラーをスロー
        }
        const data = await response.json(); // レスポンスをJSONとしてパース

        return (data.values?.slice(1) || [])
          .filter((row: string[]) => row[49] && row[43]) // 必要なデータが存在する行をフィルタ
          .map(
            (row: string[]): Poi => ({
              id: String(row[49]), // IDを設定
              name: String(row[43]), // 名前を設定
              area: area as AreaType, // エリアを設定
              location: {
                lat: Number(row[47]), // 緯度を設定
                lng: Number(row[46]), // 経度を設定
              } as LatLngLiteral,
              category: row[26], // カテゴリを設定
              genre: row[27], // ジャンルを設定
              description: row[36], // 説明を設定
              reservation: row[37], // 予約情報を設定
              payment: row[38], // 支払い情報を設定
              phone: row[39], // 電話番号を設定
              address: row[40], // 住所を設定
              information: row[41], // 関連情報を設定
              view: row[42], // ビュー情報を設定
              monday: row[28], // 月曜日の営業時間を設定
              tuesday: row[29], // 火曜日の営業時間を設定
              wednesday: row[30], // 水曜日の営業時間を設定
              thursday: row[31], // 木曜日の営業時間を設定
              friday: row[32], // 金曜日の営業時間を設定
              saturday: row[33], // 土曜日の営業時間を設定
              sunday: row[34], // 日曜日の営業時間を設定
              holiday: row[35], // 祝祭日の営業時間を設定
            }),
          );
      } catch (err) {
        console.error(err); // エラーをコンソールに出力
        if (retryCount < API_CONFIG.MAX_RETRIES) {
          await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1)); // リトライ間隔を待機
          return fetchAreaData(area, retryCount + 1); // リトライ
        }
        throw new Error(ERROR_MESSAGES.DATA.FETCH_FAILED); // 最大リトライ回数を超えた場合はエラーをスロー
      }
    },
    [],
  );

  const fetchData = useCallback(async () => {
    if (isLoading || isFetched) return; // ローディング中または既にフェッチ済みの場合は何もしない

    setIsLoading(true); // ローディング状態を設定
    setError(null); // エラー状態をリセット

    try {
      validateConfig(); // 設定を検証
      const normalAreas = Object.keys(AREAS).filter(
        (area) => area !== 'RECOMMEND' && area !== 'CURRENT_LOCATION',
      ); // 通常のエリアをフィルタ
      const normalPoisArrays = await Promise.all(
        normalAreas.map((area) => fetchAreaData(area)),
      ); // 通常のエリアのデータをフェッチ
      const recommendPois = await fetchAreaData('RECOMMEND'); // 推奨エリアのデータをフェッチ

      const poisMap = new Map(
        normalPoisArrays.flat().map((poi) => [poi.id, poi]),
      ); // POIをマップに変換
      recommendPois.forEach((poi) => poisMap.set(poi.id, poi)); // 推奨エリアのPOIをマップに追加

      setPois(Array.from(poisMap.values())); // POIのリストを設定
      setIsFetched(true); // フェッチ済み状態を設定
    } catch (err) {
      console.error(err); // エラーをコンソールに出力
      setError({
        message:
          err instanceof Error
            ? err.message
            : 'データの取得に失敗しました。インターネット接続を確認し、再試行してください。',
        code: 'FETCH_ERROR',
      }); // エラー状態を設定
    } finally {
      setIsLoading(false); // ローディング状態を解除
    }
  }, [isLoading, isFetched, fetchAreaData]);

  useEffect(() => {
    if (!isFetched) {
      fetchData(); // データをフェッチ
    }
  }, [fetchData, isFetched]);

  // idの重複をチェック
  useEffect(() => {
    const checkForDuplicateIds = (pois: Poi[]) => {
      const ids = pois.map((poi) => poi.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.error('Duplicate IDs found in POIs:', ids);
      }
    };

    checkForDuplicateIds(pois); // idの重複をチェック
  }, [pois]);

  const refetch = useCallback(() => {
    setIsFetched(false); // フェッチ済み状態をリセット
    setError(null); // エラー状態をリセット
  }, []);

  return { pois, isLoading, error, refetch }; // フックの戻り値を設定
}
