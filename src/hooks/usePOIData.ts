import { useState, useEffect, useCallback } from 'react';

import { POI, PointOfInterest } from '@/types/poi';
import { parseCSVtoPOIs, combinePOIArrays } from '@/utils/csvProcessor';
import { ENV } from '@/utils/env';
import { fetchPOIsFromSheet } from '@/utils/googleSheets';
import { logger, LogLevel } from '@/utils/logger';

interface UsePOIDataOptions {
  enabled?: boolean;
}

/**
 * Google Sheetsからデータを取得する関数
 */
async function fetchDataFromGoogleSheets(logContext: Record<string, unknown>): Promise<POI[]> {
  logger.info('Google Sheetsからデータを取得しています', logContext);

  const [restaurants, parking, toilets] = await logger.measureTimeAsync(
    'Google Sheetsからのデータ取得',
    () =>
      Promise.all([
        fetchPOIsFromSheet('restaurant', 'レストラン!A1:Z1000'),
        fetchPOIsFromSheet('parking', '駐車場!A1:Z1000'),
        fetchPOIsFromSheet('toilet', 'トイレ!A1:Z1000'),
      ]),
    LogLevel.INFO,
    logContext
  );

  // データの結合を計測
  return logger.measureTime(
    'POIデータの結合処理',
    () => combinePOIArrays(restaurants, parking, toilets),
    LogLevel.DEBUG,
    {
      ...logContext,
      counts: {
        restaurants: restaurants.length,
        parking: parking.length,
        toilets: toilets.length,
      },
    }
  );
}

/**
 * CSVファイルからデータを取得する関数
 */
