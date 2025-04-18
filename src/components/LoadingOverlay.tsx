import React, { useEffect, useCallback } from 'react';

import { logger } from '@/utils/logger';

/**
 * ローディングオーバーレイのプロパティ
 * @property {boolean} isLoadingPOIs - 施設(POI)データをロード中かどうか
 * @property {boolean} isLoaded - 地図の読み込みが完了したかどうか
 * @property {boolean} isMapElementReady - マップ要素が準備完了したかどうか
 */
interface LoadingOverlayProps {
  isLoadingPOIs: boolean;
  isLoaded: boolean;
  isMapElementReady: boolean;
}

/**
 * アプリケーションのローディング状態を表示するオーバーレイコンポーネント
 * 地図読み込みの各ステージに応じたステータスメッセージを表示します
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoadingPOIs,
  isLoaded,
  isMapElementReady,
}) => {
  // マップ読み込み状態のメッセージを決定（useCallbackでメモ化）
  const getMapStatusMessage = useCallback(() => {
    if (isLoaded) return null;

    return isMapElementReady ? (
      <p role='status'>Google Maps APIを初期化中...</p>
    ) : (
      <p role='status'>マップ要素を準備中...</p>
    );
  }, [isLoaded, isMapElementReady]);

  // ロード状態の変更をログに記録（状態変更時）
  useEffect(() => {
    // デバッグ用に現在の状態を文字列で取得
    const getCurrentStateString = () => {
      if (isLoaded) return '読み込み完了';
      if (isLoadingPOIs) return 'POIデータ読み込み中';
      if (isMapElementReady) return 'Maps API初期化中';
      return 'マップ要素準備中';
    };

    // 状態変化をデバッグログに出力
    logger.debug('読み込み状態が変更されました', {
      component: 'LoadingOverlay',
      action: 'state_change',
      isLoadingPOIs,
      isLoaded,
      isMapElementReady,
      currentState: getCurrentStateString(),
      timestamp: new Date().toISOString(),
    });

    // 読み込み完了時はINFOレベルでログ出力
    if (isLoaded) {
      logger.info('マップとデータの読み込みが完了しました', {
        component: 'LoadingOverlay',
        action: 'loading_complete',
        loadTime: performance.now(),
      });
    }
    // 依存配列から logConfig と loadingStateString を削除
  }, [isLoadingPOIs, isLoaded, isMapElementReady]);

  return (
    <div className='loading-overlay' role='progressbar' aria-busy='true' aria-live='polite'>
      <div className='loading-spinner' aria-hidden='true'></div>
      <p role='status'>地図とデータを読み込んでいます...</p>
      {isLoadingPOIs && <p role='status'>施設データを準備中...</p>}
      {getMapStatusMessage()}
    </div>
  );
};

// React.memoを使用してパフォーマンスを最適化
export default React.memo(LoadingOverlay);
