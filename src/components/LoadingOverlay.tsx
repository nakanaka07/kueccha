import React, { useEffect } from 'react';

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
  // ロード状態の変更をログに記録
  useEffect(() => {
    logger.info('読み込み状態が変更されました', {
      isLoadingPOIs,
      isLoaded,
      isMapElementReady,
    });
  }, [isLoadingPOIs, isLoaded, isMapElementReady]);

  // マップ読み込み状態のメッセージを決定
  const getMapStatusMessage = () => {
    if (isLoaded) return null;

    return isMapElementReady ? (
      <p role='status'>Google Maps APIを初期化中...</p>
    ) : (
      <p role='status'>マップ要素を準備中...</p>
    );
  };

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
