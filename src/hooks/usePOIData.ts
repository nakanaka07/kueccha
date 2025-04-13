import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// 型定義
import type { POI } from '@/types/poi-types';
// ユーティリティ
import { parseCSVtoPOIs, combinePOIArrays } from '@/utils/csvProcessor';
import { getEnvBool } from '@/utils/env/core';
import { fetchPOIsFromSheet } from '@/utils/googleSheets';
import { createLogContext } from '@/utils/logContext';
import { logger, LogLevel } from '@/utils/logger';

// コンポーネント名
const COMPONENT_NAME = 'usePOIData';

// CSVファイルパス
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

// インターフェース定義
interface UsePOIDataOptions {
  enabled?: boolean;
  useCache?: boolean;
  cacheTtlMinutes?: number;
}

/**
 * POIデータキャッシュ管理
 */
const POICache = {
  // 安全なキー取得 (オブジェクトインジェクション対策)
  getKey(key: keyof typeof STORAGE_KEYS): string {
    // 直接アクセス方式に変更（セキュリティ改善）
    if (key === 'POI_DATA') {
      return STORAGE_KEYS.POI_DATA;
    }
    return STORAGE_KEYS.POI_DATA_TIMESTAMP;
  },

  getData(cacheTtl: number): { data: POI[] | null; isValid: boolean } {
    try {
      const cachedDataStr = localStorage.getItem(this.getKey('POI_DATA'));
      const timestamp = localStorage.getItem(this.getKey('POI_DATA_TIMESTAMP'));

      if (!cachedDataStr || !timestamp) {
        return { data: null, isValid: false };
      }

      const isValid = this.isValid(timestamp, cacheTtl);
      const data = JSON.parse(cachedDataStr) as POI[];

      // シンプルなログ出力 (KISS原則)
      logger.debug(
        'キャッシュ状態',
        createLogContext(COMPONENT_NAME, {
          action: 'get_cached_data',
          count: data.length,
          isValid,
          cacheAge: `${Math.round((Date.now() - new Date(timestamp).getTime()) / 60000)}分`,
        })
      );

      return { data, isValid };
    } catch (error) {
      logger.error(
        'キャッシュ取得エラー',
        createLogContext(COMPONENT_NAME, { action: 'get_cached_data', error })
      );
      return { data: null, isValid: false };
    }
  },

  saveData(data: POI[]): void {
    try {
      const timestamp = new Date().toISOString();
      localStorage.setItem(this.getKey('POI_DATA'), JSON.stringify(data));
      localStorage.setItem(this.getKey('POI_DATA_TIMESTAMP'), timestamp);

      logger.debug(
        'キャッシュ保存完了',
        createLogContext(COMPONENT_NAME, { action: 'cache_data', count: data.length })
      );
    } catch (error) {
      logger.warn(
        'キャッシュ保存失敗',
        createLogContext(COMPONENT_NAME, { action: 'cache_data', error })
      );
    }
  },

  isValid(timestamp: string, cacheTtl: number): boolean {
    const cachedTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const cacheTtlMs = cacheTtl * 60 * 1000;

    return currentTime - cachedTime < cacheTtlMs;
  },
};

/**
 * POIデータ取得
 */
