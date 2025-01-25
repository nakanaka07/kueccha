import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import LoadingFallback from './components/loadingfallback/LoadingFallback';
import Map from './components/map/Map';
import { ERROR_MESSAGES } from './utils/constants';
import type { Poi, AreaType } from './utils/types';
import { useSheetData } from './hooks/useSheetData';
import { INITIAL_VISIBILITY } from './components/filterpanel/FilterPanel';
import './App.css';

const App: React.FC = () => {
  const { pois } = useSheetData();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);

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

  const handleOpenFilterPanel = useCallback(() => {
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <div
          className={`initial-background ${isLoaded && isMapLoaded ? 'hidden' : ''}`}
        />
        <div className="map-container">
          <Map
            pois={pois}
            selectedPoi={selectedPoi}
            setSelectedPoi={setSelectedPoi}
            areaVisibility={areaVisibility}
            onLoad={handleMapLoad}
            setAreaVisibility={setAreaVisibility}
            handleOpenFilterPanel={handleOpenFilterPanel}
          />
        </div>
        {!isLoaded ? (
          <LoadingFallback isLoading={true} isLoaded={isLoaded} />
        ) : (
          <Suspense
            fallback={<LoadingFallback isLoading={true} isLoaded={isLoaded} />}
          >
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
