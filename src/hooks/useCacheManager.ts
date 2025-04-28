import { useEffect, useCallback } from 'react';

import { getEnvVar } from '@/env/core';
import { logger } from '@/utils/logger';

/**
 * キャッシュマネージャーのオプション型定義
 */
export interface CacheManagerOptions {
  /** キャッシュクリア後に実行するコールバック関数 */
  onCacheCleared?: (clearedCount: number) => void;
  /** キャッシュクリア結果をユーザーに通知するかどうか */
  notifyUser?: boolean;
  /** オフラインモードでのキャッシュ処理戦略 */
  offlineStrategy?: 'skip' | 'force' | 'default';
  /** 静的ホスティング環境でのキャッシュ有効期限（時間単位、デフォルト24時間） */
  staticHostingCacheTTL?: number;
}

/**
 * キャッシュ操作結果の型定義
 */
export interface CacheOperationResult {
  /** 操作が成功したかどうか */
  success: boolean;
  /** クリアされたキャッシュエントリの数 */
  clearedCount?: number;
  /** エラーメッセージ（失敗時） */
  errorMessage?: string;
}

/**
 * アプリケーション起動時のキャッシュクリア処理を管理するカスタムフック
 *
 * 条件に応じてPOIキャッシュをクリアし、パフォーマンスと最新データの
 * バランスを保つための機能を提供
 *
 * @param options - キャッシュ管理のオプション設定
 * @returns キャッシュ操作に関する関数と状態
 */
export const useCacheManager = (options?: CacheManagerOptions) => {
  // オプションのデフォルト値設定
  const { onCacheCleared, notifyUser = false, offlineStrategy = 'default' } = options || {};

  /**
   * キャッシュをクリアする条件を評価
   * 環境変数や開発モード、URLパラメータ、ネットワーク状態に基づいて判定
   */
  const shouldClearCache = useCallback(() => {
    // オフライン状態の確認
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    // オフラインの場合はストラテジーに基づいて処理
    if (isOffline) {
      switch (offlineStrategy) {
        case 'skip':
          return false;
        case 'force':
          return true;
        // デフォルトはオンライン時と同様の条件で判断
      }
    }

    // 静的ホスティング環境かどうかを検出
    const isStaticHosting =
      getEnvVar({ key: 'VITE_STATIC_HOSTING', defaultValue: 'false' }) === 'true' ||
      (typeof window !== 'undefined' &&
        (window.location.hostname.includes('github.io') ||
          window.location.hostname.includes('netlify.app') ||
          window.location.hostname.includes('vercel.app')));

    // 静的ホスティング環境の場合はキャッシュの有効期限（TTL）を考慮
    if (isStaticHosting) {
      // キャッシュの最終更新日時をローカルストレージから取得
      const lastCacheClear = localStorage.getItem('sadoPOI_lastCacheClear');
      if (lastCacheClear) {
        const lastClearTime = new Date(lastCacheClear).getTime();
        const currentTime = Date.now();
        const hours = (currentTime - lastClearTime) / (1000 * 60 * 60);

        // TTL（デフォルト24時間）を超えている場合はキャッシュをクリア
        const cacheTTL = options?.staticHostingCacheTTL || 24;
        if (hours > cacheTTL) {
          logger.debug('キャッシュTTL期限切れのため更新します', {
            component: 'CacheManager',
            hours,
            cacheTTL,
            lastClear: new Date(lastClearTime).toISOString(),
          });
          return true;
        }
        return false;
      }
      // 初回アクセス時はキャッシュクリアを実行
      return true;
    }

    // 環境変数からキャッシュクリアの設定を取得
    const clearCacheFromEnv =
      getEnvVar({
        key: 'VITE_CLEAR_CACHE_ON_START',
        defaultValue: 'false',
      }) === 'true';

    // 開発モードでの強制クリアパラメータをチェック
    const forceClearFromURL =
      import.meta.env.DEV && window.location.search.includes('force_clear_cache');

    return clearCacheFromEnv || forceClearFromURL;
  }, [offlineStrategy, options?.staticHostingCacheTTL]); // 依存配列を更新

  /**
   * キャッシュクリア処理を実行
   * 必要な場合のみ動的にモジュールをインポートして実行
   *
   * @returns キャッシュ操作結果のPromise
   */
  const executeCacheClear = useCallback(async (): Promise<CacheOperationResult | undefined> => {
    if (!shouldClearCache()) return;

    const operationStart = performance.now();
    const timestamp = new Date().toISOString();
    const networkStatus = navigator.onLine ? 'online' : 'offline';

    try {
      // キャッシュクリアモジュールを動的にインポート
      const { clearPOICache } = await import('@/utils/clearCache');
      const clearedCount = clearPOICache();

      const result: CacheOperationResult = {
        success: true,
        clearedCount,
      };

      // パフォーマンスメトリクス
      const operationTime = Math.round(performance.now() - operationStart);

      // 最終キャッシュクリア時刻を記録（静的ホスティング向けTTL管理用）
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sadoPOI_lastCacheClear', new Date().toISOString());
      }

      logger.info('アプリ起動時にキャッシュをクリアしました', {
        clearedCount,
        networkStatus,
        operationTime,
        component: 'CacheManager',
        timestamp,
      });

      // ユーザー通知が有効な場合
      if (notifyUser && typeof window !== 'undefined') {
        // ネイティブのNotificationがサポートされていれば使用
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('キャッシュを更新しました', {
            body: `${clearedCount}件のPOIデータをリフレッシュしました。`,
          });
        } else {
          // アプリ固有の通知UIがあればここで呼び出し
          // 例: showToast(`${clearedCount}件のキャッシュをクリアしました`);
        }
      }

      // コールバック関数が提供されていれば実行
      if (onCacheCleared && typeof onCacheCleared === 'function') {
        onCacheCleared(clearedCount);
      }

      return result;
    } catch (error) {
      // エラー情報の詳細化
      const isError = error instanceof Error;
      const errorMsg = isError
        ? `キャッシュクリア処理でエラーが発生: ${error.message}`
        : 'キャッシュクリアモジュールの読み込みに失敗';

      // anyを避けるためのカスタム型ガード関数
      const hasErrorCode = (err: unknown): err is { code: string } =>
        typeof err === 'object' && err !== null && 'code' in err;

      const errorCode = hasErrorCode(error) ? error.code : 'UNKNOWN_ERROR';
      const errorType = isError ? error.constructor.name : typeof error;

      const result: CacheOperationResult = {
        success: false,
        errorMessage: errorMsg,
      };

      logger.error(errorMsg, {
        error,
        errorCode,
        errorType,
        networkStatus,
        component: 'CacheManager',
        stack: isError ? error.stack : undefined,
        timestamp,
      });

      return result;
    }
  }, [shouldClearCache, notifyUser, onCacheCleared]); // 依存配列の最適化

  // コンポーネントのマウント時にキャッシュクリア処理を実行
  useEffect(() => {
    executeCacheClear();
  }, [executeCacheClear]);

  // 手動でキャッシュをクリアするための関数を提供
  return {
    executeCacheClear,
    // キャッシュ関連の追加機能を将来拡張できるように返り値のオブジェクト構造を採用
  };
};
