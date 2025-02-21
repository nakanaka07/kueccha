import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import FeedbackForm from './components/feedback/FeedbackForm';
import FilterPanel from './components/filterpanel/FilterPanel';
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu';
import LoadingFallback from './components/loadingfallback/LoadingFallback';
import Map from './components/map/Map';
import { useAppState } from './hooks/useAppState';
import useSearch from './hooks/useSearch';
import { useSheetData } from './hooks/useSheetData';
import { ERROR_MESSAGES } from './utils/constants';
import { Poi, AreaType, LatLngLiteral } from './utils/types';

const App: React.FC = () => {
  const { pois, isLoading, error, refetch } = useSheetData();
  const { searchResults, search } = useSearch(pois);
  const {
    isLoaded,
    isMapLoaded,
    selectedPoi,
    areaVisibility,
    currentLocation,
    showWarning,
    actions,
  } = useAppState(pois);

  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);

  const displayedPois = searchResults.length > 0 ? searchResults : pois;
  const isInitialLoading = isLoading || !isLoaded || !isMapLoaded;

  const [localSelectedPoi, setLocalSelectedPoi] = useState<Poi | null>(
    selectedPoi,
  );
  const [localAreaVisibility, setLocalAreaVisibility] =
    useState<Record<AreaType, boolean>>(areaVisibility);
  const [localCurrentLocation, setLocalCurrentLocation] =
    useState<LatLngLiteral | null>(currentLocation);
  const [localShowWarning, setLocalShowWarning] =
    useState<boolean>(showWarning);

  useEffect(() => {
    setLocalSelectedPoi(selectedPoi);
  }, [selectedPoi]);

  useEffect(() => {
    setLocalAreaVisibility(areaVisibility);
  }, [areaVisibility]);

  useEffect(() => {
    setLocalCurrentLocation(currentLocation);
  }, [currentLocation]);

  useEffect(() => {
    setLocalShowWarning(showWarning);
  }, [showWarning]);

  if (error) {
    return (
      <div className="error-message" role="alert">
        <p>エラーが発生しました: {error.message}</p>
        <p>再試行するには以下のボタンをクリックしてください。</p>
        <button onClick={refetch}>再試行</button>
      </div>
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
            onLoad={actions.handleMapLoad}
            setAreaVisibility={setLocalAreaVisibility}
            currentLocation={localCurrentLocation}
            setCurrentLocation={setLocalCurrentLocation}
            showWarning={localShowWarning}
            setShowWarning={setLocalShowWarning}
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
            handleSearchResultClick={actions.handleSearchResultClick}
          />
          <FilterPanel
            pois={displayedPois}
            setSelectedPoi={setLocalSelectedPoi}
            setAreaVisibility={setLocalAreaVisibility}
            isFilterPanelOpen={true} // フィルターパネルを開くための状態を追加
            onCloseClick={() => {}} // 閉じるボタンのハンドラーを追加
            localAreaVisibility={localAreaVisibility}
            setLocalAreaVisibility={setLocalAreaVisibility}
            currentLocation={localCurrentLocation}
            setCurrentLocation={setLocalCurrentLocation}
            setShowWarning={setLocalShowWarning}
          />
          <button onClick={refetch}>データを更新</button>
          <button onClick={() => setIsFeedbackFormOpen(true)}>
            フィードバックを送信
          </button>
          {isFeedbackFormOpen && (
            <FeedbackForm onClose={() => setIsFeedbackFormOpen(false)} />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

const root = createRoot(container);
root.render(<App />);
