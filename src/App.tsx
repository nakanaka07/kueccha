import { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

/**
 * メインアプリケーションコンポーネント
 *
 * 機能:
 * - Google Maps APIのロード
 * - POIデータの取得と表示
 * - マーカークラスタリング
 * - 現在地表示
 */
function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アプリ初期化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Google Maps APIのロード
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
          version: 'weekly',
          mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''],
        });

        await loader.load();
        setLoading(false);

        // 地図の初期化とPOIデータの取得は別のカスタムフックに分離予定
      } catch (err) {
        console.error('アプリケーションの初期化に失敗しました', err);
        setError('地図の読み込みに失敗しました。ネットワーク接続を確認してください。');
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // ローディング表示
  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>地図を読み込んでいます...</p>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className='error-container'>
        <h2>エラーが発生しました</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>再読み込み</button>
      </div>
    );
  }

  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1>佐渡で食えっちゃ</h1>
      </header>

      <main>
        <div id='map' className='map-container'></div>
      </main>

      <footer className='app-footer'>
        <p>&copy; 2023-2024 佐渡で食えっちゃ</p>
      </footer>
    </div>
  );
}

export default App;
