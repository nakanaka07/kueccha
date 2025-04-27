import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// 型定義
import type { POI } from '@/types/poi';
// ユーティリティ
import { clearPOICache } from '@/utils/clearCache';
import { logCSVContent } from '@/utils/csvInspector';
import { parseCSVtoPOIs, combinePOIArrays } from '@/utils/csvProcessor';
import { getEnvBool } from '@/env/core';
import { fetchPOIsFromSheet } from '@/utils/googleSheets';
import { createLogContext } from '@/utils/logContext';
import { logger, LogLevel } from '@/utils/logger';

// コンポーネント名を定数化（DRY原則）
const COMPONENT_NAME = 'usePOIData';

// POIタイプの定義
type POIType = 'restaurant' | 'parking' | 'toilet';

// CSVファイルパスを構造化（保守性向上）
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

// インターフェース定義の強化（型安全性向上）
interface UsePOIDataOptions {
  enabled?: boolean;
  useCache?: boolean;
  cacheTtlMinutes?: number;
  onSuccess?: (data: POI[]) => void;
  onError?: (error: Error) => void;
}

interface CacheResult {
  data: POI[] | null;
  isValid: boolean;
  timestamp?: string;
}

/**
 * POIデータキャッシュ管理
 * キャッシュの読み書きと有効性検証に責任を持つ
 */
