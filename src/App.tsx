/**
 * App.tsx
 *
 * @description
 * アプリケーションのルートコンポーネントとエントリーポイント。
 * Google Mapsを中心としたマップ表示機能を提供し、全体のレイアウトと
 * コンポーネント間の連携を管理します。
 *
 * @usage
 * 以下のようなケースで使用します：
 * - マップベースの位置情報表示アプリケーション
 * - 地図上にマーカーやコンテンツを表示するサービス
 * - ユーザーの位置情報を活用したインタラクティブマップ
 * - エリア別データの視覚化
 *
 * @features
 * - エラーバウンダリによる安全なエラーハンドリング
 * - マップの状態管理（読み込み状態、インスタンス管理）
 * - レスポンシブデザイン対応
 * - モジュール化されたコード構造
 *
 * @architecture
 * - コンポーネントはプレゼンテーショナルコンポーネントとして実装
 * - 状態管理ロジックはカスタムフックに分離
 * - エラー処理は専用のErrorBoundaryコンポーネントに委譲
 * - CSSモジュールによるスタイル管理
 *
 * @bestPractices
 * - 関心の分離を徹底し、状態管理ロジックとUIを分ける
 * - アプリケーション全体をErrorBoundaryでラップし、予期せぬエラーに対応
 * - パフォーマンス最適化のために不要な再レンダリングを避ける
 * - コンポーネント間の疎結合を維持する
 *
 * @dependencies
 * - React: UIコンポーネントの構築
 * - react-dom/client: クライアントサイドレンダリング
 * - ErrorBoundary: エラーのグレースフルハンドリング
 * - Map: Google Maps APIを使用したマップ表示
 * - useMapState: マップ状態管理用カスタムフック
 * - ERROR_MESSAGES: エラーメッセージ定数
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import Map from './components/map/Map';
import { useMapState } from './hooks/useMapState';
import { ERROR_MESSAGES } from './utils/constants';

/**
 * メインのAppコンポーネント
 *
 * アプリケーション全体のレイアウトとコンテンツを定義します。
 * ErrorBoundaryでラップされており、予期せぬエラーが発生した場合でも
 * アプリケーション全体がクラッシュすることを防ぎます。
 */
const App: React.FC = () => {
  // useMapStateフックを使ってマップの状態を一元管理
  // isMapLoaded: マップが読み込み完了したかどうかのフラグ
  // mapInstance: Google Mapsのインスタンス（操作や設定変更に使用）
  // handleMapLoad: マップ読み込み完了時に呼び出されるコールバック関数
  const { isMapLoaded, mapInstance, handleMapLoad } = useMapState();

  /**
   * マップがロードされたときの副作用処理
   *
   * マップインスタンスが利用可能になった時点で実行される処理です。
   * 将来的なマップ機能拡張（マーカー追加、イベントリスナー設定など）は
   * ここに実装することができます。
   */
  React.useEffect(() => {
    if (mapInstance) {
      console.log('Map loaded successfully');
      // 将来的に必要な追加処理をここに記述:
      // - マーカーの初期配置
      // - 地図スタイルのカスタマイズ
      // - イベントリスナーの設定
      // - 地理的境界の設定
    }
  }, [mapInstance]); // mapInstanceが変更された時のみ実行

  return (
    <div className={styles.app}>
      {/*
        ErrorBoundary: 子コンポーネントで発生したエラーをキャッチし、
        フォールバックUIを表示することでUXを向上させます
      */}
      <ErrorBoundary>
        <div className={styles.appContainer}>
          {/*
            Map: Google Mapsを表示するコンポーネント
            onLoad: マップ読み込み完了時に状態を更新するコールバック
          */}
          <Map onLoad={handleMapLoad} />

          {/* マップ読み込み完了時のみ表示されるステータス表示 */}
          {isMapLoaded && <div className={styles.mapStatusOverlay}>マップが読み込まれました</div>}
        </div>
      </ErrorBoundary>
    </div>
  );
};

/**
 * DOMへのレンダリング処理
 *
 * アプリケーションのエントリーポイントとして、
 * Reactのルートコンポーネントをマウントするための処理です。
 */
const container = document.getElementById('app');
// アプリケーションのマウントポイントが存在しない場合はエラーをスロー
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

// React 18のcreateRootAPIを使用してレンダリング
const root = createRoot(container);
root.render(<App />);
