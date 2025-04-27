import { useState, useEffect, useMemo, useCallback } from 'react';

import { logger } from '@/utils/logger';

/**
 * コンポーネント名の定数
 * @constant {string}
 */
const COMPONENT_NAME = 'useNetworkState';

/**
 * NetworkInformation APIの型定義
 * @see https://developer.mozilla.org/ja/docs/Web/API/NetworkInformation
 */
interface NetworkInformation {
  readonly effectiveType: string;
  readonly type: string;
  readonly downlink: number;
  readonly downlinkMax: number;
  readonly rtt: number;
  readonly saveData: boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

// グローバルに型を拡張
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

/**
 * ネットワーク状態の戻り値の型定義
 * @typedef {Object} NetworkState
 * @property {boolean} isOnline - オンライン状態であるかどうか
 * @property {boolean} isOfflineSupported - オフラインサポートがあるかどうか
 * @property {string | null} connectionType - 接続タイプ (接続情報が取得できる場合のみ)
 */
export interface NetworkState {
  isOnline: boolean;
  isOfflineSupported: boolean;
  connectionType: string | null;
}

/**
 * ネットワーク状態を監視するカスタムフック
 * オンライン/オフライン状態の変化を検知して返します
 *
 * @returns {NetworkState} 現在のネットワーク状態情報
 *
 * @example
 * ```tsx
 * const { isOnline, isOfflineSupported, connectionType } = useNetworkState();
 *
 * return (
 *   <div>
 *     <p>ネットワーク状態: {isOnline ? 'オンライン' : 'オフライン'}</p>
 *     {!isOnline && <p>オフラインサポート: {isOfflineSupported ? '有効' : '無効'}</p>}
 *     {connectionType && <p>接続タイプ: {connectionType}</p>}
 *   </div>
 * );
 * ```
 */
export function useNetworkState(): NetworkState {
  // ブラウザAPIの利用可能状態を確認し、メモ化
  const networkInfo = useMemo(() => {
    const isNavigatorDefined = typeof navigator !== 'undefined';
    return {
      isNetworkAPIAvailable: isNavigatorDefined && 'onLine' in navigator,
      hasConnectionAPI: isNavigatorDefined && 'connection' in navigator,
      connection: isNavigatorDefined && 'connection' in navigator ? navigator.connection : null,
    };
  }, []);

  const { isNetworkAPIAvailable, hasConnectionAPI, connection } = networkInfo;

  // 初期状態はナビゲーターから取得するか、利用できない場合はtrueにフォールバック
  const [isOnline, setIsOnline] = useState<boolean>(
    isNetworkAPIAvailable ? navigator.onLine : true
  );

  // オフラインサポート状態 (サービスワーカー登録確認)
  const [isOfflineSupported] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  });

  // 接続タイプの状態管理 (Connection APIがサポートされている場合のみ)
  const [connectionType, setConnectionType] = useState<string | null>(() => {
    return connection ? connection.effectiveType || connection.type || null : null;
  });

  // オンライン状態の変化をリッスンするハンドラをメモ化
  const handleOnline = useCallback(() => {
    logger.info('ネットワーク接続が回復しました', {
      component: COMPONENT_NAME,
      connectionType: connectionType || 'unknown',
    });
    setIsOnline(true);
  }, [connectionType]);

  // オフライン状態の変化をリッスンするハンドラをメモ化
  const handleOffline = useCallback(() => {
    logger.warn('ネットワーク接続が失われました', {
      component: COMPONENT_NAME,
      offlineSupport: isOfflineSupported ? 'enabled' : 'disabled',
    });
    setIsOnline(false);
  }, [isOfflineSupported]);

  // 接続タイプの変化をリッスンするハンドラをメモ化
  const handleConnectionChange = useCallback(() => {
    if (connection) {
      const newType = connection.effectiveType || connection.type || null;
      setConnectionType(newType);

      logger.debug('接続タイプが変更されました', {
        component: COMPONENT_NAME,
        previousType: connectionType,
        newType,
      });
    }
  }, [connection, connectionType]);

  useEffect(() => {
    // ブラウザAPIが利用できない場合は常にオンラインとみなす
    if (!isNetworkAPIAvailable) {
      logger.warn('ネットワーク状態APIが利用できません。常にオンラインとみなします', {
        component: COMPONENT_NAME,
      });
      return;
    }

    // イベントリスナーを設定
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection APIがサポートされている場合は接続変更イベントもリッスン
    if (hasConnectionAPI && connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // 最初に接続チェックを実行して、現在の状態を再確認（初回のみ）
    const initialOnlineStatus = navigator.onLine;
    if (isOnline !== initialOnlineStatus) {
      setIsOnline(initialOnlineStatus);
      logger.debug('初期ネットワーク状態を検出', {
        component: COMPONENT_NAME,
        isOnline: initialOnlineStatus,
      });
    }

    // クリーンアップ関数
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (hasConnectionAPI && connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [
    isNetworkAPIAvailable,
    hasConnectionAPI,
    connection,
    handleOnline,
    handleOffline,
    handleConnectionChange,
    isOnline,
  ]);

  return {
    isOnline,
    isOfflineSupported,
    connectionType,
  };
}