const POIDataFetcher = {
  async fromCSV(): Promise<POI[]> {
    const allFiles = [...CSV_FILES.restaurants, ...CSV_FILES.utilities];
    const startTime = performance.now();

    try {
      const results = await Promise.all(
        allFiles.map(async path => {
          try {
            const response = await fetch(path);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${path}: ${response.status}`);
            }
            const text = await response.text();

            const poiType = path.includes('駐車場')
              ? 'parking'
              : path.includes('公共トイレ')
                ? 'toilet'
                : 'restaurant';

            return parseCSVtoPOIs(text, poiType);
          } catch (error) {
            logger.error(
              `ファイル読み込みエラー: ${path}`,
              createLogContext(COMPONENT_NAME, { path, error })
            );
            return [];
          }
        })
      );

      const allData = combinePOIArrays(...results);
      const duration = performance.now() - startTime;

      logger.info(
        'CSVデータ取得完了',
        createLogContext(COMPONENT_NAME, {
          action: 'fetch_csv',
          count: allData.length,
          durationMs: Math.round(duration),
        })
      );

      return allData;
    } catch (error) {
      logger.error(
        'CSVデータ取得失敗',
        createLogContext(COMPONENT_NAME, { action: 'fetch_csv', error })
      );
      return [];
    }
  },
  async fetch(useGoogleSheets: boolean): Promise<POI[]> {
    const isOnline = navigator.onLine;

    try {
      if (!isOnline && getEnvBool('FEATURES_OFFLINE_MODE', false)) {
        throw new Error('オフラインモードでネットワーク接続がありません');
      }
      if (useGoogleSheets) {
        logger.info(
          'Google Sheetsからデータ取得開始',
          createLogContext(COMPONENT_NAME, { action: 'fetch_sheets' })
        ); // KISS原則に基づき、シンプルな引数構造を使用

        // LogLevel を第3引数として渡し、第4引数にコンテキストオブジェクトを渡す
        return await logger.measureTimeAsync(
          'Google Sheetsデータ取得',
          () => fetchPOIsFromSheet('restaurant', 'レストラン!A1:Z1000'),
          LogLevel.INFO
        );
      } else {
        logger.info(
          'CSVファイルからデータ取得開始',
          createLogContext(COMPONENT_NAME, { action: 'fetch_csv' })
        );

        return await this.fromCSV();
      }
    } catch (error) {
      // 未使用変数を削除 (YAGNI原則)
      logger.error(
        'データ取得エラー',
        createLogContext(COMPONENT_NAME, {
          action: 'fetch_data',
          source: useGoogleSheets ? 'google_sheets' : 'csv',
          isOnline,
          error,
        })
      );

      throw error;
    }
  },
};

/**
 * POIデータを取得・管理するためのカスタムフック
 */
export function usePOIData(options: UsePOIDataOptions = {}) {
  const { enabled = true, useCache = true, cacheTtlMinutes } = options;
  // 環境設定
  const config = useMemo(
    () => ({
      useGoogleSheets: getEnvBool('FEATURES_GOOGLE_SHEETS', false),
      offlineMode: getEnvBool('FEATURES_OFFLINE_MODE', false),
      cacheTTL: cacheTtlMinutes ?? (getEnvBool('ENV_IS_DEV', false) ? 5 : 60),
      debugMode: getEnvBool('ENV_DEBUG', false),
    }),
    [cacheTtlMinutes]
  );

  // 状態管理
  const [data, setData] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFirstLoad = useRef(true);

  // エラーハンドリング
  const handleError = useCallback((err: unknown) => {
    const fetchError = err instanceof Error ? err : new Error('不明なエラーが発生しました');
    setError(fetchError);
    logger.error(
      fetchError.message,
      createLogContext(COMPONENT_NAME, {
        action: 'error_handler',
        errorName: fetchError.name,
        error: err,
      })
    );
  }, []);

  // データ取得ロジック
  const fetchPOIData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // キャッシュ確認
      if (useCache) {
        const { data: cachedData, isValid } = POICache.getData(config.cacheTTL);

        if (cachedData) {
          // 有効なキャッシュまたはオフラインモード時
          if (isValid || (config.offlineMode && !navigator.onLine)) {
            logger.info(
              'キャッシュデータを使用',
              createLogContext(COMPONENT_NAME, {
                action: 'use_cache',
                count: cachedData.length,
                isValid,
              })
            );

            setData(cachedData);
            setIsLoading(false);
            isFirstLoad.current = false;
            return;
          }
        }
      }

      // 新規データの取得
      const fetchedData = await POIDataFetcher.fetch(config.useGoogleSheets);

      if (fetchedData.length > 0) {
        setData(fetchedData);

        // キャッシュ保存
        if (useCache) {
          POICache.saveData(fetchedData);
        }

        if (config.debugMode) {
          logger.debug(
            'POIデータ詳細',
            createLogContext(COMPONENT_NAME, {
              action: 'data_details',
              count: fetchedData.length,
              categories: [...new Set(fetchedData.map(poi => poi.category))],
            })
          );
        }
      } else {
        throw new Error('データが空です');
      }
    } catch (err) {
      // エラー時にはキャッシュからのフォールバックを試みる
      if (useCache) {
        const { data: cachedData } = POICache.getData(Infinity); // 期限を無視

        if (cachedData?.length) {
          logger.warn(
            'データ取得失敗: キャッシュを使用',
            createLogContext(COMPONENT_NAME, {
              action: 'fallback_to_cache',
              count: cachedData.length,
            })
          );

          setData(cachedData);
          setError(new Error('最新データの取得に失敗しました。キャッシュを使用しています。'));
          setIsLoading(false);
          isFirstLoad.current = false;
          return;
        }
      }

      handleError(err);
    } finally {
      setIsLoading(false);
      isFirstLoad.current = false;
    }
  }, [enabled, useCache, config, handleError]);

  // データ再取得用関数
  const refetch = useCallback(() => {
    logger.info('データ再取得', createLogContext(COMPONENT_NAME, { action: 'refetch' }));

    void fetchPOIData();
  }, [fetchPOIData]);

  // 初回マウント時にデータ取得
  useEffect(() => {
    if (enabled) {
      void fetchPOIData();
    }

    return () => {
      logger.debug('フック終了', createLogContext(COMPONENT_NAME, { action: 'unmount' }));
    };
  }, [enabled, fetchPOIData]);

  // 結果を返す
  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch,
      isFirstLoad: isFirstLoad.current,
    }),
    [data, isLoading, error, refetch]
  );
}
