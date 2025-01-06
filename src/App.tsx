import React, { useState, useEffect, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import type { AreaType, Poi } from './types';
import { AREAS, ERROR_MESSAGES } from './constants';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingFallback } from './components/common/LoadingFallback';
import { useSheetData } from './hooks/useSheetData';
import UserGuide from './components/userGuide/UserGuide';
import FeedbackForm from './components/feedback/FeedbackForm';
import './App.css';

const Map = lazy(() => import('./components/map/Map'));
const FilterPanel = lazy(() => import('./components/map/FilterPanel'));

const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING',
  }),
  {} as Record<AreaType, boolean>,
);

const App: React.FC = () => {
  const { pois, isLoading, error, refetch } = useSheetData();
  const [areaVisibility, setAreaVisibility] = useState(INITIAL_VISIBILITY);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const filteredPois = pois?.filter((poi) => areaVisibility[poi.area]) || [];
  const areaCounts = filteredPois.reduce(
    (acc, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  if (error) {
    return (
      <div>
        <div>
          <p>{error.message}</p>
          <button onClick={refetch}>再試行</button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <LoadingFallback isLoading={!isLoaded} />
        {isLoaded && (
          <Suspense fallback={<LoadingFallback isLoading={true} />}>
            <div className="filter-panel-container">
              <FilterPanel
                areaCounts={areaCounts}
                areaVisibility={areaVisibility}
                onAreaToggle={(area: AreaType, visible: boolean) =>
                  setAreaVisibility((prev) => ({ ...prev, [area]: visible }))
                }
                onAreaClick={() => setSelectedPoi(null)}
              />
            </div>
            <div className="map-container">
              <Map pois={filteredPois} selectedPoi={selectedPoi} setSelectedPoi={setSelectedPoi} />
            </div>
            <UserGuide />
            <FeedbackForm />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
