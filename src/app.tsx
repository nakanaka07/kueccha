import React, { useState, useMemo, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import type { AreaType } from './types';
import { AREAS } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import { useSheetData } from './hooks/useSheetData';

// コンポーネントの型定義
interface FilterPanelProps {
  isVisible: boolean;
  areaCounts: Record<AreaType, number>;
  areaVisibility: Record<AreaType, boolean>;
  onAreaToggle: (area: AreaType, visible: boolean) => void;
}

// 遅延ロードするコンポーネント
const Map = lazy(() => import('./components/Map'));
const FilterPanel = lazy(() => import('./components/FilterPanel'));

// 定数
const INITIAL_STATE = {
  areaCounts: Object.values(AREAS).reduce(
    (acc, area) => ({ ...acc, [area]: 0 }),
    {} as Record<AreaType, number>,
  ),
  areaVisibility: Object.values(AREAS).reduce(
    (acc, area) => ({ ...acc, [area]: true }),
    {} as Record<AreaType, boolean>,
  ),
};

// FilterPanelコンポーネントで型を使用
const FilterPanelComponent: React.FC<FilterPanelProps> = (props) => {
  return <FilterPanel {...props} />;
};

// メインのアプリケーションコンポーネント
const App: React.FC = () => {
  const { pois, isLoading, error, refetch } = useSheetData();
  const [areaVisibility, setAreaVisibility] = useState(INITIAL_STATE.areaVisibility);

  // フィルタリングロジックをメモ化
  const { filteredPois, areaCounts } = useMemo(() => {
    if (!pois?.length) {
      return {
        filteredPois: [],
        areaCounts: INITIAL_STATE.areaCounts,
      };
    }

    const visibleAreas = Object.entries(areaVisibility)
      .filter(([, visible]) => visible)
      .map(([area]) => area as AreaType);

    const filtered = pois.filter((poi) => visibleAreas.includes(poi.area));
    const counts = filtered.reduce(
      (acc, poi) => ({
        ...acc,
        [poi.area]: (acc[poi.area] || 0) + 1,
      }),
      { ...INITIAL_STATE.areaCounts },
    );

    return { filteredPois: filtered, areaCounts: counts };
  }, [pois, areaVisibility]);

  // エラー発生時のリトライハンドラー
  const handleRetry = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 p-4 rounded bg-red-50">
          <p>{error.message}</p>
          <button
            onClick={handleRetry}
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
            <FilterPanelComponent
              isVisible={true}
              areaCounts={areaCounts}
              areaVisibility={areaVisibility}
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

// アプリケーションのマウント
const container = document.getElementById('app');
if (!container) throw new Error('コンテナ要素が見つかりません');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
