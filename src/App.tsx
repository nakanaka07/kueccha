/**
 * App.tsx
 * マップ表示のための最小限のアプリケーション
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import Map from './components/map/Map';
import { useMapState } from './hooks/useMapState';
import { ERROR_MESSAGES } from './utils/constants';

// メインのAppコンポーネント
const App: React.FC = () => {
  // useMapStateフックを使ってマップの状態を一元管理
  const { isMapLoaded, mapInstance, handleMapLoad } = useMapState();

  // マップがロードされたときの追加処理
  React.useEffect(() => {
    if (mapInstance) {
      console.log('Map loaded successfully');
      // 将来的に必要な追加処理をここに記述
    }
  }, [mapInstance]);

  return (
    <div className={styles.app}>
      <ErrorBoundary>
        <div className={styles.appContainer}>
          {/* 単一のコールバックのみを渡す */}
          <Map onLoad={handleMapLoad} />
          {isMapLoaded && <div className={styles.mapStatusOverlay}>マップが読み込まれました</div>}
        </div>
      </ErrorBoundary>
    </div>
  );
};

// DOMへのレンダリング
const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

const root = createRoot(container);
root.render(<App />);
