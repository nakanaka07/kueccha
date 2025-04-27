/**
 * キャッシュクリアユーティリティ
 *
 * アプリケーションのローカルストレージとIndexedDBキャッシュを管理します。
 * セキュリティを考慮した設計と、エラー発生時の適切な処理を提供します。
 *
 * @author 佐渡で食えっちゃプロジェクトチーム
 * @version 1.2.0
 * @lastUpdate 2025年4月26日
 */

import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

import { getEnvVar } from '@/env/core';
import { logger } from '@/utils/logger';

// ストレージキー定数
const STORAGE_KEYS = {
  POI_DATA: 'kueccha_poi_data_cache',
  POI_DATA_TIMESTAMP: 'kueccha_poi_data_timestamp',
  FILTER_STATE: 'kueccha_filter_state',
  MAP_POSITION: 'kueccha_map_position',
  LAST_VIEW: 'kueccha_last_view',
  VERSION: 'kueccha_version',
};

// IndexedDBキャッシュ構成
const IDB_CONFIG = {
  DB_NAME: 'poi-cache-db',
  STORES: ['sheets', 'metadata'],
};

/**
 * アプリケーションキャッシュの状態情報を返す
 *
 * @returns キャッシュの状態情報を含むオブジェクト
 */
export function getCacheInfo(): {
  localStorage: { keys: string[]; size: number };
  indexedDB: { databases: string[] } | null;
  totalSize: string;
} {
  try {
    // ローカルストレージキャッシュ情報
    const localStorageKeys = Object.keys(localStorage);
    const appKeys = localStorageKeys.filter(
      key => key.startsWith('kueccha_') || key === 'lastPosition' || key === 'lastVisit'
    );

    let totalSize = 0;
    for (const key of appKeys) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += (key.length + item.length) * 2; // UTF-16エンコーディングでは1文字2バイト
      }
    }

    const sizeInKB = (totalSize / 1024).toFixed(2);

    // IndexedDB情報は非同期のためここでは基本情報のみ
    return {
      localStorage: {
        keys: appKeys,
        size: totalSize,
      },
      indexedDB: null, // 非同期のためnull
      totalSize: `${sizeInKB} KB`,
    };
  } catch (error) {
    logger.error('キャッシュ情報の取得中にエラーが発生しました', {
      component: 'CacheUtility',
      action: 'getCacheInfo',
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      localStorage: { keys: [], size: 0 },
      indexedDB: null,
      totalSize: '不明',
    };
  }
}

/**
 * POIデータのキャッシュをクリアする
 *
 * @returns クリアしたキーの数
 */
