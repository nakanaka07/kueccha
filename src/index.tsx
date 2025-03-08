/*
 * 機能: Reactアプリケーションのエントリーポイント
 * このファイルはDOMにReactアプリケーションをレンダリングする役割を担います。
 *
 * 依存関係:
 *   - React 18以上（createRootメソッドを使用）
 *   - ReactDOM（DOMへのレンダリング）
 *   - ./app/App（メインアプリコンポーネント）
 *   - ./core/constants/messages（エラーメッセージ定義）
 *
 * 注意点:
 *   - 'app' IDを持つHTML要素がDOMに存在している必要があります
 *   - 対象要素が見つからない場合、エラーがスローされます
 *   - React 18のcreateRoot APIを使用しています（古いReact版では動作しません）
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { ERRORS as ERROR_MESSAGES } from './core/constants/messages';

function renderApp() {
  const container = document.getElementById('app');
  if (!container) throw new Error(ERROR_MESSAGES.containerNotFound);

  const root = createRoot(container);
  root.render(<App />);
}

renderApp();
