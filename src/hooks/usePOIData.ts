import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import type { POI, PointOfInterest } from '@/types/poi';
import { parseCSVtoPOIs, combinePOIArrays } from '@/utils/csvProcessor';
import { getEnv, toBool } from '@/utils/env'; // ENVを削除しtoBoolを追加
import { fetchPOIsFromSheet } from '@/utils/googleSheets';
import { logger, LogLevel } from '@/utils/logger'; // loggerをインポート

// コンポーネント名を定数として定義（ロギング用）
const COMPONENT_NAME = 'usePOIData';

// CSVファイルパスを定数として外部化
const CSV_FILES = {
  restaurants: [
    '/data/まとめータベース - おすすめ.csv',
    '/data/まとめータベース - 両津・相川地区.csv',
    '/data/まとめータベース - 金井・佐和田・新穂・畑野・真野地区.csv',
    '/data/まとめータベース - 赤泊・羽茂・小木地区.csv',
    '/data/まとめータベース - スナック.csv',
  ],
  utilities: ['/data/まとめータベース - 駐車場.csv', '/data/まとめータベース - 公共トイレ.csv'],
};

// 環境変数キー定数（ガイドライン準拠）
const ENV_KEYS = {
  USE_GOOGLE_SHEETS: 'VITE_USE_GOOGLE_SHEETS', // VITEプレフィックス付き
  ENABLE_OFFLINE_MODE: 'VITE_ENABLE_OFFLINE_MODE', // オフラインモード有効化フラグ
  CACHE_TTL: 'VITE_DATA_CACHE_TTL', // キャッシュの有効期間（分）
};

// ストレージキー定数
const STORAGE_KEYS = {
  POI_DATA: 'kueccha_poi_data_cache',
  POI_DATA_TIMESTAMP: 'kueccha_poi_data_timestamp',
};

interface UsePOIDataOptions {
  enabled?: boolean;
  /**
   * キャッシュを使用するかどうか
   * @default true
   */
  useCache?: boolean;
  /**
   * キャッシュの有効期間（分）
   * 環境変数VITE_DATA_CACHE_TTLが設定されている場合はそちらが優先されます
   * @default 60
   */
  cacheTtlMinutes?: number;
}

/**
 * LocalStorageにデータをキャッシュする機能
 */
