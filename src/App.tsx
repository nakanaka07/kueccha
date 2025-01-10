import React, { useState, useEffect, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import type { Poi, AreaType } from './utils/types';
import { ERROR_MESSAGES } from './utils/constants';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import { LoadingFallback } from './components/loadingfallback/LoadingFallback';
import { useSheetData } from './hooks/useSheetData';
import './App.css';

const Map = lazy(() => import('./components/map/Map'));
const FilterPanel = lazy(() => import('./components/filterpanel/FilterPanel'));
const FeedbackForm = lazy(() => import('./components/feedbackform/FeedbackForm'));
const UserGuide = lazy(() => import('./components/userguide/UserGuide'));
const HamburgerMenu = lazy(() => import('./components/hamburgermenu/HamburgerMenu'));

const App: React.FC = () => {
  const { pois, isLoading, error, refetch } = useSheetData();
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(
    {} as Record<AreaType, boolean>,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (error) {
    return (
      <div>
        <p>{error.message}</p>
        <button onClick={refetch}>再試行</button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        <LoadingFallback isLoading={!isLoaded} />
        {isLoaded && (
          <Suspense fallback={<LoadingFallback isLoading={true} />}>
            <div className="map-container">
              <HamburgerMenu
                onAreaClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                onFeedbackClick={() => setIsFeedbackFormOpen(!isFeedbackFormOpen)}
                onTourClick={() => setRunTour(true)}
              />
              <Map
                pois={pois}
                selectedPoi={selectedPoi}
                setSelectedPoi={setSelectedPoi}
                areaVisibility={areaVisibility}
              />
            </div>
            {isFilterPanelOpen && (
              <FilterPanel
                pois={pois}
                onAreaClick={() => setSelectedPoi(null)}
                setSelectedPoi={setSelectedPoi}
                setAreaVisibility={setAreaVisibility}
              />
            )}
            {isFeedbackFormOpen && <FeedbackForm />}
            <UserGuide runTour={runTour} setRunTour={setRunTour} />
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