export function clearPOICache(): number {
  let count = 0;
  const removedKeys: string[] = [];

  try {
    // POIデータをクリア
    if (localStorage.getItem(STORAGE_KEYS.POI_DATA)) {
      localStorage.removeItem(STORAGE_KEYS.POI_DATA);
      removedKeys.push(STORAGE_KEYS.POI_DATA);
      count++;
    }

    // タイムスタンプをクリア
    if (localStorage.getItem(STORAGE_KEYS.POI_DATA_TIMESTAMP)) {
      localStorage.removeItem(STORAGE_KEYS.POI_DATA_TIMESTAMP);
      removedKeys.push(STORAGE_KEYS.POI_DATA_TIMESTAMP);
      count++;
    } // フィルター状態をクリア（オプション）
    const clearFilters =
      getEnvVar({ key: 'VITE_CLEAR_FILTERS_WITH_CACHE', required: false }) === 'true';
    if (clearFilters && localStorage.getItem(STORAGE_KEYS.FILTER_STATE)) {
      localStorage.removeItem(STORAGE_KEYS.FILTER_STATE);
      removedKeys.push(STORAGE_KEYS.FILTER_STATE);
      count++;
    }

    logger.info(`POIデータキャッシュをクリアしました`, {
      component: 'CacheUtility',
      action: 'clearPOICache',
      keysRemoved: count,
      keys: removedKeys,
    });

    // IndexedDBのPOIキャッシュもクリア（非同期）
    clearIndexedDBCache().catch(error => {
      logger.error('IndexedDBキャッシュのクリア中にエラーが発生しました', {
        component: 'CacheUtility',
        action: 'clearIndexedDBCache',
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return count;
  } catch (error) {
    logger.error('キャッシュクリア中にエラーが発生しました', {
      component: 'CacheUtility',
      action: 'clearPOICache',
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

/**
 * アプリケーション全体のキャッシュをクリア
 *
 * @param prefix キャッシュキーの接頭辞（指定した場合はそのキーのみクリア）
 * @returns クリアしたキーの数
 */
export function clearAllCache(prefix?: string): number {
  let count = 0;

  try {
    const keysToRemove: string[] = [];

    if (prefix) {
      // 指定した接頭辞のキーのみクリア
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      });
    } else {
      // すべてのアプリケーション関連キャッシュをクリア
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('kueccha_') || key === 'lastPosition' || key === 'lastVisit') {
          keysToRemove.push(key);
        }
      });
    }

    // 安全な削除処理
    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
        count++;
      } catch (removeError) {
        logger.warn(`キー "${key}" のクリアに失敗しました`, {
          component: 'CacheUtility',
          action: 'removeKey',
          key,
          error: removeError instanceof Error ? removeError.message : String(removeError),
        });
      }
    }

    // バージョン情報は保持
    try {
      const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
      localStorage.setItem(STORAGE_KEYS.VERSION, currentVersion);
    } catch (versionError) {
      logger.warn('バージョン情報の保存に失敗しました', {
        component: 'CacheUtility',
        action: 'saveVersion',
        error: versionError instanceof Error ? versionError.message : String(versionError),
      });
    }

    logger.info(`アプリケーションキャッシュをクリアしました`, {
      component: 'CacheUtility',
      action: 'clearAllCache',
      keysRemoved: count,
      prefix: prefix || 'すべて',
    });

    // IndexedDBのすべてのキャッシュもクリア（非同期）
    clearIndexedDBCache().catch(error => {
      logger.error('IndexedDBキャッシュのクリア中にエラーが発生しました', {
        component: 'CacheUtility',
        action: 'clearIndexedDBCache',
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return count;
  } catch (error) {
    logger.error('キャッシュクリア中にエラーが発生しました', {
      component: 'CacheUtility',
      action: 'clearAllCache',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return 0;
  }
}

/**
 * IndexedDBキャッシュをクリアする
 * @returns 成功時はtrue
 */
export async function clearIndexedDBCache(): Promise<boolean> {
  try {
    const db = await openDB(IDB_CONFIG.DB_NAME, 1, {
      upgrade(_db) {
        // データベースが存在しない場合、アップグレードコールバックが実行される
        logger.debug('IndexedDBデータベースが存在しません、クリア不要', {
          component: 'CacheUtility',
          action: 'clearIndexedDBCache_upgrade',
        });
      },
      blocked() {
        logger.warn('IndexedDBのクリア操作がブロックされています', {
          component: 'CacheUtility',
          action: 'clearIndexedDBCache_blocked',
        });
      },
    });

    // 各オブジェクトストアのクリア
    await clearIndexedDBStores(db);

    // 成功
    return true;
  } catch (error) {
    logger.error('IndexedDBキャッシュのクリア中にエラーが発生しました', {
      component: 'CacheUtility',
      action: 'clearIndexedDBCache',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * IndexedDBの各ストアをクリアする
 * @param db データベースインスタンス
 */
async function clearIndexedDBStores(db: IDBPDatabase<unknown>): Promise<void> {
  try {
    // 設定された各ストアをクリア
    for (const storeName of IDB_CONFIG.STORES) {
      if (db.objectStoreNames.contains(storeName)) {
        // トランザクション開始
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        // すべてのデータを削除
        await store.clear();
        await tx.done;

        logger.debug(`IndexedDB: "${storeName}" ストアをクリアしました`, {
          component: 'CacheUtility',
          action: 'clearStore',
          store: storeName,
        });
      }
    }
  } catch (error) {
    logger.error('IndexedDBストアのクリア中にエラーが発生しました', {
      component: 'CacheUtility',
      action: 'clearIndexedDBStores',
      error: error instanceof Error ? error.message : String(error),
    });
    // エラーを上位に伝播
    throw error;
  }
}

/**
 * 期限切れのキャッシュを削除する
 * @param maxAge 最大許容期間（ミリ秒）
 * @returns 削除されたキャッシュの数
 */
export function cleanupExpiredCache(maxAge: number = 24 * 60 * 60 * 1000): number {
  try {
    const now = Date.now();
    let removed = 0;
    const timestampKeys: string[] = [];

    // タイムスタンプキーを特定
    Object.keys(localStorage).forEach(key => {
      if (key.endsWith('_timestamp') && key.startsWith('kueccha_')) {
        timestampKeys.push(key);
      }
    });

    // 期限切れのキャッシュを削除
    for (const timestampKey of timestampKeys) {
      const timestamp = Number(localStorage.getItem(timestampKey)) || 0;
      if (now - timestamp > maxAge) {
        // タイムスタンプを削除
        localStorage.removeItem(timestampKey);

        // 対応するデータも削除
        const dataKey = timestampKey.replace('_timestamp', '');
        if (localStorage.getItem(dataKey)) {
          localStorage.removeItem(dataKey);
          removed++;
        }

        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`期限切れのキャッシュを${removed}件削除しました`, {
        component: 'CacheUtility',
        action: 'cleanupExpiredCache',
        removed,
        maxAgeHours: maxAge / (60 * 60 * 1000),
      });
    }

    return removed;
  } catch (error) {
    logger.error('期限切れキャッシュのクリーンアップ中にエラーが発生しました', {
      component: 'CacheUtility',
      action: 'cleanupExpiredCache',
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
