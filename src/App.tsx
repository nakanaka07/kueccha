import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import { INITIAL_VISIBILITY } from './components/filterpanel/FilterPanel';
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu';
import LoadingFallback from './components/loadingfallback/LoadingFallback';
import Map from './components/map/Map';
import useSearch from './hooks/useSearch';
import { useSheetData } from './hooks/useSheetData';
import { ERROR_MESSAGES } from './utils/constants';
import { Poi, AreaType, LatLngLiteral } from './utils/types';

const App: React.FC = () => {
  // Appコンポーネントの定義
  const { pois, isLoading, error, refetch } = useSheetData(); // カスタムフックからデータを取得
  const { searchResults, search } = useSearch(pois); // 検索用のカスタムフックを使用
  const [isLoaded, setIsLoaded] = useState(false); // ロード状態を管理するステート
  const [isMapLoaded, setIsMapLoaded] = useState(false); // マップのロード状態を管理するステート
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null); // 選択されたPOIを管理するステート
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY); // エリアの表示状態を管理するステート
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(
    null,
  ); // 現在の位置を管理するステート
  const [showWarning, setShowWarning] = useState(false); // 警告表示を管理するステート

  useEffect(() => {
    // コンポーネントのマウント時に実行
    const timer = setTimeout(() => {
      setIsLoaded(true); // 3秒後にロード完了とする
    }, 3000);
    return () => clearTimeout(timer); // クリーンアップ
  }, []);

  useEffect(() => {
    // isLoadedまたはisMapLoadedが変わったときに実行
    if (isLoaded && isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background');
      if (backgroundElement) {
        setTimeout(() => {
          backgroundElement.classList.add('hidden'); // 5秒後に背景を隠す
        }, 5000);
      }
    }
  }, [isLoaded, isMapLoaded]);

  useEffect(() => {
    // コンポーネントのマウント時に実行
    setSelectedPoi(null); // 選択されたPOIをリセット
  }, []);

  const handleMapLoad = useCallback(() => {
    // マップのロード完了時に実行
    setIsMapLoaded(true); // マップのロード状態を更新
  }, []);

  const handleSearchResultClick = (poi: Poi) => {
    // 検索結果クリック時に実行
    setSelectedPoi(poi); // 選択されたPOIを更新
  };

  const displayedPois = searchResults.length > 0 ? searchResults : pois; // 表示するPOIを決定

  if (error) {
    // エラーが発生した場合の表示
    return <div>エラーが発生しました: {error.message}</div>;
  }

  if (isLoading) {
    // ローディング中の表示
    return <LoadingFallback isLoading={true} isLoaded={false} />;
  }

  return (
    // メインのレンダリング
    <div className="app">
      <ErrorBoundary
        fallback={
          <LoadingFallback
            isLoading={!isLoaded || !isMapLoaded}
            isLoaded={isLoaded && isMapLoaded}
          />
        }
      >
        <div className="app-container">
          <div
            className={`initial-background ${isLoaded && isMapLoaded ? 'hidden' : ''}`}
          />
          <LoadingFallback
            isLoading={!isLoaded || !isMapLoaded}
            isLoaded={isLoaded && isMapLoaded}
          />
          <div className="map-container">
            <Map
              pois={displayedPois}
              selectedPoi={selectedPoi}
              setSelectedPoi={setSelectedPoi}
              areaVisibility={areaVisibility}
              onLoad={handleMapLoad}
              setAreaVisibility={setAreaVisibility}
              currentLocation={currentLocation}
              setCurrentLocation={setCurrentLocation}
              showWarning={showWarning}
              setShowWarning={setShowWarning}
            />
          </div>
          <HamburgerMenu
            pois={displayedPois}
            setSelectedPoi={setSelectedPoi}
            setAreaVisibility={setAreaVisibility}
            localAreaVisibility={areaVisibility}
            setLocalAreaVisibility={setAreaVisibility}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            setShowWarning={setShowWarning}
            search={search}
            searchResults={searchResults}
            handleSearchResultClick={handleSearchResultClick}
          />
          <button onClick={refetch}>データを更新</button>{' '}
          {/* データ再取得ボタン */}
        </div>
      </ErrorBoundary>
    </div>
  );
};

const container = document.getElementById('app'); // ルートコンテナを取得
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND); // コンテナが見つからない場合のエラーハンドリング

const root = createRoot(container); // ルートを作成
root.render(<App />); // Appコンポーネントをレンダリング