const POICache = {
  // 安全なキー取得 (オブジェクトインジェクション対策)
  getKey(key: keyof typeof STORAGE_KEYS): string {
    // 安全なアクセス方法に変更
    if (key === 'POI_DATA') {
      return STORAGE_KEYS.POI_DATA;
    }
    return STORAGE_KEYS.POI_DATA_TIMESTAMP;
  },

  getData(cacheTtl: number): CacheResult {
    return logger.measureTime(
      'キャッシュ読み込み',
      (): CacheResult => {
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

          return { data, isValid, timestamp };
        } catch (error) {
          logger.error(
            'キャッシュ取得エラー',
            createLogContext(COMPONENT_NAME, { action: 'get_cached_data', error })
          );
          return { data: null, isValid: false };
        }
      },
      LogLevel.DEBUG // デバッグレベルで計測（本番環境での影響最小化）
    );
  },

  saveData(data: POI[]): boolean {
    try {
      const timestamp = new Date().toISOString();
      localStorage.setItem(this.getKey('POI_DATA'), JSON.stringify(data));
      localStorage.setItem(this.getKey('POI_DATA_TIMESTAMP'), timestamp);

      logger.debug(
        'キャッシュ保存完了',
        createLogContext(COMPONENT_NAME, { action: 'cache_data', count: data.length })
      );
      return true;
    } catch (error) {
      logger.warn(
        'キャッシュ保存失敗',
        createLogContext(COMPONENT_NAME, { action: 'cache_data', error })
      );
      return false;
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
 * 異なるデータソースからのPOIデータ取得に責任を持つ
 */
const POIDataFetcher = {
  async fromCSV(): Promise<POI[]> {
    const allFiles = [...CSV_FILES.restaurants, ...CSV_FILES.utilities];

    return await logger.measureTimeAsync(
      'CSVデータの取得と解析',
      async () => {
        try {
          const results = await Promise.all(
            allFiles.map(async path => {
              try {
                const response = await fetch(path);
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${path}: ${response.status}`);
                }
                const text = await response.text();

                // CSVデータの内容をログに詳細表示（開発時のみ）
                if (getEnvBool('ENV_DEBUG', false)) {
                  logger.debug(
                    `${path}のCSV内容を検査します`,
                    createLogContext(COMPONENT_NAME, { action: 'inspect_csv' })
                  );
                  logCSVContent(text);
                }

                const poiType = this.detectPOIType(path);
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

          logger.info(
            'CSVデータ取得完了',
            createLogContext(COMPONENT_NAME, {
              action: 'fetch_csv',
              count: allData.length,
              sourceCount: allFiles.length,
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
      LogLevel.INFO
    );
  },

  // POIタイプ検出を独立させる（単一責任の原則）
  detectPOIType(path: string): POIType {
    if (path.includes('駐車場')) return 'parking';
    if (path.includes('公共トイレ')) return 'toilet';
    return 'restaurant';
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
        );

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

// POIタイプのカウント用の関数（安全な実装）
function countPOITypes(pois: POI[]): {
  restaurant: number;
  parking: number;
  toilet: number;
  other: number;
} {
  // 固定されたプロパティでオブジェクトを初期化（Object Injection対策）
  const result = {
    restaurant: 0,
    parking: 0,
    toilet: 0,
    other: 0,
  };

  // 安全なカウント処理
  pois.forEach(poi => {
    if (poi.type === 'restaurant') result.restaurant++;
    else if (poi.type === 'parking') result.parking++;
    else if (poi.type === 'toilet') result.toilet++;
    else result.other++; // 未知のタイプは「other」にまとめる
  });

  return result;
}

/**
 * POIデータを取得・管理するためのカスタムフック
 */
export function usePOIData(options: UsePOIDataOptions = {}) {
  const { enabled = true, useCache = true, cacheTtlMinutes, onSuccess, onError } = options;

  // 環境設定をメモ化
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

  // エラーカウンター追加
  const errorCount = useRef(0);

  // コールバックを保存（依存配列の最適化）
  const onSuccessCallback = useRef(onSuccess);
  const onErrorCallback = useRef(onError);

  // コールバック参照を更新
  useEffect(() => {
    onSuccessCallback.current = onSuccess;
    onErrorCallback.current = onError;
  }, [onSuccess, onError]);

  // エラーハンドリング
  const handleError = useCallback((err: unknown) => {
    const fetchError = err instanceof Error ? err : new Error('不明なエラーが発生しました');
    setError(fetchError);

    // エラーカウントを増加
    errorCount.current += 1;

    logger.error(
      fetchError.message,
      createLogContext(COMPONENT_NAME, {
        action: 'error_handler',
        errorName: fetchError.name,
        errorCount: errorCount.current,
        error: err,
      })
    );

    // 外部エラーハンドラーを呼び出し
    if (onErrorCallback.current) {
      onErrorCallback.current(fetchError);
    }

    // 連続エラーが発生した場合、キャッシュをクリアして再試行
    if (errorCount.current >= 3) {
      logger.warn(
        '複数回のエラーを検知: キャッシュをクリアします',
        createLogContext(COMPONENT_NAME, { action: 'auto_cache_clear' })
      );

      // キャッシュをクリア
      const clearedCount = clearPOICache();

      logger.info(
        `キャッシュクリア完了: ${clearedCount}件をクリアしました`,
        createLogContext(COMPONENT_NAME, { action: 'cache_cleared', count: clearedCount })
      );

      // エラーカウンターをリセット
      errorCount.current = 0;
    }
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
      // URLパラメータによるキャッシュリフレッシュ検出
      const shouldRefreshCache =
        window.location.search.includes('refresh_cache=true') ||
        window.location.hash.includes('refresh_cache');

      if (shouldRefreshCache) {
        logger.info(
          'URLパラメータによりキャッシュをクリアします',
          createLogContext(COMPONENT_NAME, { action: 'manual_cache_clear' })
        );
        clearPOICache();
      }

      // キャッシュ確認
      if (useCache && !shouldRefreshCache) {
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

            // 成功コールバックを呼び出し
            if (onSuccessCallback.current) {
              onSuccessCallback.current(cachedData);
            }

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
          // カテゴリ統計の計算をメモリ効率化
          const categories = Array.from(new Set(fetchedData.map(poi => poi.category)))
            .filter(Boolean)
            .sort();

          logger.debug(
            'POIデータ詳細',
            createLogContext(COMPONENT_NAME, {
              action: 'data_details',
              count: fetchedData.length,
              categories,
              typeCounts: countPOITypes(fetchedData),
            })
          );
        }

        // 成功コールバックを呼び出し
        if (onSuccessCallback.current) {
          onSuccessCallback.current(fetchedData);
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

          // 成功コールバックを呼び出し（フォールバックデータあり）
          if (onSuccessCallback.current) {
            onSuccessCallback.current(cachedData);
          }

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

  // 結果をメモ化して返す（不要な再レンダリングを防止）
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
