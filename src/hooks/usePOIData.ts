import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import type { POI } from '@/types/poi';
import { parseCSVtoPOIs, combinePOIArrays } from '@/utils/csvProcessor';
import { ENV } from '@/utils/env';
import { fetchPOIsFromSheet } from '@/utils/googleSheets';
import { logger, LogLevel } from '@/utils/logger';

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

// ストレージキー定数
const STORAGE_KEYS = {
  POI_DATA: 'kueccha_poi_data_cache',
  POI_DATA_TIMESTAMP: 'kueccha_poi_data_timestamp',
} as const;

// 型定義を改善
type StorageKeys = typeof STORAGE_KEYS;
type StorageKeyName = keyof StorageKeys;

// ストレージキー値を取得する関数（型安全性向上）
function getStorageKey(key: StorageKeyName): string {
  return STORAGE_KEYS[key];
}

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
 * ログコンテキストの標準フィールド型定義
 */
interface StandardLogContext {
  component: string; // コンポーネント名
  action: string; // 実行中の操作
  timestamp: string; // タイムスタンプ
  [key: string]: unknown; // その他の任意フィールド
}

/**
 * 標準化されたロギングコンテキストを生成する関数
 * @param additionalContext - 追加のコンテキスト情報
 * @returns 統一されたログコンテキスト
 */
function createLogContext(additionalContext: Partial<StandardLogContext> = {}): StandardLogContext {
  return {
    component: COMPONENT_NAME,
    action: additionalContext.action ?? 'unknown',
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * 環境設定を一元管理して取得する関数
 * @param options - 環境設定オプション
 * @returns 環境設定オブジェクト
 */
function getEnvironmentConfig(options: { cacheTtlMinutes?: number | undefined } = {}): {
  useGoogleSheets: boolean;
  offlineMode: boolean;
  cacheTTL: number;
  debugMode: boolean;
  logLevel: string;
} {
  const useGoogleSheets = ENV.features.googleSheets;
  const offlineMode = ENV.features.offlineMode;
  const debugMode = ENV.env.debug;

  // キャッシュTTLの決定ロジックを簡略化
  const envTTL = ENV.env.isDev ? 5 : 60; // 開発環境では短い時間を使用
  const cacheTTL = options.cacheTtlMinutes ?? envTTL;

  return {
    useGoogleSheets,
    offlineMode,
    cacheTTL,
    debugMode,
    logLevel: ENV.logging.level,
  };
}

/**
 * 現在の設定に基づいてログレベルを取得する
 * @param defaultLevel - デフォルトのログレベル
 * @param envConfig - 環境設定
 * @returns ログレベル
 */
function getAppropriateLogLevel(
  defaultLevel: LogLevel,
  envConfig: ReturnType<typeof getEnvironmentConfig>
): LogLevel {
  // デバッグモードの場合はより詳細なログレベル
  if (envConfig.debugMode && defaultLevel > LogLevel.DEBUG) {
    return LogLevel.DEBUG;
  }

  switch (envConfig.logLevel.toLowerCase()) {
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      return defaultLevel;
  }
}

/**
 * パフォーマンス測定とログ出力を行う関数
 * @param operation - 測定する処理の説明
 * @param fn - 測定する関数
 * @param context - ログコンテキスト
 * @param envConfig - 環境設定
 * @returns 関数の戻り値
 */
async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context: Partial<StandardLogContext>,
  envConfig: ReturnType<typeof getEnvironmentConfig>
): Promise<T> {
  const logLevel = getAppropriateLogLevel(LogLevel.INFO, envConfig);

  return logger.measureTimeAsync(
    operation,
    fn,
    logLevel,
    createLogContext({
      ...context,
      performanceMeasurement: true,
    })
  );
}

/**
 * キャッシュの有効性をチェックする関数
 * @param timestamp - キャッシュのタイムスタンプ
 * @param cacheTtl - キャッシュの有効期間（分）
 * @returns キャッシュが有効かどうか
 */
function isCacheValid(timestamp: string | null, cacheTtl: number): boolean {
  // nullの場合は無効として扱う
  if (timestamp === null) return false;

  const cachedTime = new Date(timestamp).getTime();
  const currentTime = new Date().getTime();
  const cacheTtlMs = cacheTtl * 60 * 1000; // 分からミリ秒に変換

  return currentTime - cachedTime < cacheTtlMs;
}

/**
 * POIデータのキャッシュを取得する関数
 * @returns キャッシュされたPOIデータとキャッシュが有効かどうかのフラグ
 */
function getCachedPOIData(cacheTtl: number): {
  cachedData: POI[] | null;
  isValid: boolean;
} {
  try {
    const cachedDataStr = localStorage.getItem(getStorageKey('POI_DATA'));
    const timestamp = localStorage.getItem(getStorageKey('POI_DATA_TIMESTAMP'));
    const isValid = isCacheValid(timestamp, cacheTtl);

    // データが存在し、かつ有効期限内である場合
    if (cachedDataStr !== null && isValid) {
      const cachedData = JSON.parse(cachedDataStr) as POI[];
      logger.debug(
        'キャッシュからPOIデータを取得しました',
        createLogContext({
          action: 'get_cached_data',
          count: cachedData.length,
          cacheAge:
            timestamp !== null
              ? `${Math.round((Date.now() - new Date(timestamp).getTime()) / 60000)}分`
              : 'unknown',
        })
      );
      return { cachedData, isValid: true };
    }

    return { cachedData: null, isValid: false };
  } catch (error) {
    logger.error(
      'キャッシュからのPOIデータ取得に失敗しました',
      createLogContext({ action: 'get_cached_data', error })
    );
    return { cachedData: null, isValid: false };
  }
}

/**
 * POIデータをキャッシュに保存する関数
 * @param data - 保存するPOIデータ
 */
function cachePOIData(data: POI[]): void {
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(getStorageKey('POI_DATA'), JSON.stringify(data));
    localStorage.setItem(getStorageKey('POI_DATA_TIMESTAMP'), timestamp);

    logger.debug(
      'POIデータをキャッシュに保存しました',
      createLogContext({
        action: 'cache_data',
        count: data.length,
        timestamp,
      })
    );
  } catch (error) {
    logger.warn(
      'POIデータのキャッシュ保存に失敗しました',
      createLogContext({ action: 'cache_data', error })
    );
  }
}

