/**
 * App.tsx
 * マップ表示のための最小限のアプリケーション
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import Map from './components/map/Map';
import { ERROR_MESSAGES } from './constants/constants';

// メインのAppコンポーネント
const App: React.FC = () => {
  // マップロード時の処理
  const handleMapLoad = (mapInstance: google.maps.Map | null) => {
    if (mapInstance) {
      console.log('Map loaded successfully');
    }
  };

  // マップの状態を管理するための関数（必要に応じて使用）
  const handleMapLoadedState = (_mapInstance: google.maps.Map | null) => {
    // マップインスタンスが必要なときに状態を更新するなど
    // 現在は使用していないため、引数名の先頭に_を付けています
  };

  return (
    <div className={styles.app}>
      <ErrorBoundary>
        <div className={styles.appContainer}>
          <Map onLoad={handleMapLoad} setIsMapLoaded={handleMapLoadedState} />
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
