import { useCallback, useState, useEffect, useRef, useMemo } from 'react';

import ErrorDisplay from '@/components/ErrorDisplay';
import FilterPanel from '@/components/FilterPanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import { MapContainer } from '@/components/MapContainer';
import MapMarkers from '@/components/MapMarkers';
import POIDetails from '@/components/POIDetails';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { usePOIData } from '@/hooks/usePOIData';
import type { PointOfInterest } from '@/types/poi';
import { validateEnv } from '@/utils/env';

/**
 * メインアプリケーションコンポーネント
 * 地図の表示とPOIデータの管理を行います
 */
function App() {
  // アプリケーションの状態管理
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
    // 状態更新を確実に行う
    setTimeout(() => {
      setIsMapElementReady(true);
    }, 0);
  }, []);

  // マップ読み込み完了時のコールバック
  const handleMapLoaded = useCallback((map: google.maps.Map) => {
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

  // 表示すべきエラーの決定（環境変数エラーを優先）
  const displayError = envError ?? error ?? poisError;

  // ローディング状態の判定
  const isAppLoading = !isLoaded || isLoadingPOIs;

  // 条件判定のメモ化（パフォーマンスと可読性の向上）
  const shouldShowFilters = useMemo(() => 
    isLoaded && !displayError
  , [isLoaded, displayError]);
  
  // マップマーカー表示の条件判定
  const shouldShowMarkers = useMemo(() => 
    isLoaded && 
    !displayError && 
    filteredPOIs.length > 0
  , [isLoaded, displayError, filteredPOIs.length]);

  // マップが実際に利用可能かどうかを確認
  const isMapAvailable = shouldShowMarkers && mapRef.current !== null;

  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1>佐渡で食えっちゃ</h1>
      </header>

      <main>
        {/* フィルターパネル */}
        {shouldShowFilters && (
          <FilterPanel pois={pois} onFilterChange={handleFilterChange} />
        )}

        {/* マップコンテナは常に表示（環境変数エラーがない場合） */}
        {!envError && <MapContainer onMapElementReady={handleMapElementReady} />}

        {/* マップにマーカーを追加 */}
        {isMapAvailable && (
          <MapMarkers
            pois={filteredPOIs}
            mapRef={mapRef}
            onSelectPOI={handlePOISelect}
            onViewDetails={handlePOISelect}
          />
        )}

        {/* POI詳細表示 */}
        {selectedPOI && <POIDetails poi={selectedPOI} onClose={handleClosePOIDetails} />}

        {/* ローディング表示 */}
        {isAppLoading && !displayError && (
          <LoadingOverlay
            isLoadingPOIs={isLoadingPOIs}
            isLoaded={isLoaded}
            isMapElementReady={isMapElementReady}
          />
        )}

        {/* エラー表示 */}
        {displayError && <ErrorDisplay message={displayError} />}
      </main>

      <footer className='app-footer'>
        <p>&copy; {new Date().getFullYear()} 佐渡で食えっちゃ</p>
      </footer>
    </div>
  );
}

export default App;