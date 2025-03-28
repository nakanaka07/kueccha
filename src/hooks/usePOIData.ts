import { useState, useEffect, useCallback } from 'react';

import { POI, convertPOIToPointOfInterest, PointOfInterest } from '@/types/poi';
import { parseCSVtoPOIs, combinePOIArrays } from '@/utils/csvProcessor';
import { ENV } from '@/utils/env';
import { fetchPOIsFromSheet } from '@/utils/googleSheets';

interface UsePOIDataOptions {
  enabled?: boolean;
}

export function usePOIData(options: UsePOIDataOptions = {}) {
  const { enabled = true } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);

  // データ取得ロジックをuseCallbackでメモ化
  const fetchPOIData = useCallback(async () => {
    try {
      setIsLoading(true);

      let allPOIs: POI[] = [];

      // 環境変数の確認
      const useSheets = ENV.app.USE_GOOGLE_SHEETS;

      if (useSheets) {
        // Google Sheetsからデータを取得
        const [restaurants, parking, toilets] = await Promise.all([
          fetchPOIsFromSheet('restaurant', 'レストラン!A1:Z1000'),
          fetchPOIsFromSheet('parking', '駐車場!A1:Z1000'),
          fetchPOIsFromSheet('toilet', 'トイレ!A1:Z1000'),
        ]);

        allPOIs = combinePOIArrays(restaurants, parking, toilets);
      } else {
        // 静的CSVファイルからデータを取得
        const restaurantCSVUrl = '/data/restaurants.csv';
        const parkingCSVUrl = '/data/parking.csv';
        const toiletCSVUrl = '/data/toilets.csv';

        // 各CSVファイルの取得
        const [restaurantsResponse, parkingResponse, toiletsResponse] = await Promise.all([
          fetch(restaurantCSVUrl),
          fetch(parkingCSVUrl),
          fetch(toiletCSVUrl),
        ]);

        // レスポンスチェック
        if (!restaurantsResponse.ok || !parkingResponse.ok || !toiletsResponse.ok) {
          throw new Error('POIデータの取得に失敗しました');
        }

        // テキストデータへの変換
        const [restaurantsCSV, parkingCSV, toiletsCSV] = await Promise.all([
          restaurantsResponse.text(),
          parkingResponse.text(),
          toiletsResponse.text(),
        ]);

        // CSVの解析とPOIオブジェクトへの変換
        const restaurants = parseCSVtoPOIs(restaurantsCSV, 'restaurant');
        const parking = parseCSVtoPOIs(parkingCSV, 'parking');
        const toilets = parseCSVtoPOIs(toiletsCSV, 'toilet');

        // 全POIデータの結合
        allPOIs = combinePOIArrays(restaurants, parking, toilets);
      }

      // POI型からPointOfInterest型に変換
      const pointsOfInterest = allPOIs.map(convertPOIToPointOfInterest);

      setPois(pointsOfInterest);
      setError(null);
    } catch (err) {
      // エラーログをユーザーフレンドリーなエラーメッセージに置き換え
      setError('データの読み込みに失敗しました。ネットワーク接続を確認してください。');

      // 開発環境でのみエラー詳細を表示（production環境では出力しない）
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('POIデータ取得エラー:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // 非同期関数を即時実行し、クリーンアップ時にはキャンセルできるようにする
    const fetchData = async () => {
      await fetchPOIData();
    };

    void fetchData();

    // クリーンアップ関数は必要に応じて追加
    return () => {
      // 必要に応じてクリーンアップロジックを実装
    };
  }, [enabled, fetchPOIData]);

  return { pois, isLoading, error };
}
