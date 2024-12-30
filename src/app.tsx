import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from './components/Map';
import { FilterPanel } from './components/FilterPanel';
import { useSheetData } from './hooks/useSheetData';
import type { AreaType } from './types';
import { AREAS } from './types';
import row1 from './row1.png';

console.log('app.tsx: Application initializing');

const LoadingImage = () => {
  console.log('app.tsx: Rendering loading image');
  return <img src={row1} alt="Loading..." className="w-12 h-12" />;
};

const App = () => {
  console.log('app.tsx: Starting initial render');

  const { pois, isLoading, error } = useSheetData();

  console.log('app.tsx: After useSheetData hook', { isLoading, error, pois });

  const initialAreaCounts: Record<AreaType, number> = Object.values(AREAS).reduce(
    (acc, area) => ({ ...acc, [area]: 0 }), // より簡潔な初期化方法
    {} as Record<AreaType, number>,
  );

  const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(
    Object.values(AREAS).reduce(
      (acc, area) => ({ ...acc, [area]: true }),
      {} as Record<AreaType, boolean>,
    ),
  );

  console.log('app.tsx: Area visibility state:', areaVisibility);

  const [visiblePois, setVisiblePois] = useState<typeof pois>([]);
  const [areaCounts, setAreaCounts] = useState<Record<AreaType, number>>(initialAreaCounts);

  useEffect(() => {
    console.log('app.tsx: Filtering visible POIs and calculating area counts inside useEffect');

    if (pois) {
      const visibleAreas = Object.entries(areaVisibility)
        .filter(([, visible]) => visible)
        .map(([area]) => area as AreaType);
      const filteredPois = pois.filter((poi) => visibleAreas.includes(poi.area));

      const initialCounts = Object.values(AREAS).reduce(
        (acc, area) => ({ ...acc, [area]: 0 }),
        {} as Record<AreaType, number>,
      );
      const counts = filteredPois.reduce((acc, poi) => {
        acc[poi.area] = (acc[poi.area] || 0) + 1;
        return acc;
      }, initialCounts);

      setVisiblePois(filteredPois);
      setAreaCounts(counts);
    }
  }, [pois, areaVisibility]);

  useEffect(() => {
    if (error) {
      console.error('アプリケーションエラー:', error);
    }
    if (!isLoading && pois) {
      console.log('データ読み込み完了', pois.length);
    }
  }, [error, isLoading, pois]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex">
      {isLoading || error ? (
        <div className="flex justify-center items-center w-full h-full">
          <LoadingImage />
          {error && <div className="text-red-500">{error.message}</div>}
        </div>
      ) : (
        <>
          <div className="w-full lg:w-3/4 xl:w-4/5">
            <Map pois={visiblePois} />
          </div>
          <div className="w-full lg:w-1/4 xl:w-1/5 bg-white p-4">
            <FilterPanel
              isVisible={true} // isVisible prop を追加
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
