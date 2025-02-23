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
  const { pois, isLoading, error, refetch, isLoaded } = useSheetData();
  const { searchResults, search } = useSearch(pois);
  const { isMapLoaded, mapInstance, selectedPoi, areaVisibility, currentLocation, showWarning, actions } =
    useAppState(pois);

  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const displayedPois = searchResults.length > 0 ? searchResults : pois;
  const isInitialLoading = isLoading || !isLoaded;

  // ローディング状態のログを追加
  useEffect(() => {
    console.log(
      'Loading state updated: isLoading =',
      isLoading,
      ', isLoaded =',
      isLoaded,
      ', isMapLoaded =',
      isMapLoaded,
    );
  }, [isLoading, isLoaded, isMapLoaded]);

  const [localSelectedPoi, setLocalSelectedPoi] = useState<Poi | null>(selectedPoi);
  const [localAreaVisibility, setLocalAreaVisibility] = useState<Record<AreaType, boolean>>(areaVisibility);
  const [localCurrentLocation, setLocalCurrentLocation] = useState<LatLngLiteral | null>(currentLocation);
  const [localShowWarning, setLocalShowWarning] = useState<boolean>(showWarning);

  useEffect(() => {
    console.log('Selected POI updated:', selectedPoi);
    setLocalSelectedPoi(selectedPoi);
  }, [selectedPoi]);

  useEffect(() => {
    console.log('Area visibility updated:', areaVisibility);
    setLocalAreaVisibility(areaVisibility);
  }, [areaVisibility]);

  useEffect(() => {
    console.log('Current location updated:', currentLocation);
    setLocalCurrentLocation(currentLocation);
  }, [currentLocation]);

  useEffect(() => {
    console.log('Show warning updated:', showWarning);
    setLocalShowWarning(showWarning);
  }, [showWarning]);

  // POIsデータの受け取りと表示に関するログを追加
  useEffect(() => {
    console.log('POIs data fetched:', pois);
  }, [pois]);

  // Mapのロード状態に関するログを追加
  useEffect(() => {
    console.log('Map load status:', {
      isMapLoaded,
      hasMapInstance: !!mapInstance,
    });
  }, [isMapLoaded, mapInstance]);

  useEffect(() => {
    console.log('Map loading status:', {
      isInitialLoading,
      isLoaded,
      isMapLoaded,
      hasMapInstance: !!mapInstance,
    });
  }, [isInitialLoading, isLoaded, isMapLoaded, mapInstance]);

  console.log('App component rendered with POIs:', pois);

  if (error) {
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
              console.log('Map loaded:', mapInstance);
              actions.handleMapLoad(mapInstance);
            }}
            setAreaVisibility={setLocalAreaVisibility}
            currentLocation={localCurrentLocation}
            setCurrentLocation={setLocalCurrentLocation}
            showWarning={localShowWarning}
            setShowWarning={setLocalShowWarning}
            setIsMapLoaded={actions.handleMapLoad} // この行を追加
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
              console.log('Search result clicked:', poi);
              actions.handleSearchResultClick(poi);
            }}
          />
          <FilterPanel
            pois={displayedPois}
            setSelectedPoi={setLocalSelectedPoi}
            setAreaVisibility={setLocalAreaVisibility}
            isFilterPanelOpen={true}
            onCloseClick={() => {
              console.log('Filter panel closed');
            }}
            localAreaVisibility={localAreaVisibility}
            setLocalAreaVisibility={setLocalAreaVisibility}
            currentLocation={localCurrentLocation}
            setCurrentLocation={setLocalCurrentLocation}
            setShowWarning={setLocalShowWarning}
          />
          <button
            onClick={() => {
              console.log('Refetch button clicked');
              refetch();
            }}
          >
            データを更新
          </button>
          <button
            onClick={() => {
              console.log('Feedback form button clicked');
              setIsFeedbackFormOpen(true);
            }}
          >
            フィードバックを送信
          </button>
          {isFeedbackFormOpen && (
            <FeedbackForm
              onClose={() => {
                console.log('Feedback form closed');
                setIsFeedbackFormOpen(false);
              }}
            />
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
