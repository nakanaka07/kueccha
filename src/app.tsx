import React, { useState, useMemo } from 'react';
import { Map } from './components/Map';
import { FilterPanel } from './components/FilterPanel';
import { useSheetData } from './hooks/useSheetData';
import type { AreaType, Poi } from './types';
import { AREAS } from './types';
import row1 from './row1.png';

// ローディング画像
const LoadingImage = () => (
  <img src={row1} alt="Loading..." className="w-12 h-12" />
);

export const App = () => {
  const { pois, isLoading, error } = useSheetData() as {
    pois: Poi[];
    isLoading: boolean;
    error: string | null;
  };

  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(
    Object.values(AREAS).reduce(
      (acc, area) => ({ ...acc, [area]: true }),
      {} as Record<AreaType, boolean>
    )
  );

  const areaCounts = useMemo(() => {
    const initialCounts = Object.values(AREAS).reduce(
      (acc, area) => ({ ...acc, [area]: 0 }),
      {} as Record<AreaType, number>
    );
    return pois.reduce((acc, poi) => {
      acc[poi.area] = (acc[poi.area] || 0) + 1;
      return acc;
    }, initialCounts);
  }, [pois]);

  const visiblePois = useMemo(() => {
    const visibleAreas = Object.entries(areaVisibility)
      .filter(([, visible]) => visible)
      .map(([area]) => area as AreaType);

    return pois.filter((poi) => visibleAreas.includes(poi.area));
  }, [pois, areaVisibility]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex">
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-full">
          <LoadingImage />
          {error && (
            <div className="text-red-500">
              データの読み込み中にエラーが発生しました: {error}
            </div>
          )}
        </div>
      ) : error ? (
        <div className="text-red-500">
          エラーが発生しました: {error}。しばらくしてからもう一度お試しください。
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