async function fetchDataFromCSVFiles(logContext: Record<string, unknown>): Promise<POI[]> {
  logger.info('静的CSVファイルからデータを取得しています', logContext);

  // 実際のファイル名に合わせてパスを修正
  const restaurantCSVUrls = [
    '/data/まとめータベース - おすすめ.csv',
    '/data/まとめータベース - 両津・相川地区.csv',
    '/data/まとめータベース - 金井・佐和田・新穂・畑野・真野地区.csv',
    '/data/まとめータベース - 赤泊・羽茂・小木地区.csv',
    '/data/まとめータベース - スナック.csv',
  ];
  const parkingCSVUrl = '/data/まとめータベース - 駐車場.csv';
  const toiletCSVUrl = '/data/まとめータベース - 公共トイレ.csv';

  try {
    // レストランデータの取得（複数ファイルから）
    logger.info('レストランデータを複数ファイルから読み込んでいます', {
      ...logContext,
      files: restaurantCSVUrls,
    });

    // 各CSVファイルを取得して結合
    const restaurantResponses = await logger.measureTimeAsync(
      'レストランCSVファイルのフェッチ',
      () => Promise.all(restaurantCSVUrls.map(url => fetch(url))),
      LogLevel.INFO,
      { ...logContext, urls: restaurantCSVUrls }
    );

    // レスポンスの確認
    const failedRestaurantUrls = restaurantResponses
      .map((res, idx) => (!res.ok ? restaurantCSVUrls[idx] : null))
      .filter(Boolean);

    if (failedRestaurantUrls.length > 0) {
      logger.warn('一部のレストランCSVファイルの取得に失敗しました', {
        ...logContext,
        failedUrls: failedRestaurantUrls,
      });
    }

    // テキストに変換
    const restaurantCSVs = await logger.measureTimeAsync(
      'レストランレスポンスのテキスト変換',
      () => Promise.all(restaurantResponses.filter(res => res.ok).map(res => res.text())),
      LogLevel.DEBUG,
      logContext
    );

    // 駐車場とトイレのデータ取得
    const [parkingResponse, toiletsResponse] = await logger.measureTimeAsync(
      '駐車場・トイレCSVファイルのフェッチ',
      () => Promise.all([fetch(parkingCSVUrl), fetch(toiletCSVUrl)]),
      LogLevel.INFO,
      { ...logContext, urls: [parkingCSVUrl, toiletCSVUrl] }
    );

    // レスポンスチェック
    if (!parkingResponse.ok || !toiletsResponse.ok) {
      const failedUrls = [
        !parkingResponse.ok ? parkingCSVUrl : null,
        !toiletsResponse.ok ? toiletCSVUrl : null,
      ].filter(Boolean);

      throw new Error(`CSVファイルの取得に失敗しました: ${failedUrls.join(', ')}`);
    }

    // テキストデータへの変換
    const [parkingCSV, toiletsCSV] = await logger.measureTimeAsync(
      '駐車場・トイレレスポンスのテキスト変換',
      () => Promise.all([parkingResponse.text(), toiletsResponse.text()]),
      LogLevel.DEBUG,
      logContext
    );

    return processMultipleCSVData(restaurantCSVs, parkingCSV, toiletsCSV, logContext);
  } catch (error) {
    logger.error('CSVデータ取得中にエラーが発生しました', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * 複数のCSVデータを処理してPOIオブジェクトに変換する関数
 */
function processMultipleCSVData(
  restaurantCSVs: string[],
  parkingCSV: string,
  toiletsCSV: string,
  logContext: Record<string, unknown>
): POI[] {
  // レストランCSVを個別に解析し、結果を結合
  const allRestaurants = restaurantCSVs.reduce<POI[]>((acc, csv, index) => {
    const sourceInfo = { ...logContext, csvIndex: index };
    const pois = logger.measureTime(
      `レストランCSV解析 (ファイル ${index + 1}/${restaurantCSVs.length})`,
      () => parseCSVtoPOIs(csv, 'restaurant'),
      LogLevel.DEBUG,
      sourceInfo
    );
    logger.info(`レストランデータ解析完了 (ファイル ${index + 1})`, {
      ...sourceInfo,
      count: pois.length,
    });
    return [...acc, ...pois];
  }, []);

  // 駐車場データの解析
  const parking = logger.measureTime(
    '駐車場CSV解析',
    () => parseCSVtoPOIs(parkingCSV, 'parking'),
    LogLevel.DEBUG,
    logContext
  );

  // トイレデータの解析
  const toilets = logger.measureTime(
    'トイレCSV解析',
    () => parseCSVtoPOIs(toiletsCSV, 'toilet'),
    LogLevel.DEBUG,
    logContext
  );

  // 全POIデータの結合（パフォーマンス計測）
  return logger.measureTime(
    'POIデータの結合処理',
    () => combinePOIArrays(allRestaurants, parking, toilets),
    LogLevel.DEBUG,
    {
      ...logContext,
      counts: {
        restaurants: allRestaurants.length,
        parking: parking.length,
        toilets: toilets.length,
      },
    }
  );
}

/**
 * POI（Points of Interest）データを取得・管理するカスタムフック
 * データソースに応じて適切な方法でデータを取得し、加工して返します
 */
export function usePOIData(options: UsePOIDataOptions = {}) {
  const { enabled = true } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);

  // データ取得ロジックをuseCallbackでメモ化
  const fetchPOIData = useCallback(async () => {
    // コンポーネント名をコンテキストに含める
    const logContext = { component: 'usePOIData' };

    logger.info('POIデータの取得を開始', logContext);

    try {
      setIsLoading(true);

      // 環境変数の確認
      const useSheets = ENV.app.USE_GOOGLE_SHEETS;
      logger.debug('データソース設定', { ...logContext, useGoogleSheets: useSheets });

      // データソースに応じて取得方法を切り替え
      const allPOIs = useSheets
        ? await fetchDataFromGoogleSheets(logContext)
        : await fetchDataFromCSVFiles(logContext);

      // POI型からPointOfInterest型に変換（パフォーマンス計測）
      const pointsOfInterest = logger.measureTime(
        'POI型からPointOfInterest型への変換',
        () =>
          allPOIs.map(
            poi =>
              ({
                id: poi.id,
                name: poi.name,
                lat: poi.position.lat,
                lng: poi.position.lng,
                isClosed: poi.isClosed,
                type: poi.type,
                category: poi.category,
                genre: poi.genre,
                address: poi.address,
                district: poi.district,
                問い合わせ: poi.contact,
                関連情報: poi.infoUrl,
                'Google マップで見る': poi.googleMapsUrl,
                営業時間: poi.businessHours,
                searchText: poi.searchText,
                // 定休日情報があれば変換
                ...(poi.regularHolidays && {
                  月曜定休日: poi.regularHolidays.monday,
                  火曜定休日: poi.regularHolidays.tuesday,
                  水曜定休日: poi.regularHolidays.wednesday,
                  木曜定休日: poi.regularHolidays.thursday,
                  金曜定休日: poi.regularHolidays.friday,
                  土曜定休日: poi.regularHolidays.saturday,
                  日曜定休日: poi.regularHolidays.sunday,
                  祝祭定休日: poi.regularHolidays.holiday,
                }),
                定休日について: poi.holidayNotes,
              }) as PointOfInterest
          ),
        LogLevel.DEBUG,
        { ...logContext, count: allPOIs.length }
      );

      logger.info('POIデータの取得と処理が完了しました', {
        ...logContext,
        totalCount: pointsOfInterest.length,
        categories: countCategories(pointsOfInterest),
      });

      setPois(pointsOfInterest);
      setError(null);
    } catch (err) {
      handleFetchError(err, logContext, setError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      logger.debug('POIデータ取得は無効化されています', { component: 'usePOIData', enabled });
      return;
    }

    // 非同期関数を即時実行し、クリーンアップ時にはキャンセルできるようにする
    void fetchPOIData();

    // クリーンアップ関数
    return () => {
      logger.debug('usePOIData のクリーンアップを実行', { component: 'usePOIData' });
      // 必要に応じてクリーンアップロジックを実装
    };
  }, [enabled, fetchPOIData]);

  return { pois, isLoading, error };
}

/**
 * エラー処理を行う関数
 */
function handleFetchError(
  err: unknown,
  logContext: Record<string, unknown>,
  setError: (error: string | null) => void
): void {
  // 構造化されたエラーログ
  logger.error(
    'POIデータ取得中にエラーが発生しました',
    err instanceof Error ? err : new Error(String(err))
  );

  // エラーログをユーザーフレンドリーなエラーメッセージに置き換え
  setError('データの読み込みに失敗しました。ネットワーク接続を確認してください。');

  // フォールバックデータがあれば使用できるようにログを残す
  logger.warn('データ取得に失敗したため、フォールバックが必要かもしれません', {
    ...logContext,
    errorType: err instanceof Error ? err.name : 'UnknownError',
  });
}

/**
 * POIのカテゴリ別件数を集計するヘルパー関数
 */
function countCategories(pois: PointOfInterest[]): Record<string, number> {
  return pois.reduce<Record<string, number>>((acc, poi) => {
    const category = poi.category ?? 'unknown';
    acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, {});
}
