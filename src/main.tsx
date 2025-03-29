import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import App from '@/App';
import '@/global.css';
import { validateEnv } from '@/utils/env';
import { logger } from '@/utils/logger';

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

  // エラー通知用のUI要素を表示
  const errorElement = document.createElement('div');
  errorElement.className = 'env-error-notification';
  errorElement.textContent = errorMessage;
  document.body.prepend(errorElement);

  // デバッグ情報をログに出力 - 型エラー修正
  logger.error('[環境変数エラー]', new Error(errorMessage));
}

// アプリケーションのマウント処理
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
  logger.error('[マウントエラー]', new Error('rootエレメントが見つかりません。'));
}
