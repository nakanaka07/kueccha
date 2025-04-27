// filepath: c:\Users\int-x-survey\Desktop\kueccha\src\utils\googleSheets.ts
// ファイル: googleSheets.ts
/**
 * Google Sheetsデータアクセスモジュール
 *
 * POIデータをGoogle Sheetsから取得し、IndexedDBでキャッシュ管理を行います。
 * オフラインサポートとパフォーマンス最適化を実装しています。
 *
 * @author 佐渡で食えっちゃプロジェクトチーム
 * @version 1.5.0
 * @lastUpdate 2025年4月26日
 */

import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

import { parseCSVtoPOIs } from './csvProcessor';

import type { LogContext } from '@/types/logger';
import { getEnv } from '@/env/core';
import { logger } from '@/utils/logger';
import { measurePerformance } from '@/utils/performance';

// POIType型を直接定義
type POIType = 'restaurant' | 'parking' | 'toilet' | 'shop' | 'attraction' | 'other';

/**
 * シートデータの型定義
 */
interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * Google Sheets APIレスポンスの型定義
 */
interface SheetsResponse {
  spreadsheetId: string;
  valueRanges: SheetData[];
}

/**
 * キャッシュエントリの型定義
 */
interface CacheEntry {
  range: string;
  data: SheetData;
  timestamp: number;
}

/**
 * POI データキャッシュのデータベース構造
 */
interface POIDatabase {
  sheets: {
    key: string;
    value: CacheEntry;
    indexes: { timestamp: number };
  };
  metadata: {
    key: string;
    value: unknown;
    timestamp: number;
  };
}

/**
 * ネットワークステータスの型定義
 */
interface NetworkStatus {
  online: boolean;
  downlinkSpeed?: number | null;
  latency?: number | null;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | null;
}

/**
 * ネットワーク接続APIの型定義
 */
interface NetworkConnection {
  downlink?: number;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
}

/**
 * APIエラーメッセージのマッピング
 */
const API_ERROR_MESSAGES: Record<string, string> = {
  '400': 'リクエストパラメータが不正です',
  '401': '認証に失敗しました',
  '403': 'Google Sheets APIキーの権限が不足しています',
  '404': 'スプレッドシートが見つかりません',
  '429': 'API使用量制限を超えました。しばらく待ってから再試行してください',
  '500': 'Googleサーバー内部エラー。しばらくしてから再試行してください',
  '503': 'Google Sheetsサービスが一時的に利用できません',
  timeout: 'APIリクエストがタイムアウトしました',
  network: 'ネットワーク接続エラー',
  parse: 'レスポンスの解析に失敗しました',
  unknown: '不明なエラーが発生しました',
  default: 'API応答エラー',
};

/**
 * キャッシュ制御設定
 */
const CACHE_CONFIG = {
  /** キャッシュ有効期限（ミリ秒）: 環境変数から取得または開発環境では15分、本番環境では60分 */
  EXPIRY_MS:
    Number(getEnv('VITE_CACHE_EXPIRY_MS', { required: false })) ||
    (import.meta.env.DEV ? 15 : 60) * 60 * 1000,
  /** キャッシュ強制更新の閾値（ミリ秒）: 環境変数から取得するか、デフォルト12時間 */
  FORCE_REFRESH_MS:
    Number(getEnv('VITE_CACHE_FORCE_REFRESH_MS', { required: false })) || 12 * 60 * 60 * 1000,
  /** データベース名 */
  DB_NAME: 'poi-cache-db',
  /** データベースバージョン */
  DB_VERSION: 3, // バージョンアップで新機能追加
  /** キャッシュ整理の最大エントリ数 */
  MAX_ENTRIES: Number(getEnv('VITE_CACHE_MAX_ENTRIES', { required: false })) || 100,
  /** オフラインモードでのキャッシュ延長係数 */
  OFFLINE_EXTENSION_FACTOR:
    Number(getEnv('VITE_CACHE_OFFLINE_EXTENSION', { required: false })) || 5,
  /** API接続タイムアウト（ミリ秒） */
  API_TIMEOUT_MS: Number(getEnv('VITE_API_TIMEOUT_MS', { required: false })) || 10000,
  /** キャッシュクリーンアップの間隔（ミリ秒） */
  CLEANUP_INTERVAL_MS: 24 * 60 * 60 * 1000, // 24時間ごと
  /** 最後にクリーンアップを実行した時刻のストレージキー */
  LAST_CLEANUP_KEY: 'poi-cache-last-cleanup',
  /** リトライ設定 */
  RETRY: {
    MAX_ATTEMPTS: Number(getEnv('VITE_API_MAX_RETRY', { required: false })) || 2,
    DELAY_MS: Number(getEnv('VITE_API_RETRY_DELAY_MS', { required: false })) || 1000,
    BACKOFF_FACTOR: 1.5,
  },
};

