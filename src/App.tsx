/**
 * App.tsx
 * このファイルはアプリケーションのメインエントリーポイントです。
 * 主な機能：
 * - アプリケーション全体の状態管理
 * - コンポーネントの組み立てとレンダリング
 * - エラー処理とローディング状態の管理
 * - ユーザーインタラクションのハンドリング
 */

// 基本的なReactの機能とフックをインポート（コンポーネントの作成と状態管理に必要）
import React, { useState } from 'react';
// React 19のクライアントサイドレンダリング用APIをインポート
import { createRoot } from 'react-dom/client';
// グローバルスタイルの適用
import './App.css';
// 各種コンポーネントのインポート
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import FeedbackForm from './components/feedback/FeedbackForm';
import FilterPanel from './components/filterpanel/FilterPanel';
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu';
import LoadingFallback from './components/loadingfallback/LoadingFallback';
import Map from './components/map/Map';
import { useAppState } from './hooks/useAppState';
import useSearch from './hooks/useSearch';
import { useSheetData } from './hooks/useSheetData';
import { useSyncState } from './hooks/useSyncState';
import { ERROR_MESSAGES } from './utils/constants';

// メインのAppコンポーネント
const App: React.FC = () => {
  const { pois, isLoading, error, refetch, isLoaded } = useSheetData();
  const { searchResults, search } = useSearch(pois);
  const {
    selectedPoi,
    areaVisibility,
    setAreaVisibility,
    currentLocation,
    setCurrentLocation,
    showWarning,
    setShowWarning,
    actions,
  } = useAppState(pois);

  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const displayedPois = searchResults.length > 0 ? searchResults : pois;
  const isInitialLoading = isLoading || !isLoaded;
  const [localSelectedPoi, setLocalSelectedPoi] = useSyncState(selectedPoi, actions.setSelectedPoi);
  const [localAreaVisibility, setLocalAreaVisibility] = useSyncState(areaVisibility, setAreaVisibility);
  const [localCurrentLocation, setLocalCurrentLocation] = useSyncState(currentLocation, setCurrentLocation);
  const [localShowWarning, setLocalShowWarning] = useSyncState(showWarning, setShowWarning);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

  const handleFilterPanelClose = () => {
    setIsFilterPanelOpen(false);
  };

  if (error) {
    console.error(error);
    return (
      <ErrorBoundary>
        <div>Error: {error.message}</div>
        <button onClick={refetch}>Retry</button>
      </ErrorBoundary>
    );
  }

  if (isInitialLoading) {
    return (
      <LoadingFallback
        isLoading={isInitialLoading}
        isLoaded={!isInitialLoading}
        message="データをロードしています。しばらくお待ちください。"
      />
    );
  }

  return (
    <div className="app">
      <ErrorBoundary>
        <div className="app-container">
          <Map
            pois={displayedPois}
            selectedPoi={localSelectedPoi}
            setSelectedPoi={setLocalSelectedPoi}
            areaVisibility={localAreaVisibility}
            onLoad={(mapInstance) => {
              actions.handleMapLoad(mapInstance);
            }}
            setAreaVisibility={setLocalAreaVisibility}
            currentLocation={localCurrentLocation}
            setCurrentLocation={setLocalCurrentLocation}
            showWarning={localShowWarning}
            setShowWarning={setLocalShowWarning}
            setIsMapLoaded={actions.handleMapLoad}
          />
          <HamburgerMenu
            pois={displayedPois}
            setSelectedPoi={setLocalSelectedPoi}
            setAreaVisibility={setLocalAreaVisibility}
            localAreaVisibility={localAreaVisibility}
            setLocalAreaVisibility={setLocalAreaVisibility}
            currentLocation={localCurrentLocation}
            setCurrentLocation={setLocalCurrentLocation}
            setShowWarning={setLocalShowWarning}
            search={search}
            searchResults={searchResults}
            handleSearchResultClick={(poi) => {
              actions.handleSearchResultClick(poi);
            }}
          />
          <FilterPanel
            pois={displayedPois}
            setSelectedPoi={setLocalSelectedPoi}
            setAreaVisibility={setLocalAreaVisibility}
            isFilterPanelOpen={isFilterPanelOpen}
            onCloseClick={handleFilterPanelClose}
            localAreaVisibility={localAreaVisibility}
            setLocalAreaVisibility={setLocalAreaVisibility}
            currentLocation={localCurrentLocation}
            setCurrentLocation={setLocalCurrentLocation}
            setShowWarning={setLocalShowWarning}
          />
          <button onClick={refetch}>データを更新</button>
          <button onClick={() => setIsFeedbackFormOpen(true)}>フィードバックを送信</button>
          {isFeedbackFormOpen && <FeedbackForm onClose={() => setIsFeedbackFormOpen(false)} />}
        </div>
      </ErrorBoundary>
    </div>
  );
};

const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

const root = createRoot(container);
root.render(<App />);
