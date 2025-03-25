import { useCallback, useState, useEffect, useRef } from 'react';
import { useGoogleMaps } from '@hooks/useGoogleMaps';
import { usePOIData } from '@hooks/usePOIData';
import { MapContainer } from '@/components/MapContainer';
import POIDetails from '@/components/POIDetails';
import FilterPanel from '@/components/FilterPanel';
import MapMarkers from '@/components/MapMarkers';
import { PointOfInterest } from '@/types/poi';
import { validateEnv } from '@utils/env';

/**
 * メインアプリケーションコンポーネント
 * 地図の表示とPOIデータの管理を行います
 */
function App() {
  const [isMapElementReady, setIsMapElementReady] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [filteredPOIs, setFilteredPOIs] = useState<PointOfInterest[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

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
    mapRef.current = map;
  }, []);

  // POIデータの取得
  const {
    pois,
    isLoading: isLoadingPOIs,
    error: poisError,
  } = usePOIData({
    enabled: !envError,
  });

  // フィルタリングされたPOIの更新
  const handleFilterChange = useCallback((filtered: PointOfInterest[]) => {
    setFilteredPOIs(filtered);
  }, []);

  // POI詳細表示
  const handlePOISelect = useCallback((poi: PointOfInterest) => {
    setSelectedPOI(poi);
  }, []);

  // POI詳細を閉じる
  const handleClosePOIDetails = useCallback(() => {
    setSelectedPOI(null);
  }, []);

  // フィルタリング初期化
  useEffect(() => {
    setFilteredPOIs(pois);
  }, [pois]);

  // Google Mapsフック
  const { isLoaded, error } = useGoogleMaps({
    elementId: 'map',
    zoom: 11,
    onMapLoaded: handleMapLoaded,
    skipInit: !isMapElementReady,
    initTimeout: 15000,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('App再レンダリング:', { isMapElementReady, poisCount: pois.length });
  }

  // 表示すべきエラーの決定（環境変数エラーを優先）
  const displayError = envError || error || poisError;

  // ローディング状態の判定
  const isAppLoading = !isLoaded || isLoadingPOIs;

  // ローディング UI とマップコンテナを両方表示
  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1>佐渡で食えっちゃ</h1>
      </header>

      <main>
        {/* フィルターパネル */}
        {isLoaded && !displayError && (
          <FilterPanel pois={pois} onFilterChange={handleFilterChange} />
        )}

        {/* マップコンテナは常に表示（環境変数エラーがない場合） */}
        {!envError && <MapContainer onMapElementReady={handleMapElementReady} />}

        {/* マップにマーカーを追加 */}
        {isLoaded && mapRef.current && !displayError && filteredPOIs.length > 0 && (
          <MapMarkers
            pois={filteredPOIs}
            mapRef={mapRef}
            onSelectPOI={handlePOISelect}
            onViewDetails={handlePOISelect}
          />
        )}

        {/* POI詳細表示 */}
        {selectedPOI && <POIDetails poi={selectedPOI} onClose={handleClosePOIDetails} />}

        {/* ローディング表示はオーバーレイとして表示 */}
        {isAppLoading && !displayError && (
          <div className='loading-overlay'>
            <div className='loading-spinner'></div>
            <p>地図とデータを読み込んでいます...</p>
            {isLoadingPOIs ? <p>施設データを準備中...</p> : null}
            {!isLoaded ? (
              isMapElementReady ? (
                <p>Google Maps APIを初期化中...</p>
              ) : (
                <p>マップ要素を準備中...</p>
              )
            ) : null}
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