/**
 * キャッシュの取得結果型
 */
interface CacheResult {
  cachedData: SheetData[];
  expiredRanges: string[];
  missingRanges: string[];
  forceRefreshRanges: string[];
}

/**
 * IndexedDBの初期化とマイグレーション管理
 * @returns IndexedDBのインスタンス
 */
async function initDB(): Promise<IDBPDatabase<POIDatabase>> {
  return openDB<POIDatabase>(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      logger.info('IndexedDBをアップグレードしています', {
        component: 'googleSheets',
        action: 'db_upgrade',
        oldVersion,
        newVersion,
      });

      // バージョン1からの初期セットアップまたは新規作成
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('sheets')) {
          const store = db.createObjectStore('sheets', { keyPath: 'range' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }

      // バージョン2の変更
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains('sheets')) {
          logger.debug('既存のsheetsストアを更新します', {
            component: 'googleSheets',
            action: 'db_update_store',
          });
          // 将来的に必要になった場合にここを拡張
        }
      }

      // バージョン3の変更（メタデータ保存用のストア追加）
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
          logger.debug('metadataストアを作成しました', {
            component: 'googleSheets',
            action: 'db_create_metadata_store',
          });

          // 初期のメタデータ設定を保存
          const tx = db.transaction('metadata', 'readwrite');
          tx.store.put({
            key: 'version',
            value: CACHE_CONFIG.DB_VERSION,
            timestamp: Date.now(),
          });
          tx.store.put({
            key: 'lastCleanup',
            value: Date.now(),
            timestamp: Date.now(),
          });
        }
      }
    },
    blocked() {
      logger.warn('IndexedDBのアップグレードがブロックされています', {
        component: 'googleSheets',
        action: 'db_blocked',
      });
    },
    blocking() {
      logger.warn('このページが新しいバージョンのIndexedDBへのアクセスをブロックしています', {
        component: 'googleSheets',
        action: 'db_blocking',
      });
    },
    terminated() {
      logger.error('IndexedDBの接続が予期せず終了しました', {
        component: 'googleSheets',
        action: 'db_terminated',
      });
    },
  });
}

/**
 * キャッシュの期限切れ状態を定義する列挙型
 */
enum CacheStatus {
  VALID = 'valid', // 有効なキャッシュ
  STALE = 'stale', // 古いがオフライン時に使用可能
  EXPIRED = 'expired', // 期限切れで使用不可
  FORCE_REFRESH = 'force', // 強制更新が必要
}

/**
 * ネットワーク状態を取得
 * @returns ネットワークステータス情報
 */
function getNetworkStatus(): NetworkStatus {
  const status: NetworkStatus = {
    online: navigator.onLine,
  };

  try {
    // Connection APIが利用可能な場合は追加情報を取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      status.downlinkSpeed = connection.downlink || null;
      status.effectiveType = connection.effectiveType || null;
      status.latency = connection.rtt || null;
    }
  } catch {
    // Connection APIの呼び出しに失敗した場合は無視
    logger.debug('Connection APIは利用できません', {
      component: 'googleSheets',
      action: 'connection_api_unavailable',
    });
  }

  return status;
}

/**
 * キャッシュエントリの状態を確認
 * @param timestamp キャッシュのタイムスタンプ
 * @param networkStatus ネットワーク状態
 * @returns キャッシュの状態
 */
function getCacheStatus(timestamp: number, networkStatus: NetworkStatus): CacheStatus {
  const currentTime = Date.now();
  const standardExpiry = timestamp + CACHE_CONFIG.EXPIRY_MS;
  const forceRefreshTime = timestamp + CACHE_CONFIG.FORCE_REFRESH_MS;

  // 強制更新の閾値を超えた場合
  if (currentTime > forceRefreshTime && networkStatus.online) {
    return CacheStatus.FORCE_REFRESH;
  }

  // 通常の有効期限内
  if (currentTime < standardExpiry) {
    return CacheStatus.VALID;
  }

  // オフラインモードでの拡張有効期限
  if (!networkStatus.online) {
    const extendedExpiry =
      timestamp + CACHE_CONFIG.EXPIRY_MS * CACHE_CONFIG.OFFLINE_EXTENSION_FACTOR;
    if (currentTime < extendedExpiry) {
      return CacheStatus.STALE;
    }
  }

  // 期限切れ
  return CacheStatus.EXPIRED;
}

