import React, { useState } from 'react';
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
      <ErrorBoundary
        fallback={
          <div className="error-message" role="alert">
            <p>
              エラーが発生しました。再試行するには以下のボタンをクリックしてください。
            </p>
            <button onClick={refetch}>再試行</button>
          </div>
        }
      >
        <div className="app-container">
          <div className="map-container">
            <Map
              pois={displayedPois}
              selectedPoi={selectedPoi}
              setSelectedPoi={
                actions.setSelectedPoi as React.Dispatch<
                  React.SetStateAction<Poi | null>
                >
              }
              areaVisibility={areaVisibility}
              onLoad={actions.handleMapLoad}
              setAreaVisibility={
                actions.setAreaVisibility as React.Dispatch<
                  React.SetStateAction<Record<AreaType, boolean>>
                >
              }
              currentLocation={currentLocation}
              setCurrentLocation={
                actions.setCurrentLocation as React.Dispatch<
                  React.SetStateAction<LatLngLiteral | null>
                >
              }
              showWarning={showWarning}
              setShowWarning={
                actions.setShowWarning as React.Dispatch<
                  React.SetStateAction<boolean>
                >
              }
            />
          </div>
          <HamburgerMenu
            pois={displayedPois}
            setSelectedPoi={
              actions.setSelectedPoi as React.Dispatch<
                React.SetStateAction<Poi | null>
              >
            }
            setAreaVisibility={
              actions.setAreaVisibility as React.Dispatch<
                React.SetStateAction<Record<AreaType, boolean>>
              >
            }
            localAreaVisibility={areaVisibility}
            setLocalAreaVisibility={
              actions.setAreaVisibility as React.Dispatch<
                React.SetStateAction<Record<AreaType, boolean>>
              >
            }
            currentLocation={currentLocation}
            setCurrentLocation={
              actions.setCurrentLocation as React.Dispatch<
                React.SetStateAction<LatLngLiteral | null>
              >
            }
            setShowWarning={
              actions.setShowWarning as React.Dispatch<
                React.SetStateAction<boolean>
              >
            }
            search={search}
            searchResults={searchResults}
            handleSearchResultClick={actions.handleSearchResultClick}
          />
          <FilterPanel
            pois={displayedPois}
            setSelectedPoi={
              actions.setSelectedPoi as React.Dispatch<
                React.SetStateAction<Poi | null>
              >
            }
            setAreaVisibility={
              actions.setAreaVisibility as React.Dispatch<
                React.SetStateAction<Record<AreaType, boolean>>
              >
            }
            isFilterPanelOpen={true} // フィルターパネルを開くための状態を追加
            onCloseClick={() => {}} // 閉じるボタンのハンドラーを追加
            localAreaVisibility={areaVisibility}
            setLocalAreaVisibility={
              actions.setAreaVisibility as React.Dispatch<
                React.SetStateAction<Record<AreaType, boolean>>
              >
            }
            currentLocation={currentLocation}
            setCurrentLocation={
              actions.setCurrentLocation as React.Dispatch<
                React.SetStateAction<LatLngLiteral | null>
              >
            }
            setShowWarning={
              actions.setShowWarning as React.Dispatch<
                React.SetStateAction<boolean>
              >
            }
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
