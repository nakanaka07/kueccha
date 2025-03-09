/**
 * @ファイル index.tsx - Reactアプリケーションのエントリーポイント
 *
 * @役割
 * - DOMにReactアプリケーションをレンダリング
 * - アプリケーション初期化のエラーハンドリング
 *
 * @依存関係
 * - React 18以上 (createRootメソッドが必要)
 * - ReactDOM (DOMへのレンダリング)
 * - ./app/App (メインアプリケーションコンポーネント、遅延ロード)
 * - ./core/constants/messages (エラー定義)
 *
 * @注意点
 * - 'app' IDを持つHTML要素がDOM上に必要
 * - React 18のcreateRoot APIを使用
 * - 開発環境ではStrictModeが有効
 * - Suspenseによる遅延読み込み対応
 * - DOMの準備完了に応じて適切なタイミングでレンダリング開始
 */
import React, { Suspense, StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ERRORS as ERROR_MESSAGES } from './core/constants/messages';

const App = lazy(() => import('./app/App'));

const isDevelopment = process.env.NODE_ENV === 'development';

function renderApp() {
  try {
    const container = document.getElementById('app');
    if (!container) throw new Error(ERROR_MESSAGES.containerNotFound);

    const root = createRoot(container);

    root.render(
      isDevelopment ? (
        <StrictMode>
          <Suspense fallback={<div className="loading-app">アプリを読み込み中...</div>}>
            <App />
          </Suspense>
        </StrictMode>
      ) : (
        <Suspense fallback={<div className="loading-app">アプリを読み込み中...</div>}>
          <App />
        </Suspense>
      ),
    );
  } catch (error) {
    console.error('アプリケーションの初期化に失敗しました:', error);
    const errorContainer = document.getElementById('app') || document.body;
    errorContainer.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        <h2>エラーが発生しました</h2>
        <p>${error instanceof Error ? error.message : '予期せぬエラーが発生しました'}</p>
        <button onclick="location.reload()">再読み込み</button>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