/**
 * CSVファイルからPOIデータを取得する関数
 * @returns POIデータの配列
 */
async function fetchPOIFromCSVFiles(): Promise<POI[]> {
  let allData: POI[] = [];

  const allFiles = [...CSV_FILES.restaurants, ...CSV_FILES.utilities];
  const startTime = performance.now();

  try {
    const results: POI[][] = await Promise.all(
      allFiles.map(async path => {
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
          }
          const text = await response.text();

          // パスからPOIのタイプを推測
          const poiType = path.includes('駐車場')
            ? 'parking'
            : path.includes('公共トイレ')
              ? 'toilet'
              : 'restaurant';

          return parseCSVtoPOIs(text, poiType);
        } catch (error) {
          logger.error(`${path}の読み込みに失敗しました`, createLogContext({ path, error }));
          return [];
        }
      })
    );

    // combinePOIArraysは可変長引数を受け取るため修正
    allData = combinePOIArrays(...results);

    const duration = performance.now() - startTime;
    logger.info(
      'CSVファイルからPOIデータを取得しました',
      createLogContext({
        action: 'fetch_csv',
        count: allData.length,
        durationMs: Math.round(duration),
        fileCount: allFiles.length,
      })
    );

    return allData;
  } catch (error) {
    logger.error(
      'CSVファイルからのPOIデータ取得に失敗しました',
      createLogContext({ action: 'fetch_csv', error })
    );
    return [];
  }
}

/**
 * POIデータをソースから取得する関数（Google SheetsかCSVファイル）
 * @param options - 取得オプション
 * @returns 取得したPOIデータ
 */
