import React, { useState, useMemo, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import type { AreaType } from './types';
import { AREAS } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import { useSheetData } from './hooks/useSheetData';

// lazy loadingの型安全性向上
const Map = lazy(() => import('./components/Map').then((module) => ({ default: module.default })));
const FilterPanel = lazy(() =>
  import('./components/FilterPanel').then((module) => ({ default: module.default })),
);

// 定数の分離と型付け
const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.values(AREAS).reduce(
  (acc, area) => ({ ...acc, [area]: true }),
  {} as Record<AreaType, boolean>,
);

const App: React.FC = () => {
  const { pois, isLoading, error, refetch } = useSheetData();
  const [areaVisibility, setAreaVisibility] = useState(INITIAL_VISIBILITY);

  // メモ化ロジックの最適化
  const { filteredPois, areaCounts } = useMemo(() => {
    if (!pois?.length) {
      return {
        filteredPois: [],
        areaCounts: {} as Record<AreaType, number>,
      };
    }

    const visibleAreas = Object.entries(areaVisibility)
      .filter(([, isVisible]) => isVisible)
      .map(([area]) => area) as AreaType[];

    const filtered = pois.filter((poi) => visibleAreas.includes(poi.area));
    const counts = filtered.reduce(
      (acc, poi) => ({
        ...acc,
        [poi.area]: (acc[poi.area] || 0) + 1,
      }),
      {} as Record<AreaType, number>,
    );

    return { filteredPois: filtered, areaCounts: counts };
  }, [pois, areaVisibility]);

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
      <div
        className="relative w-full h-screen overflow-hidden flex"
        role="application"
        aria-label="地図アプリケーション"
      >
        <Suspense fallback={<LoadingFallback isLoading={isLoading} />}>
          <div className="w-full lg:w-3/4 xl:w-4/5">
            <Map pois={filteredPois} />
          </div>
          <div className="w-full lg:w-1/4 xl:w-1/5 bg-white p-4">
            <FilterPanel
              areaCounts={areaCounts}
              areaVisibility={areaVisibility}
              isVisible={true}
              onAreaToggle={(area, visible) =>
                setAreaVisibility((prev) => ({ ...prev, [area]: visible }))
              }
            />
          </div>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

const container = document.getElementById('app');
if (!container) throw new Error('コンテナ要素が見つかりません');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
