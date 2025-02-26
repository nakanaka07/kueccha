/**
 * App.tsx
 * マップ表示のための最小限のアプリケーション
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import './App-module.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import Map from './components/map/Map';
import { ERROR_MESSAGES } from './utils/constants';

// メインのAppコンポーネント
const App: React.FC = () => {
  // マップロード時の処理
  const handleMapLoad = (mapInstance: google.maps.Map | null) => {
    if (mapInstance) {
      console.log('Map loaded successfully');
    }
  };

  return (
    <div className="app">
      <ErrorBoundary>
        <div className="app-container">
          <Map onLoad={handleMapLoad} setIsMapLoaded={handleMapLoad} />
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
