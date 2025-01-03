import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { AreaType } from './types';
import { AREAS, ERROR_MESSAGES } from './constants';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingFallback } from './components/common/LoadingFallback';
import { Map } from './components/map/Map';
import { FilterPanel } from './components/map/FilterPanel';
import { useSheetData } from './hooks/useSheetData';

// 初期表示設定
const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: true, // すべてのエリアを表示
  }),
  {} as Record<AreaType, boolean>,
);

const App: React.FC = () => {
  const { pois, isLoading, error, refetch } = useSheetData();
  const [areaVisibility, setAreaVisibility] = useState(INITIAL_VISIBILITY);

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
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 p-4 rounded bg-red-100">
          <p>{error.message}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-screen relative overflow-hidden">
        {isLoading ? (
          <LoadingFallback isLoading={isLoading} />
        ) : (
          <div className="w-full h-full relative">
            {/* position: absoluteのコンテナ */}
            <div className="absolute inset-0">
              <Map pois={filteredPois} />
            </div>
            {/* オーバーレイとして配置 */}
            <FilterPanel
              areaCounts={areaCounts}
              areaVisibility={areaVisibility}
              onAreaToggle={(area, visible) =>
                setAreaVisibility((prev) => ({ ...prev, [area]: visible }))
              }
            />
          </div>
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