async function fetchPOIDataFromSource(options: {
  useGoogleSheets: boolean;
  envConfig: ReturnType<typeof getEnvironmentConfig>;
}): Promise<POI[]> {
  const { useGoogleSheets, envConfig } = options;
  const isOnline = navigator.onLine;

  try {
    // オフラインモードでネットワーク接続がない場合は早期に失敗
    if (envConfig.offlineMode && !isOnline) {
      logger.warn(
        'オフラインモードが有効で、ネットワーク接続がありません',
        createLogContext({
          action: 'network_check',
          offlineMode: envConfig.offlineMode,
          isOnline,
        })
      );
      throw new Error('オフラインモードが有効です');
    }

    let data: POI[] = [];

    if (useGoogleSheets) {
      logger.info(
        'Google SheetsからPOIデータを取得します',
        createLogContext({
          action: 'fetch_data_source',
          source: 'google_sheets',
          isOnline,
        })
      );

      data = await measurePerformance(
        'Google Sheetsからのデータ取得',
        () => fetchPOIsFromSheet('restaurant', 'レストラン!A1:Z1000'),
        { action: 'fetch_google_sheets' },
        envConfig
      );
    } else {
      logger.info(
        'CSVファイルからPOIデータを取得します',
        createLogContext({
          action: 'fetch_data_source',
          source: 'csv_files',
          isOnline,
        })
      );

      data = await measurePerformance(
        'CSVファイルからのデータ取得',
        fetchPOIFromCSVFiles,
        { action: 'fetch_csv_files' },
        envConfig
      );
    }

    if (!data.length) {
      throw new Error(
        `データソース(${useGoogleSheets ? 'Google Sheets' : 'CSV'})からデータを取得できませんでした`
      );
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      'POIデータの取得に失敗しました',
      createLogContext({
        action: 'fetch_data_source',
        source: useGoogleSheets ? 'google_sheets' : 'csv_files',
        isOnline,
        errorMessage,
        error,
      })
    );
    throw error; // 上位の呼び出し元でハンドリングするために再スロー
  }
}

/**
 * POIデータを取得する関数（キャッシュ処理を含む）
 * @param options - オプション（キャッシュ設定など）
 * @returns 取得したPOIデータ
 */
async function fetchPOIDataWithCache(options: {
  useCache: boolean;
  envConfig: ReturnType<typeof getEnvironmentConfig>;
}): Promise<POI[]> {
  const { useCache, envConfig } = options;
  const { cacheTTL, useGoogleSheets, offlineMode } = envConfig;

  // キャッシュを使用する場合はキャッシュから取得を試みる
  if (useCache) {
    const { cachedData, isValid } = getCachedPOIData(cacheTTL);

    // 有効なキャッシュがある場合はそれを返す
    if (cachedData && isValid) {
      logger.info(
        'キャッシュからPOIデータを使用します',
        createLogContext({
          action: 'use_cached_data',
          count: cachedData.length,
          cacheValid: true,
          source: 'cache',
        })
      );
      return cachedData;
    }

    // オフラインモードでキャッシュが期限切れの場合は、古いキャッシュでも使用
    if (offlineMode && cachedData !== null) {
      logger.warn(
        'オフラインモード: 期限切れのキャッシュを使用します',
        createLogContext({
          action: 'use_expired_cache',
          count: cachedData.length,
          cacheValid: false,
          offlineMode: true,
          source: 'expired_cache',
        })
      );
      return cachedData;
    }
  }

  // キャッシュが無効またはオフラインモードでない場合は、データソースから取得
  try {
    const data = await fetchPOIDataFromSource({
      useGoogleSheets,
      envConfig,
    });

    // データが取得できた場合はキャッシュを更新
    if (data.length > 0 && useCache) {
      cachePOIData(data);
    }

    return data;
  } catch (error) {
    logger.warn(
      'データ取得に失敗しました。フォールバック戦略を試行します',
      createLogContext({
        action: 'fallback_strategy_start',
        error,
      })
    );

    // エラー時に空のキャッシュがある場合は、それをフォールバックとして使用
    if (useCache) {
      const { cachedData } = getCachedPOIData(Infinity); // 期限を無視してキャッシュ取得

      if (cachedData && cachedData.length > 0) {
        logger.warn(
          'データ取得失敗: 期限切れのキャッシュにフォールバックします',
          createLogContext({
            action: 'fallback_to_expired_cache',
            count: cachedData.length,
            source: 'fallback_cache',
            error,
          })
        );
        return cachedData;
      }
    }

    // キャッシュもない場合は空配列を返す
    logger.error(
      'POIデータを取得できず、有効なキャッシュもありません',
      createLogContext({
        action: 'data_fetch_failure',
        fallbackAttempted: true,
        useCache,
        offlineMode,
        error,
      })
    );
    return [];
  }
}

