import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import App from '@/App';
import '@/global.css';
import { validateEnv } from '@utils/env';

/**
 * アプリケーションのエントリーポイント
 * - StrictModeを有効化して開発時の潜在的問題を検出
 * - 環境変数のバリデーションを実行
 * - グローバルスタイルを適用
 */

// 環境変数の検証（開発環境でのみ警告を表示）
if (import.meta.env.DEV && !validateEnv()) {
  console.warn('必要な環境変数が設定されていません。アプリケーションが正常に動作しない可能性があります。');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);