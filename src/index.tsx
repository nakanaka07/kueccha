// index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ERROR_MESSAGES } from './utils/constants';

// レンダリングロジックをメイン関数に分離
function renderApp() {
  const container = document.getElementById('app');
  if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

  const root = createRoot(container);
  root.render(<App />);
}

// アプリケーションのレンダリング
renderApp();