/**
 * POIデータを取得・管理するためのカスタムフック
 * @param options - オプション設定（キャッシュ設定など）
 * @returns ロード状態とPOIデータ
 */
export function usePOIData(options: UsePOIDataOptions = {}) {
  // オプションのデフォルト値設定
  const { enabled = true, useCache = true, cacheTtlMinutes } = options;

  // 環境設定の取得（メモ化）
  const envConfig = useMemo(() => getEnvironmentConfig({ cacheTtlMinutes }), [cacheTtlMinutes]);

  // データの状態管理
  const [data, setData] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFirstLoad = useRef(true);

  // エラーハンドリングを統一化（メモ化）
  const handleError = useCallback((err: unknown, context: Partial<StandardLogContext> = {}) => {
    const fetchError = err instanceof Error ? err : new Error('不明なエラーが発生しました');
    setError(fetchError);
    logger.error(
      fetchError.message,
      createLogContext({
        ...context,
        error: err,
        errorName: fetchError.name,
        errorMessage: fetchError.message,
      })
    );
  }, []);

  // POIデータ更新処理（メモ化）
  const updatePOIData = useCallback(
    (fetchedData: POI[]) => {
      if (fetchedData.length > 0) {
        setData(fetchedData);

        // デバッグモードの場合は詳細情報をログ出力
        if (envConfig.debugMode) {
          logger.debug(
            'POIデータ詳細',
            createLogContext({
              action: 'debug_poi_data',
              count: fetchedData.length,
              sampleData: fetchedData.slice(0, 3),
              categories: [...new Set(fetchedData.map(poi => poi.category))],
            })
          );
        }
      } else {
        setError(new Error('データが空です'));
        logger.warn('POIデータが空です', createLogContext({ action: 'empty_data' }));
      }
    },
    [envConfig.debugMode]
  );

  // POIデータを取得する関数（メモ化）
  const fetchPOIData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // データ取得処理の実行
      const fetchedData = await fetchPOIDataWithCache({
        useCache,
        envConfig,
      });

      updatePOIData(fetchedData);
    } catch (err) {
      handleError(err, { action: 'fetch_poi_data' });
    } finally {
      setIsLoading(false);
      isFirstLoad.current = false;
    }
  }, [enabled, useCache, envConfig, updatePOIData, handleError]);

  // データ再取得用の公開関数
  const refetch = useCallback(() => {
    logger.info('POIデータを再取得します', createLogContext({ action: 'refetch' }));
    void fetchPOIData();
  }, [fetchPOIData]);

  // 初回マウント時にデータを取得
  useEffect(() => {
    if (enabled) {
      void fetchPOIData();
    }

    return () => {
      logger.debug(
        'POIデータフックがアンマウントされました',
        createLogContext({ action: 'unmount' })
      );
    };
  }, [enabled, fetchPOIData]);

  // 結果をメモ化して返す
  const result = useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch,
      isFirstLoad: isFirstLoad.current,
    }),
    [data, isLoading, error, refetch]
  );

  return result;
}
