import React from 'react';

/**
 * MapLoadingErrorコンポーネントのプロパティ
 */
interface MapLoadingErrorProps {
  /** エラーメッセージ */
  error: string;
  /** リトライ処理のコールバック関数 */
  onRetry?: () => void;
}

/**
 * Google Maps API読み込み失敗時のフォールバックコンポーネント
 * ユーザーに適切なエラー情報と代替手段を提供
 */
const MapLoadingError: React.FC<MapLoadingErrorProps> = ({ error, onRetry }) => {
  return (
    <div className='map-loading-error'>
      <h2>地図の読み込みに失敗しました</h2>
      <p className='error-message'>{error}</p>

      {onRetry && (
        <button onClick={onRetry} className='retry-button'>
          再試行
        </button>
      )}

      <div className='error-alternatives'>
        <p>代替手段:</p>
        <ul>
          <li>
            <a
              href='https://www.google.com/maps/search/?api=1&query=佐渡島'
              target='_blank'
              rel='noopener noreferrer'
            >
              Google Mapsで佐渡島を表示
            </a>
          </li>
          <li>
            <a href='#poi-list'>POI一覧を表示</a>
          </li>
        </ul>
      </div>

      <div className='error-help'>
        <p>問題が解決しない場合:</p>
        <ul>
          <li>インターネット接続を確認してください</li>
          <li>ブラウザのキャッシュをクリアしてみてください</li>
          <li>別のブラウザで試してみてください</li>
        </ul>
      </div>
    </div>
  );
};

export default MapLoadingError;
