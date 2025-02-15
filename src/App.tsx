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
  const { pois, isLoading, error, refetch } = useSheetData();
  const { searchResults, search } = useSearch(pois);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(
    null,
  );
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background');
      if (backgroundElement) {
        setTimeout(() => {
          backgroundElement.classList.add('hidden');
        }, 5000);
      }
    }
  }, [isLoaded, isMapLoaded]);

  useEffect(() => {
    setSelectedPoi(null);
  }, []);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  const handleSearchResultClick = (poi: Poi) => {
    setSelectedPoi(poi);
  };

  const displayedPois = searchResults.length > 0 ? searchResults : pois;

  if (error) {
    return <div>エラーが発生しました: {error.message}</div>;
  }

  if (isLoading) {
    return <LoadingFallback isLoading={true} isLoaded={false} />;
  }

  return (
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
          <button onClick={refetch}>データを更新</button>
        </div>
      </ErrorBoundary>
    </div>
  );
};

const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

const root = createRoot(container);
root.render(<App />);
