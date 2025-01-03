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
  // シートデータを取得するカスタムフックを使用
  const { pois, isLoading, error, refetch } = useSheetData();
  // エリアの表示状態を管理するステート
  const [areaVisibility, setAreaVisibility] = useState(INITIAL_VISIBILITY);

  // 表示するPOIをフィルタリング
  const filteredPois = pois?.filter((poi) => areaVisibility[poi.area]) || [];
  // 各エリアのPOI数をカウント
  const areaCounts = filteredPois.reduce(
    (acc, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  // エラーメッセージを表示
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
      <div>
        {isLoading ? (
          // ローディング中のフォールバックを表示
          <LoadingFallback isLoading={isLoading} />
        ) : (
          <div>
            <Map pois={filteredPois} />
            {/* オーバーレイとして配置 */}
            <div>
              <FilterPanel
                areaCounts={areaCounts}
                areaVisibility={areaVisibility}
                onAreaToggle={(area, visible) =>
                  setAreaVisibility((prev) => ({ ...prev, [area]: visible }))
                }
              />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

// アプリケーションのエントリーポイント
const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
