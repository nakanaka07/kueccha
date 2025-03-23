import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../index.css';

/**
 * アプリケーションのエントリーポイント
 * - StrictModeを有効化して開発時の問題を早期発見
 * - CSSをインポートしてグローバルスタイルを適用
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
