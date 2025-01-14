import React, { useState, useEffect, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import LoadingFallback from './components/loadingfallback/LoadingFallback';
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu';
import Map from './components/map/Map';
import FilterPanel, { INITIAL_VISIBILITY } from './components/filterpanel/FilterPanel'; // FilterPanelをインポート
import { ERROR_MESSAGES } from './utils/constants';
import type { Poi, AreaType } from './utils/types';
import { useSheetData } from './hooks/useSheetData';
import './App.css';

const App: React.FC = () => {
  const { pois } = useSheetData();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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
        backgroundElement.classList.add('hidden');
      }
    }
  }, [isLoaded, isMapLoaded]);

  const handleOpenFilterPanel = () => {
    setIsFilterPanelOpen(true);
  };

  const handleCloseFilterPanel = () => {
    setIsFilterPanelOpen(false);
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        <div className={`initial-background ${isLoaded && isMapLoaded ? 'hidden' : ''}`} />
        {!isLoaded ? (
          <LoadingFallback isLoading={true} isLoaded={isLoaded} />
        ) : (
          <Suspense fallback={<LoadingFallback isLoading={true} isLoaded={isLoaded} />}>
            <HamburgerMenu
              pois={pois}
              setSelectedPoi={setSelectedPoi}
              setAreaVisibility={setAreaVisibility}
              onOpenFilterPanel={handleOpenFilterPanel}
            />
            <div className="map-container">
              <Map
                pois={pois}
                selectedPoi={selectedPoi}
                setSelectedPoi={setSelectedPoi}
                areaVisibility={areaVisibility}
                onLoad={() => {
                  setIsMapLoaded(true);
                }}
                onCloseFilterPanel={handleCloseFilterPanel} // フィルターパネルを閉じる関数を渡す
              />
              {isFilterPanelOpen && (
                <FilterPanel
                  pois={pois}
                  setSelectedPoi={setSelectedPoi}
                  setAreaVisibility={setAreaVisibility}
                  isFilterPanelOpen={isFilterPanelOpen}
                  onCloseClick={handleCloseFilterPanel} // フィルターパネルを閉じる関数を渡す
                />
              )}
            </div>
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
