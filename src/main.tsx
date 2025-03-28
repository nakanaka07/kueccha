import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import App from '@/App';
import '@/global.css';
import { validateEnv } from '@/utils/env';

/**
 * アプリケーションのエントリーポイント
 * - StrictModeを有効化して開発時の潜在的問題を検出
 * - 環境変数のバリデーションを実行
 * - グローバルスタイルを適用
 */

// 環境変数の検証（開発環境でのみエラー表示）
if (import.meta.env.DEV && !validateEnv()) {
  const errorMessage =
    '必要な環境変数が設定されていません。アプリケーションが正常に動作しない可能性があります。';
  // エラー通知用のUI要素を表示（console.warnの代わり）
  const rootElement = document.createElement('div');
  rootElement.className = 'env-error-notification';
  rootElement.textContent = errorMessage;
  document.body.prepend(rootElement);
}

const rootElement = document.getElementById('root');

// root要素が存在することを確認
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  // root要素が見つからない場合のエラーハンドリング
  document.body.innerHTML =
    '<div class="critical-error">アプリケーションの読み込みに失敗しました。</div>';
}
