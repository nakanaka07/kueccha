import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import LoadingFallback from './components/loadingfallback/LoadingFallback';
import Map from './components/map/Map';
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu';
import { ERROR_MESSAGES } from './utils/constants';
import { useSheetData } from './hooks/useSheetData';
import { INITIAL_VISIBILITY } from './components/filterpanel/FilterPanel';
import { Poi, AreaType, LatLngLiteral } from './utils/types';
import './App.css';

const App: React.FC = () => {
  const { pois } = useSheetData();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background');
      if (backgroundElement) {
        setTimeout(() => {
          backgroundElement.classList.add('hidden');
        }, 2000);
      }
    }
  }, [isLoaded, isMapLoaded]);

  useEffect(() => {
    setSelectedPoi(null);
  }, []);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <div className={`initial-background ${isLoaded && isMapLoaded ? 'hidden' : ''}`} />
        <div className="map-container">
          <Map
            pois={pois}
            selectedPoi={selectedPoi}
            setSelectedPoi={setSelectedPoi}
            areaVisibility={areaVisibility}
            onLoad={handleMapLoad}
            setAreaVisibility={setAreaVisibility}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation} // 追加
          />
        </div>
        <HamburgerMenu
          pois={pois}
          setSelectedPoi={setSelectedPoi}
          setAreaVisibility={setAreaVisibility}
          localAreaVisibility={areaVisibility}
          setLocalAreaVisibility={setAreaVisibility}
          setCurrentLocation={setCurrentLocation}
        />
        {!isLoaded ? (
          <LoadingFallback isLoading={true} isLoaded={isLoaded} />
        ) : (
          <Suspense fallback={<LoadingFallback isLoading={true} isLoaded={isLoaded} />}>
            {/* 他のコンポーネント */}
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

const root = createRoot(container);
root.render(<App />);