function cachePOIData(data: PointOfInterest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POI_DATA, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.POI_DATA_TIMESTAMP, Date.now().toString());
    logger.debug('POIデータをLocalStorageにキャッシュしました', {
      component: COMPONENT_NAME,
      count: data.length,
    });
  } catch (err) {
    // ストレージクォータ超過などのエラーを処理
    logger.warn('POIデータのキャッシュに失敗しました', {
      component: COMPONENT_NAME,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * LocalStorageからキャッシュデータを取得する機能
 * @param ttlMinutes キャッシュの有効期間（分）
 */
function getFromCache(ttlMinutes: number): PointOfInterest[] | null {
  try {
    const timestampStr = localStorage.getItem(STORAGE_KEYS.POI_DATA_TIMESTAMP);
    if (!timestampStr) return null;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const maxAge = ttlMinutes * 60 * 1000; // ミリ秒に変換

    // キャッシュが古くなっている場合
    if (now - timestamp > maxAge) {
      logger.debug('POIデータのキャッシュが期限切れです', {
        component: COMPONENT_NAME,
        cacheAge: Math.floor((now - timestamp) / 60000), // 分に変換
        ttlMinutes,
      });
      return null;
    }

    const cachedData = localStorage.getItem(STORAGE_KEYS.POI_DATA);
    if (!cachedData) return null;

    const parsedData = JSON.parse(cachedData) as PointOfInterest[];

    logger.info('POIデータをキャッシュから読み込みました', {
      component: COMPONENT_NAME,
      count: parsedData.length,
      cacheAge: Math.floor((now - timestamp) / 60000), // 分に変換
    });

    return parsedData;
  } catch (err) {
    logger.warn('キャッシュからのPOIデータ読み込みに失敗しました', {
      component: COMPONENT_NAME,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
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
async function fetchDataFromCSVFiles(
  logContext: Record<string, unknown>,
  restaurantCSVUrls: string[],
  utilityCSVUrls: string[]
): Promise<POI[]> {
  logger.info('静的CSVファイルからデータを取得しています', logContext);

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
      () =>
        Promise.all([
          fetch(utilityCSVUrls[0] ?? ''), // 空の文字列をデフォルト値として提供
          fetch(utilityCSVUrls[1] ?? ''), // 型エラーを解決
        ]),
      LogLevel.INFO,
      { ...logContext, urls: utilityCSVUrls }
    );

    // レスポンスチェック
    if (!parkingResponse.ok || !toiletsResponse.ok) {
      const failedUrls = [
        !parkingResponse.ok ? utilityCSVUrls[0] : null,
        !toiletsResponse.ok ? utilityCSVUrls[1] : null,
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
 * POI型からPointOfInterest型に変換する関数
 */
function convertPOIsToPointsOfInterest(
  pois: POI[],
  logContext: Record<string, unknown>
): PointOfInterest[] {
  return logger.measureTime(
    'POI型からPointOfInterest型への変換',
    () =>
      pois.map(
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
    { ...logContext, count: pois.length }
  );
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

/**
 * POI（Points of Interest）データを取得・管理するカスタムフック
 * データソースに応じて適切な方法でデータを取得し、加工して返します
 */
export function usePOIData(options: UsePOIDataOptions = {}) {
  const { enabled = true, useCache = true, cacheTtlMinutes } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [isOfflineData, setIsOfflineData] = useState(false);

  // データ重複取得防止用のフラグ
  const dataFetchedRef = useRef(false);

  // オフラインモードフラグの取得（環境変数から）
  const offlineModeEnabled = useMemo(
    () => toBool(getEnv(ENV_KEYS.ENABLE_OFFLINE_MODE, { defaultValue: 'false' })),
    []
  );

  // キャッシュTTLの取得（環境変数またはオプションから）
  const cacheTTL = useMemo(() => {
    const envTTL = getEnv(ENV_KEYS.CACHE_TTL, { defaultValue: '60' });
    const ttlMinutes = parseInt(envTTL, 10);
    return isNaN(ttlMinutes) ? cacheTtlMinutes || 60 : ttlMinutes;
  }, [cacheTtlMinutes]);

  // ファイルリストのメモ化
  const restaurantCSVUrls = useMemo(() => CSV_FILES.restaurants, []);
  const utilityCSVUrls = useMemo(() => CSV_FILES.utilities, []);

  // データ取得ロジックをuseCallbackでメモ化
  const fetchPOIData = useCallback(async () => {
    // 既に取得済みの場合は処理をスキップ
    if (dataFetchedRef.current) {
      logger.debug('POIデータは既に取得済みのため、再取得をスキップします', {
        component: COMPONENT_NAME,
      });
      return;
    }

    // コンポーネント名をコンテキストに含める
    const logContext = { component: COMPONENT_NAME };

    // キャッシュが有効な場合、キャッシュから読み込む
    if (useCache) {
      const cachedData = getFromCache(cacheTTL);
      if (cachedData && cachedData.length > 0) {
        setPois(cachedData);
        setIsLoading(false);
        setIsOfflineData(true);
        dataFetchedRef.current = true;
        return;
      }
    }

    logger.info('POIデータの取得を開始', {
      ...logContext,
      useCache,
      cacheTTL,
      offlineModeEnabled,
    });

    try {
      setIsLoading(true);

      // 環境変数の確認
      const useSheets = toBool(getEnv(ENV_KEYS.USE_GOOGLE_SHEETS, { defaultValue: 'false' }));

      logger.debug('データソース設定', {
        ...logContext,
        useGoogleSheets: useSheets,
      });

      // データソースに応じて取得方法を切り替え
      const allPOIs = useSheets
        ? await fetchDataFromGoogleSheets(logContext)
        : await fetchDataFromCSVFiles(logContext, restaurantCSVUrls, utilityCSVUrls);

      // POIデータを変換
      const pointsOfInterest = convertPOIsToPointsOfInterest(allPOIs, logContext);

      logger.info('POIデータの取得と処理が完了しました', {
        ...logContext,
        totalCount: pointsOfInterest.length,
        categories: countCategories(pointsOfInterest),
      });

      setPois(pointsOfInterest);
      setError(null);
      setIsOfflineData(false);

      // キャッシュが有効な場合、データをキャッシュする
      if (useCache) {
        cachePOIData(pointsOfInterest);
      }

      // データ取得完了をマーク
      dataFetchedRef.current = true;
    } catch (err) {
      // オフラインモードが有効な場合、キャッシュから読み込む（TTL無視）
      if (offlineModeEnabled && useCache) {
        try {
          const cachedData = localStorage.getItem(STORAGE_KEYS.POI_DATA);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData) as PointOfInterest[];
            logger.info('オフラインモード: キャッシュからPOIデータを使用します', {
              ...logContext,
              count: parsedData.length,
            });
            setPois(parsedData);
            setError(null);
            setIsOfflineData(true);
            dataFetchedRef.current = true;
            setIsLoading(false);
            return;
          }
        } catch (cacheErr) {
          logger.warn('オフラインモード: キャッシュの読み込みに失敗しました', {
            ...logContext,
            error: cacheErr instanceof Error ? cacheErr.message : String(cacheErr),
          });
        }
      }

      // エラー処理
      handleFetchError(err, logContext, setError);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantCSVUrls, utilityCSVUrls, useCache, cacheTTL, offlineModeEnabled]);

  useEffect(() => {
    if (!enabled) {
      logger.debug('POIデータ取得は無効化されています', { component: COMPONENT_NAME, enabled });
      return;
    }

    // 既にデータ取得済みの場合はスキップ
    if (dataFetchedRef.current) {
      logger.debug('POIデータは既に取得済みです', { component: COMPONENT_NAME });
      return;
    }

    // 非同期関数を即時実行し、クリーンアップ時にはキャンセルできるようにする
    void fetchPOIData();

    // ネットワーク状態の変化を監視
    const handleOnline = () => {
      logger.info('ネットワーク接続が復元されました', { component: COMPONENT_NAME });
      // オフラインデータを使用していた場合は再取得
      if (isOfflineData && !dataFetchedRef.current) {
        void fetchPOIData();
      }
    };

    window.addEventListener('online', handleOnline);

    // クリーンアップ関数
    return () => {
      window.removeEventListener('online', handleOnline);
      logger.debug('usePOIData のクリーンアップを実行', { component: COMPONENT_NAME });
    };
  }, [enabled, fetchPOIData, isOfflineData]);

  return {
    pois,
    isLoading,
    error,
    isOfflineData,
    refresh: () => {
      dataFetchedRef.current = false;
      void fetchPOIData();
    },
  };
}
