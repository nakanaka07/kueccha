import React from 'react';
import { createRoot } from 'react-dom/client';
import { useState, useMemo, useEffect } from 'react';
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

  console.log('app.tsx: After useSheetData hook', { isLoading, error });

  const [isFilterVisible] = useState(true);
  const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(
    Object.values(AREAS).reduce(
      (acc, area) => ({ ...acc, [area]: true }),
      {} as Record<AreaType, boolean>,
    ),
  );

  console.log('app.tsx: Area visibility state:', areaVisibility);

  const areaCounts = useMemo(() => {
    console.log('app.tsx: Calculating area counts');
    const initialCounts = Object.values(AREAS).reduce(
      (acc, area) => ({ ...acc, [area]: 0 }),
      {} as Record<AreaType, number>,
    );
    const counts = pois.reduce((acc, poi) => {
      acc[poi.area] = (acc[poi.area] || 0) + 1;
      return acc;
    }, initialCounts);
    console.log('app.tsx: Area counts calculated:', counts);
    return counts;
  }, [pois]);

  const visiblePois = useMemo(() => {
    console.log('app.tsx: Filtering visible POIs');
    const visibleAreas = Object.entries(areaVisibility)
      .filter(([, visible]) => visible)
      .map(([area]) => area as AreaType);
    const filteredPois = pois.filter((poi) => visibleAreas.includes(poi.area));
    console.log('app.tsx: Visible POIs count:', filteredPois.length);
    return filteredPois;
  }, [pois, areaVisibility]);

  useEffect(() => {
    if (error) {
      console.error('アプリケーションエラー:', error);
    }
    if (!isLoading) {
      console.log('データ読み込み完了');
    }
  }, [error, isLoading]); // error, isLoading を依存配列に追加

  return (
    <div className="relative w-full h-screen overflow-hidden flex">
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-full">
          <LoadingImage />
          {error && (
            <div className="text-red-500">
              データの読み込み中にエラーが発生しました: {error.message}
            </div>
          )}
        </div>
      ) : error ? (
        <div className="text-red-500">
          エラーが発生しました: {error.message}
          しばらくしてからもう一度お試しください。
        </div>
      ) : (
        <>
          <div className="w-full lg:w-3/4 xl:w-4/5">
            <Map pois={visiblePois} />
          </div>
          <div className="w-full lg:w-1/4 xl:w-1/5 bg-white p-4">
            <FilterPanel
              isVisible={isFilterVisible}
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

// Appコンポーネントをレンダリングする処理を追加
const container = document.getElementById('app');
if (!container) throw new Error('コンテナ要素が見つかりません');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
