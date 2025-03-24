import { useCallback, useState, useEffect } from 'react';
import { useGoogleMaps } from '@hooks/useGoogleMaps';
import { MapContainer } from '@components/map-container';
import { validateEnv } from '@utils/env';

/**
 * メインアプリケーションコンポーネント
 * 地図の表示と読み込み状態の管理を行います
 */
function App() {
  const [isMapElementReady, setIsMapElementReady] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);

  // 環境変数のバリデーション
  useEffect(() => {
    const isValid = validateEnv();
    if (!isValid) {
      setEnvError('必要な環境変数が設定されていません。管理者に連絡してください。');
    }
  }, []);

  // マップ要素がDOMに追加された時のコールバック
  const handleMapElementReady = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('App: マップ要素の準備完了コールバックが呼ばれました');
    }
    
    // 状態更新を確実に行う
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('App: isMapElementReady を true に更新します');
      }
      setIsMapElementReady(true);
    }, 0);
  }, []);

  // マップ読み込み完了時のコールバック
  const handleMapLoaded = useCallback((map: google.maps.Map) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('マップの初期化が完了しました', map);
    }
    // ここでマーカーの追加などの処理を行う
  }, []);

  // Google Mapsフック
  const { isLoaded, error } = useGoogleMaps({
    elementId: 'map',
    zoom: 11,
    onMapLoaded: handleMapLoaded,
    skipInit: !isMapElementReady,
    initTimeout: 15000
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('App再レンダリング:', { isMapElementReady });
  }

  // 表示すべきエラーの決定（環境変数エラーを優先）
  const displayError = envError || error;

  // ローディング UI とマップコンテナを両方表示
  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1>佐渡で食えっちゃ</h1>
      </header>

      <main>
        {/* マップコンテナは常に表示（環境変数エラーがない場合） */}
        {!envError && <MapContainer onMapElementReady={handleMapElementReady} />}
        
        {/* ローディング表示はオーバーレイとして表示 */}
        {!isLoaded && !displayError && (
          <div className='loading-overlay'>
            <div className='loading-spinner'></div>
            <p>地図を読み込んでいます...</p>
            {isMapElementReady ? <p>Google Maps APIを初期化中...</p> : <p>マップ要素を準備中...</p>}
          </div>
        )}
        
        {/* エラー表示 */}
        {displayError && (
          <div className='error-container'>
            <h2>エラーが発生しました</h2>
            <p>{displayError}</p>
            <button onClick={() => window.location.reload()}>再読み込み</button>
          </div>
        )}
      </main>

      <footer className='app-footer'>
        <p>&copy; {new Date().getFullYear()} 佐渡で食えっちゃ</p>
      </footer>
    </div>
  );
}

export default App;