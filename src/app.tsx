import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from './components/Map';
import { FilterPanel } from './components/FilterPanel';
import { useSheetData } from './hooks/useSheetData';
import type { AreaType } from './types';
import { AREAS } from './types';
import row1 from './row1.png';

console.log('app.tsx: Application initializing');

const LoadingImage = () => (
  <img src={row1} alt="読み込み中" className="w-12 h-12" role="progressbar" />
);

// 初期値の定数化
const INITIAL_AREA_COUNTS: Record<AreaType, number> = Object.values(AREAS).reduce(
  (acc, area) => ({ ...acc, [area]: 0 }),
  {} as Record<AreaType, number>,
);

const INITIAL_AREA_VISIBILITY: Record<AreaType, boolean> = Object.values(AREAS).reduce(
  (acc, area) => ({ ...acc, [area]: true }),
  {} as Record<AreaType, boolean>,
);

const App = () => {
  console.log('app.tsx: Starting initial render');

  const { pois, isLoading, error } = useSheetData();

  console.log('app.tsx: After useSheetData hook', { isLoading, error, pois });

  const [areaVisibility, setAreaVisibility] = useState(INITIAL_AREA_VISIBILITY);
  const [visiblePois, setVisiblePois] = useState<typeof pois>([]);
  const [areaCounts, setAreaCounts] = useState(INITIAL_AREA_COUNTS);

  // POIのフィルタリングとエリアカウントの計算をメモ化
  const filteredData = useMemo(() => {
    if (!pois?.length) return { filteredPois: [], counts: INITIAL_AREA_COUNTS };

    const visibleAreas = Object.entries(areaVisibility)
      .filter(([, visible]) => visible)
      .map(([area]) => area as AreaType);

    const filteredPois = pois.filter((poi) => visibleAreas.includes(poi.area));
    const counts = filteredPois.reduce(
      (acc, poi) => ({
        ...acc,
        [poi.area]: (acc[poi.area] || 0) + 1,
      }),
      { ...INITIAL_AREA_COUNTS },
    );

    return { filteredPois, counts };
  }, [pois, areaVisibility]);

  useEffect(() => {
    setVisiblePois(filteredData.filteredPois);
    setAreaCounts(filteredData.counts);
  }, [filteredData]);

  useEffect(() => {
    if (error) {
      console.error('アプリケーションエラー:', error);
    }
    if (!isLoading && pois) {
      console.log('データ読み込み完了', pois.length);
    }
  }, [error, isLoading, pois]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex"
      role="application"
      aria-label="地図アプリケーション"
    >
      {isLoading || error ? (
        <div
          className="flex justify-center items-center w-full h-full"
          role="alert"
          aria-busy={isLoading}
        >
          {isLoading && <LoadingImage />}
          {error && <div className="text-red-500 p-4 rounded bg-red-50">{error.message}</div>}
        </div>
      ) : (
        <>
          <div className="w-full lg:w-3/4 xl:w-4/5">
            <Map pois={visiblePois} />
          </div>
          <div className="w-full lg:w-1/4 xl:w-1/5 bg-white p-4">
            <FilterPanel
              isVisible={true}
              areaCounts={areaCounts}
              areaVisibility={areaVisibility}
              onAreaToggle={(area, visible) =>
                setAreaVisibility((prev) => ({ ...prev, [area]: visible }))
              }
            />
          </div>
        </>
      )}
    </div>
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
