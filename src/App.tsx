import { Suspense, useRef } from 'react';

import ErrorDisplay from '@/components/ErrorDisplay';
import LoadingState from '@/components/LoadingState';
import MapInitializer from '@/components/MapInitializer';
import MapMarkers from '@/components/MapMarkers';
import { useAppInitializer } from '@/hooks/useAppInitializer';
import { useLoadPOIData, usePOIStore } from '@/store/poiStore';

/**
 * メインアプリケーションコンポーネント
 *
 * 責任分離と最適化を施したバージョン：
 * - 環境初期化 (useAppInitializer)
 * - 地図表示 (MapInitializer)
 * - POIデータ管理 (Zustand Store)
 * - Suspenseによるローディング状態の改善
 */
function App() {
  // マップへの参照を保持
  const mapRef = useRef<google.maps.Map | null>(null);

  // アプリケーションの初期化処理（環境変数検証、ロガー設定）
  const { envError } = useAppInitializer();

  // Zustandから取得したPOI状態を利用
  const pois = usePOIStore(state => state.pois);
  const isLoading = usePOIStore(state => state.isLoading);
  const selectPOI = usePOIStore(state => state.selectPOI);
  const error = usePOIStore(state => state.error);

  // POIデータロードフック
  const { processPOIData } = useLoadPOIData(envError === null);

  // マップロード時のハンドラ
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    // マップが準備できたらPOIデータを処理
    processPOIData();
  };
  // --- エラー表示の処理 ---
  if (envError) {
    return <ErrorDisplay message={envError} />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  // --- レンダリング ---
  return (
    <div className='app-container'>
      {/* アプリケーションコンテンツ */}
      <div id='map' className='map-container' />

      {/* マップ初期化コンポーネント */}
      <MapInitializer onMapLoad={handleMapLoad} environmentError={envError} />

      {/* Suspenseを使用したコンテンツローディング */}
      <Suspense fallback={<LoadingState message='コンテンツを読み込み中...' />}>
        {/* マーカー表示 - Google Maps読み込み完了かつPOIデータがある場合のみ表示 */}
        {mapRef.current ? (
          isLoading ? (
            <LoadingState message='POIデータを読み込み中...' />
          ) : pois.length > 0 ? (
            <MapMarkers pois={pois} mapRef={mapRef} onSelectPOI={selectPOI} />
          ) : (
            <LoadingState message='表示するPOIデータがありません' />
          )
        ) : (
          <LoadingState message='地図を初期化中...' />
        )}
      </Suspense>
    </div>
  );
}

export default App;