/**
 * キャッシュからシートデータの取得を試みる
 * @param sheetRanges 取得するシート範囲の配列
 * @returns キャッシュから取得したシートデータの配列
 */
async function tryGetFromCache(sheetRanges: string[]): Promise<CacheResult> {
  // 現在のネットワーク状態を取得
  const networkStatus = getNetworkStatus();
  const db = await initDB();
  const cachedData: SheetData[] = [];
  const expiredRanges: string[] = [];
  const missingRanges: string[] = [];
  const forceRefreshRanges: string[] = [];

  // 並列処理でキャッシュからのデータ取得を効率化
  const cacheResults = await Promise.all(
    sheetRanges.map(async (range: string) => {
      try {
        const cachedItem = (await db.get('sheets', range)) as CacheEntry | undefined;
        return { range, cachedItem, error: null };
      } catch (error) {
        // 個別のキャッシュ取得エラーを記録
        return {
          range,
          cachedItem: undefined,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  // 取得した結果を分類
  for (const { range, cachedItem, error } of cacheResults) {
    if (error) {
      logger.warn(`キャッシュ取得エラー: ${range}`, {
        component: 'googleSheets',
        action: 'cache_error',
        range,
        error,
      });
      missingRanges.push(range);
      continue;
    }

    if (cachedItem) {
      const cacheStatus = getCacheStatus(cachedItem.timestamp, networkStatus);

      switch (cacheStatus) {
        case CacheStatus.VALID:
          cachedData.push(cachedItem.data);
          break;
        case CacheStatus.STALE:
          // オフラインでも使用できる古いキャッシュ
          cachedData.push(cachedItem.data);
          expiredRanges.push(range); // ただし、オンラインになったら更新すべき
          break;
        case CacheStatus.FORCE_REFRESH:
          // 強制更新が必要なデータ（ただし、オフラインの場合は使用）
          if (!networkStatus.online) {
            cachedData.push(cachedItem.data);
          }
          forceRefreshRanges.push(range);
          break;
        case CacheStatus.EXPIRED:
          expiredRanges.push(range);
          break;
      }
    } else {
      missingRanges.push(range);
    }
  }

  // ログ情報を構造化
  const cacheStatus = {
    component: 'googleSheets',
    totalRanges: sheetRanges.length,
    validCache: cachedData.length,
    expiredCache: expiredRanges.length,
    missingCache: missingRanges.length,
    forceRefreshCache: forceRefreshRanges.length,
    networkStatus,
  };

  if (forceRefreshRanges.length > 0) {
    logger.info('一部のキャッシュデータが強制更新対象です', {
      ...cacheStatus,
      action: 'cache_force_refresh',
      forceRefreshRanges,
    });
  }

  if (expiredRanges.length > 0) {
    logger.debug('一部のキャッシュデータが期限切れです', {
      ...cacheStatus,
      action: 'cache_expired',
      expiredRanges,
    });
  }

  if (missingRanges.length > 0) {
    logger.debug('一部のデータがキャッシュに存在しません', {
      ...cacheStatus,
      action: 'cache_missing',
      missingRanges,
    });
  }

  // 定期的なキャッシュクリーンアップの実行（非同期）
  if (shouldRunCleanup()) {
    cleanupOldCache(db).catch(error => {
      logger.warn('キャッシュクリーンアップに失敗しましたが、処理を継続します', {
        component: 'googleSheets',
        action: 'cleanup_error',
        error: error instanceof Error ? error.message : String(error),
      });
    });
  } else if (cachedData.length > 0) {
    // 通常のキャッシュアクセス時にもクリーンアップが必要か確認（サイズベース）
    checkCacheSizeAndCleanIfNeeded(db).catch(error => {
      logger.warn('キャッシュサイズチェックに失敗しましたが、処理を継続します', {
        component: 'googleSheets',
        action: 'size_check_error',
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  return {
    cachedData,
    expiredRanges,
    missingRanges,
    forceRefreshRanges,
  };
}

/**
 * 定期的なクリーンアップが必要かどうかを確認
 * @returns クリーンアップが必要な場合はtrue
 */
function shouldRunCleanup(): boolean {
  const lastCleanup = Number(localStorage.getItem(CACHE_CONFIG.LAST_CLEANUP_KEY)) || 0;
  const currentTime = Date.now();
  return currentTime - lastCleanup > CACHE_CONFIG.CLEANUP_INTERVAL_MS;
}

/**
 * キャッシュのサイズをチェックし、必要に応じてクリーンアップ
 * @param db データベースインスタンス
 */
async function checkCacheSizeAndCleanIfNeeded(db: IDBPDatabase<POIDatabase>): Promise<void> {
  try {
    const tx = db.transaction('sheets', 'readonly');
    const count = await tx.store.count();

    // エントリ数が上限の80%を超えたらクリーンアップを実行
    if (count > CACHE_CONFIG.MAX_ENTRIES * 0.8) {
      await cleanupOldCache(db);
    }
  } catch (error) {
    logger.warn('キャッシュサイズチェック中にエラーが発生しました', {
      component: 'googleSheets',
      action: 'size_check_error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 古いキャッシュエントリを削除して容量を最適化
 * @param db データベースインスタンス
 */
async function cleanupOldCache(db: IDBPDatabase<POIDatabase>): Promise<void> {
  try {
    // メインの処理はmeasureTimeAsyncを使用して計測
    await logger.measureTimeAsync('キャッシュクリーンアップ', async () => {
      const tx = db.transaction('sheets', 'readwrite');
      const index = tx.store.index('timestamp');
      const count = await index.count();

      // エントリ数が上限の50%を超えた場合のみクリーンアップを実行
      if (count > CACHE_CONFIG.MAX_ENTRIES * 0.5) {
        // タイムスタンプの昇順で取得（最も古いものから）
        const oldEntries = await index.getAll(undefined, CACHE_CONFIG.MAX_ENTRIES / 4);

        // 最も古い25%のエントリを削除
        const deletePromises = oldEntries.map(entry => tx.store.delete(entry.range));
        await Promise.all(deletePromises);

        logger.debug('古いキャッシュエントリをクリーンアップしました', {
          component: 'googleSheets',
          action: 'cache_cleanup',
          removedEntries: oldEntries.length,
          remainingEntries: count - oldEntries.length,
          oldestTimestamp:
            oldEntries.length > 0 ? new Date(oldEntries[0].timestamp).toISOString() : 'N/A',
          newestTimestamp:
            oldEntries.length > 0
              ? new Date(oldEntries[oldEntries.length - 1].timestamp).toISOString()
              : 'N/A',
        });
      } else {
        logger.debug('キャッシュクリーンアップはスキップされました（エントリ数が少ない）', {
          component: 'googleSheets',
          action: 'cache_cleanup_skip',
          currentEntries: count,
          maxEntries: CACHE_CONFIG.MAX_ENTRIES,
        });
      }

      // 最後のクリーンアップ時刻を更新
      localStorage.setItem(CACHE_CONFIG.LAST_CLEANUP_KEY, Date.now().toString());

      await tx.done;
    });
  } catch (error) {
    // クリーンアップの失敗はアプリケーションの動作に影響しないよう、ログ記録のみ
    logger.warn('キャッシュクリーンアップ中にエラーが発生しました', {
      component: 'googleSheets',
      action: 'cache_cleanup_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // エラーを上位に伝播し、呼び出し元でハンドリングできるようにする
    throw error;
  }
}

/**
 * 指数バックオフによるリトライ付きのAPI呼び出し
 * @param url API URL
 * @param options フェッチオプション
 * @returns レスポンス
 */
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let attempts = 0;
  const { MAX_ATTEMPTS, DELAY_MS, BACKOFF_FACTOR } = CACHE_CONFIG.RETRY;

  while (attempts < MAX_ATTEMPTS) {
    try {
      // AbortControllerでタイムアウト設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CACHE_CONFIG.API_TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 429 (レート制限) または 5xx (サーバーエラー) の場合はリトライ
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempts + 1 < MAX_ATTEMPTS) {
          attempts++;
          // 指数バックオフによる待機時間の計算
          const delay = DELAY_MS * Math.pow(BACKOFF_FACTOR, attempts);

          logger.warn(
            `APIリクエストに失敗しました。${delay}ms後に再試行します (${attempts}/${MAX_ATTEMPTS})`,
            {
              component: 'googleSheets',
              action: 'api_retry',
              url: url.split('?')[0], // クエリパラメータを除いたURLのみログに記録
              statusCode: response.status,
              attempts,
            }
          );

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      // タイムアウトやネットワークエラーの場合
      if (attempts + 1 < MAX_ATTEMPTS) {
        attempts++;
        // 指数バックオフによる待機時間の計算
        const delay = DELAY_MS * Math.pow(BACKOFF_FACTOR, attempts);

        logger.warn(
          `APIリクエストに失敗しました。${delay}ms後に再試行します (${attempts}/${MAX_ATTEMPTS})`,
          {
            component: 'googleSheets',
            action: 'api_retry',
            url: url.split('?')[0], // クエリパラメータを除いたURLのみログに記録
            error: error instanceof Error ? error.message : String(error),
            attempts,
          }
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`最大リトライ回数 (${MAX_ATTEMPTS}) に達しました`);
}

/**
 * Google Sheets APIからデータを取得する
 * @param sheetRanges 取得するシート範囲の配列
 * @param forceRefresh 強制的にAPIからデータを取得するかどうか
 * @returns シートデータの配列と取得状態情報
 */
export async function fetchFromGoogleSheets(
  sheetRanges: string[],
  forceRefresh = false
): Promise<{ data: SheetData[]; fromCache: boolean; partialCache: boolean }> {
  // 共通のログコンテキスト
  const logContext: LogContext = {
    component: 'googleSheets',
    action: 'fetch_sheets',
    ranges: sheetRanges,
    forceRefresh,
    networkStatus: getNetworkStatus(),
  };

  // パフォーマンス計測
  return await measurePerformance('Google Sheetsデータ取得', async () => {
    const API_KEY = getEnv('VITE_GOOGLE_API_KEY', { required: true }).trim();
    const SPREADSHEET_ID = getEnv('VITE_GOOGLE_SPREADSHEET_ID', { required: true }).trim();
    const networkStatus = getNetworkStatus();

    // 強制更新でなく、オンラインの場合はキャッシュを最初に試す
    if (!forceRefresh) {
      try {
        const cacheResult = await tryGetFromCache(sheetRanges);

        // すべてのレンジのデータがキャッシュに有効に存在する場合
        if (
          cacheResult.cachedData.length === sheetRanges.length &&
          cacheResult.expiredRanges.length === 0 &&
          cacheResult.forceRefreshRanges.length === 0
        ) {
          logger.info('キャッシュからすべてのデータを取得しました', {
            ...logContext,
            action: 'cache_complete_hit',
            cachedRanges: sheetRanges,
          });
          return {
            data: cacheResult.cachedData,
            fromCache: true,
            partialCache: false,
          };
        }

        // 一部がキャッシュから取得できた場合、ネットワークが利用できなければそのデータを使用
        if (cacheResult.cachedData.length > 0 && !networkStatus.online) {
          logger.info('オフライン: キャッシュから一部のデータを取得しました', {
            ...logContext,
            action: 'cache_partial_offline',
            cachedRanges: cacheResult.cachedData.map((d: SheetData) => d.range),
            missingRanges: cacheResult.missingRanges,
          });
          return {
            data: cacheResult.cachedData,
            fromCache: true,
            partialCache:
              cacheResult.missingRanges.length > 0 || cacheResult.expiredRanges.length > 0,
          };
        }

        // 残りはAPIから取得する必要がある
        if (networkStatus.online) {
          // まだ取得していないレンジのリスト
          const rangesToFetch = [
            ...cacheResult.missingRanges,
            ...cacheResult.expiredRanges,
            ...cacheResult.forceRefreshRanges,
          ];

          if (rangesToFetch.length > 0) {
            logger.info('一部のデータをAPIから取得します', {
              ...logContext,
              action: 'api_partial_fetch',
              cachedRanges: cacheResult.cachedData.map((d: SheetData) => d.range),
              rangesToFetch,
            });

            // APIからデータを取得して結合
            try {
              const apiData = await fetchRangesFromAPI(rangesToFetch, API_KEY, SPREADSHEET_ID);
              // キャッシュと結合
              const allData = [...cacheResult.cachedData, ...apiData];
              return {
                data: allData,
                fromCache: false,
                partialCache: cacheResult.cachedData.length > 0,
              };
            } catch (apiError) {
              // APIエラーの場合はキャッシュからのデータを返す
              logger.warn('API取得に失敗しました。キャッシュデータを使用します', {
                ...logContext,
                action: 'api_error_use_cache',
                error: apiError instanceof Error ? apiError.message : String(apiError),
              });
              return {
                data: cacheResult.cachedData,
                fromCache: true,
                partialCache: true,
              };
            }
          }
        }
      } catch (cacheError) {
        // キャッシュエラーはログに記録するだけで、APIフォールバックへ進む
        logger.debug('キャッシュ取得エラー、APIフォールバックします', {
          ...logContext,
          action: 'cache_error',
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        });
      }
    }

    // ここまで来たら、キャッシュが使えないか強制更新
    // オンラインであればAPIからデータを取得
    if (networkStatus.online) {
      try {
        logger.info('Google Sheets APIからデータを取得します', {
          ...logContext,
          action: 'fetch_api',
          spreadsheetId: SPREADSHEET_ID,
        });

        const apiData = await fetchRangesFromAPI(sheetRanges, API_KEY, SPREADSHEET_ID);
        return {
          data: apiData,
          fromCache: false,
          partialCache: false,
        };
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);

        logger.error(`Google Sheets APIエラー`, {
          ...logContext,
          action: 'api_fetch_error',
          error: errorMessage,
        });

        // API取得に失敗した場合、キャッシュからの取得を試みる
        logger.info('キャッシュからデータの取得を試みます', {
          ...logContext,
          action: 'cache_fallback',
        });

        // キャッシュから無条件に取得を試みる（期限切れでも使用）
        try {
          const db = await initDB();
          const cachedEntries = await Promise.all(
            sheetRanges.map(range => db.get('sheets', range))
          );

          const validData = cachedEntries.filter(Boolean).map(entry => entry!.data);

          if (validData.length > 0) {
            logger.info('APIエラー後のキャッシュフォールバックに成功しました', {
              ...logContext,
              action: 'cache_fallback_success',
              cachedCount: validData.length,
              totalCount: sheetRanges.length,
            });

            return {
              data: validData,
              fromCache: true,
              partialCache: validData.length < sheetRanges.length,
            };
          }
        } catch (fallbackError) {
          logger.error('キャッシュフォールバックにも失敗しました', {
            ...logContext,
            action: 'cache_fallback_error',
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
        }

        // キャッシュからも取得できなかった場合はエラーを投げる
        throw new Error(`Google Sheetsデータを取得できませんでした: ${errorMessage}`);
      }
    }

    // ここまで来たらオフラインでAPIからも取得できない状態
    // 最後の手段としてキャッシュを確認（期限切れも含めて）
    try {
      logger.warn('オフラインモード: キャッシュからデータの取得を試みます', {
        ...logContext,
        action: 'offline_cache_attempt',
      });

      const db = await initDB();
      const cachedEntries = await Promise.all(sheetRanges.map(range => db.get('sheets', range)));

      const availableData = cachedEntries.filter(Boolean).map(entry => entry!.data);

      if (availableData.length > 0) {
        logger.info('オフラインモードでキャッシュからデータを取得しました', {
          ...logContext,
          action: 'offline_cache_success',
          cachedCount: availableData.length,
          totalCount: sheetRanges.length,
        });

        return {
          data: availableData,
          fromCache: true,
          partialCache: availableData.length < sheetRanges.length,
        };
      }

      throw new Error('オフラインモードでキャッシュからのデータ取得に失敗しました');
    } catch (offlineError) {
      logger.error('オフラインモードでデータ取得に失敗しました', {
        ...logContext,
        action: 'offline_error',
        error: offlineError instanceof Error ? offlineError.message : String(offlineError),
      });

      // 最終的なエラー
      throw new Error(
        'Google Sheetsデータを取得できませんでした。オンライン状態とAPIキーを確認してください。'
      );
    }
  });
}

/**
 * 指定されたレンジをAPIから取得し、キャッシュに保存する
 * @param ranges 取得するレンジの配列
 * @param apiKey Google API Key
 * @param spreadsheetId スプレッドシートID
 * @returns 取得したシートデータの配列
 */
async function fetchRangesFromAPI(
  ranges: string[],
  apiKey: string,
  spreadsheetId: string
): Promise<SheetData[]> {
  // 複数のシート範囲をURLパラメータに変換
  const rangeParams = ranges.map(range => `ranges=${encodeURIComponent(range)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeParams}&key=${apiKey}`;

  try {
    // リトライ機能付きのフェッチを使用
    const response = await fetchWithRetry(url, {
      headers: {
        'Cache-Control': 'no-store', // キャッシュ無効化
      },
    });

    // HTTPステータスコードによる詳細なエラーハンドリング
    if (!response.ok) {
      const statusCode = response.status;
      let errorText: string;
      try {
        // JSONとしてパースを試みる
        const errorJson = await response.json();
        errorText = JSON.stringify(errorJson);
      } catch {
        // テキストとして取得
        try {
          errorText = await response.text();
        } catch {
          errorText = 'レスポンステキストの取得に失敗しました';
        }
      }

      logger.error(`Google Sheets API応答エラー`, {
        component: 'googleSheets',
        action: 'api_error',
        statusCode,
        errorText,
        spreadsheetId: spreadsheetId,
      });

      // 特定のステータスコードに対するエラーメッセージ
      const errorMessage =
        API_ERROR_MESSAGES[statusCode.toString()] ||
        `${API_ERROR_MESSAGES.default}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // レスポンスをJSONとしてパース
    let data: SheetsResponse;
    try {
      data = (await response.json()) as SheetsResponse;
    } catch (parseError) {
      logger.error('API応答のJSONパースに失敗しました', {
        component: 'googleSheets',
        action: 'parse_error',
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      throw new Error(API_ERROR_MESSAGES.parse);
    }

    // 成功時のINFOログ
    logger.info('Google Sheets APIからデータを取得しました', {
      component: 'googleSheets',
      action: 'fetch_success',
      rowCounts: data.valueRanges.map(range => range.values?.length || 0),
    });

    // キャッシュへのデータ保存
    try {
      await saveToCache(data.valueRanges);
    } catch (cacheError) {
      logger.warn('キャッシュへのデータ保存に失敗しました', {
        component: 'googleSheets',
        action: 'cache_save_error',
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
      // キャッシュエラーは許容してAPIデータを返す
    }

    return data.valueRanges;
  } catch (fetchError) {
    // フェッチエラーの詳細を判別
    if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
      logger.error('Google Sheets APIリクエストがタイムアウトしました', {
        component: 'googleSheets',
        action: 'api_timeout',
      });
      throw new Error(API_ERROR_MESSAGES.timeout);
    } else if (fetchError instanceof Error) {
      // ネットワークエラーかどうかを判定
      if (
        fetchError.message.includes('network') ||
        fetchError.message.includes('fetch') ||
        fetchError.message.includes('connection')
      ) {
        throw new Error(API_ERROR_MESSAGES.network);
      }
    }
    throw fetchError;
  }
}

/**
 * シートデータをキャッシュに保存
 * @param valueRanges 保存するシートデータの配列
 */
async function saveToCache(valueRanges: SheetData[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('sheets', 'readwrite');
  const now = Date.now();
  const batchPromises = [];

  // バッチ処理による効率的なキャッシュ保存
  for (const valueRange of valueRanges) {
    batchPromises.push(
      tx.store.put({
        range: valueRange.range,
        data: valueRange,
        timestamp: now,
      })
    );
  }

  // Promise.allでバッチ処理を並列実行
  await Promise.all(batchPromises);
  await tx.done;

  logger.debug('シートデータをキャッシュに保存しました', {
    component: 'googleSheets',
    action: 'cache_save',
    itemCount: valueRanges.length,
    timestamp: new Date(now).toISOString(),
  });
}

/**
 * スプレッドシート値から2次元配列をCSV文字列に変換
 * @param values 変換する2次元配列
 * @returns CSV形式の文字列
 */
export function convertValuesToCSV(values: string[][]): string {
  if (!values || values.length === 0) return '';

  return values
    .map(row =>
      row
        .map(cell => {
          // nullとundefinedを適切に処理
          const cellValue = cell ?? '';
          // カンマまたは引用符を含むセルは引用符で囲み、内部の引用符はエスケープする
          if (cellValue.includes(',') || cellValue.includes('"')) {
            return `"${cellValue.replace(/"/g, '""')}"`;
          }
          return cellValue;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Google SheetsからPOIデータを取得する
 * @param poiType POIの種類
 * @param sheetRange シート範囲（例: 'レストラン!A1:Z1000'）
 * @param forceRefresh キャッシュを無視して強制的に再取得するかどうか
 * @returns POIデータの配列（エラー時は空配列）
 */
export async function fetchPOIsFromSheet(
  poiType: POIType,
  sheetRange: string,
  forceRefresh = false
) {
  const logContext = {
    component: 'googleSheets',
    action: 'fetch_pois',
    poiType,
    sheetRange,
    forceRefresh,
  };

  logger.debug('POIデータ取得を開始', logContext);

  return await logger.measureTimeAsync(`${poiType}データ取得`, async () => {
    try {
      // forceRefreshパラメータを渡して、必要に応じて強制再取得
      const {
        data: sheetData,
        fromCache,
        partialCache,
      } = await fetchFromGoogleSheets([sheetRange], forceRefresh);

      // データチェック - 値が存在しない場合は早期リターン
      if (!sheetData[0]?.values?.length) {
        logger.warn(`シート「${sheetRange}」にデータがありません`, {
          ...logContext,
          action: 'fetch_pois_empty',
          fromCache,
          partialCache,
        });
        return [];
      }

      // データ変換処理
      const csvString = convertValuesToCSV(sheetData[0].values);
      const pois = parseCSVtoPOIs(csvString, poiType);

      logger.info(`${poiType}データを正常に取得しました`, {
        ...logContext,
        action: 'fetch_pois_success',
        count: pois.length,
        fromCache,
        partialCache,
        firstRow: pois.length > 0 ? pois[0].name : null,
      });

      return pois;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(`${poiType}データの取得に失敗`, {
        ...logContext,
        action: 'fetch_pois_error',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // KISS原則に従い、一貫して空配列を返す（呼び出し元での特別な処理不要）
      return [];
    }
  });
}

/**
 * オンラインステータスの変更を監視し、キャッシュ管理を最適化
 *
 * 注: このリスナーはアプリケーション起動時に一度だけ登録する必要があります
 */
export function setupNetworkStatusMonitor(): () => void {
  // 接続品質の変化を監視するためのタイマーID
  let connectionQualityTimerId: number | null = null;

  // 接続品質の定期チェック
  const checkConnectionQuality = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

      if (connection) {
        logger.debug('ネットワーク接続品質情報', {
          component: 'googleSheets',
          action: 'network_quality_check',
          downlink: connection.downlink,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      }
    } catch {
      logger.debug('接続品質情報の取得に失敗しました', {
        component: 'googleSheets',
        action: 'network_quality_check_error',
      });
    }
  };

  const handleOnline = () => {
    logger.info('オンライン状態に戻りました。キャッシュ更新を検討してください', {
      component: 'googleSheets',
      action: 'network_online',
      timestamp: new Date().toISOString(),
    });

    // オンラインになったら接続品質の定期チェックを開始
    if (connectionQualityTimerId === null) {
      connectionQualityTimerId = window.setInterval(
        checkConnectionQuality,
        60000
      ) as unknown as number;
      // 接続品質を即座に確認
      checkConnectionQuality();
    }
  };

  const handleOffline = () => {
    logger.warn('オフライン状態になりました。キャッシュからのデータ提供に切り替えます', {
      component: 'googleSheets',
      action: 'network_offline',
      timestamp: new Date().toISOString(),
    });

    // オフラインになったら接続品質チェックを停止
    if (connectionQualityTimerId !== null) {
      clearInterval(connectionQualityTimerId);
      connectionQualityTimerId = null;
    }
  };

  let connectionApi: NetworkConnection | undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    // 接続変更イベントを監視（サポートされている場合）
    connectionApi = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connectionApi && typeof connectionApi.addEventListener === 'function') {
      connectionApi.addEventListener('change', checkConnectionQuality);
    }
  } catch {
    // Connection APIが利用できない場合は何もしない
    logger.debug('Connection APIは利用できません', {
      component: 'googleSheets',
      action: 'connection_api_unavailable',
    });
  }

  // 初期状態のチェック
  if (navigator.onLine) {
    handleOnline();
  } else {
    handleOffline();
  }

  // イベントリスナーを登録
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);

    if (connectionQualityTimerId !== null) {
      clearInterval(connectionQualityTimerId);
    }

    if (connectionApi && typeof connectionApi.removeEventListener === 'function') {
      try {
        connectionApi.removeEventListener('change', checkConnectionQuality);
      } catch {
        // エラーを無視
      }
    }
  };
}
