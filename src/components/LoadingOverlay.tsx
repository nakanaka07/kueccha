import React from 'react';

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
  // マップ読み込み状態のメッセージを決定
  const getMapStatusMessage = () => {
    if (isLoaded) return null;

    return isMapElementReady ? <p>Google Maps APIを初期化中...</p> : <p>マップ要素を準備中...</p>;
  };

  return (
    <div className='loading-overlay'>
      <div className='loading-spinner'></div>
      <p>地図とデータを読み込んでいます...</p>
      {isLoadingPOIs && <p>施設データを準備中...</p>}
      {getMapStatusMessage()}
    </div>
  );
};

export default LoadingOverlay;
