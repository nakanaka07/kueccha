/**
 * App.tsx
 *
 * @description
 * アプリケーションのルートコンポーネントとエントリーポイント。
 * Google Mapsを中心としたマップ表示機能を提供し、全体のレイアウトと
 * コンポーネント間の連携を管理します。
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import { LoadingIndicators } from './components/loading';
import LocationWarning from './components/locationwarning/LocationWarning'; // 警告コンポーネントをインポート
import Map from './components/map/Map';
import { useAppState } from './hooks/useAppState';
import { useLocationWarning } from './hooks/useLocationWarning'; // 現在地取得フックをインポート
import { useSheetData } from './hooks/useSheetData'; // POIデータ取得フック
import { ERROR_MESSAGES } from './utils/constants';
import type { Poi } from './utils/types'; // Poi型をインポート

/**
 * メインのAppコンポーネント
 *
 * アプリケーション全体のレイアウトとコンテンツを定義します。
 * ErrorBoundaryでラップされており、予期せぬエラーが発生した場合でも
 * アプリケーション全体がクラッシュすることを防ぎます。
 */
const App: React.FC = () => {
  // Google Sheetsからデータを取得
  const { pois, isLoading: _isPoisLoading, error: poisError } = useSheetData();

  // 現在地の取得と警告表示を管理するフックを使用
  const { currentLocation, showWarning, setShowWarning } = useLocationWarning();

  // 現在地がある場合、それをPOI形式に変換
  const currentLocationPoi: Poi | null = useMemo(() => {
    if (!currentLocation) return null;

    return {
      id: 'current-location', // 一意のID
      name: '現在地', // 表示名
      location: currentLocation, // 位置情報
      area: 'CURRENT_LOCATION', // マーカーのエリアタイプ（特別スタイル適用のため）
      genre: '現在地', // 必須プロパティ
      category: '現在地', // 必須プロパティ
      // descriptionは不要なので削除（Poi型に含まれていないプロパティ）
    };
  }, [currentLocation]);

  // 通常のPOIと現在地POIを結合
  const allPois = useMemo(() => {
    const basePois = pois || [];
    return currentLocationPoi ? [...basePois, currentLocationPoi] : basePois;
  }, [pois, currentLocationPoi]);

  // useAppStateを拡張してPOIデータを渡す
  const {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading: { isVisible: isLoadingVisible, isFading },
    error,
    actions: { handleMapLoad, retryMapLoad },
    // POI関連の状態も取得
    selectedPoi,
    setSelectedPoi,
  } = useAppState(allPois); // 結合したPOIデータを渡す

  /**
   * ローディングメッセージを動的に決定
   * useMemoを使用して不要な再計算を防止
   */
  const loadingMessage = useMemo(() => {
    return isMapLoading ? ERROR_MESSAGES.LOADING.MAP : ERROR_MESSAGES.LOADING.DATA;
  }, [isMapLoading]);

  /**
   * エラーメッセージを動的に決定
   */
  const errorMessage = useMemo(() => {
    if (!error && !poisError) return null;
    return (error || poisError)?.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
  }, [error, poisError]);

  /**
   * マップが読み込まれたときの処理
   * useCallbackを使用して関数を最適化
   */
  const handleMapInitialized = useCallback(() => {
    if (!mapInstance) return;

    console.log('Map loaded successfully');

    // マップに必要な初期設定をここで実行
    // 例: 特定のスタイル適用、イベントリスナー追加など
  }, [mapInstance]);

  /**
   * マーカークリック時の処理を実装
   * poiパラメーターにPoi型を明示的に指定
   */
  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
      // 必要に応じて追加の操作（マップの中心を移動するなど）
      if (mapInstance) {
        mapInstance.panTo(poi.location);
        mapInstance.setZoom(15); // 適切なズームレベルに調整
      }
    },
    [mapInstance, setSelectedPoi],
  );

  /**
   * マップインスタンスが利用可能になった時点で実行される副作用
   */
  useEffect(() => {
    if (mapInstance) {
      handleMapInitialized();
    }
  }, [mapInstance, handleMapInitialized]);

  /**
   * 現在地が変わったときの処理
   */
  useEffect(() => {
    if (currentLocation && mapInstance) {
      // 現在地が取得できたらマップの中心を移動（オプション）
      mapInstance.panTo(currentLocation);
    }
  }, [currentLocation, mapInstance]);

  return (
    <div className={styles.app}>
      <ErrorBoundary>
        <div className={styles.appContainer}>
          {/* アプリ全体のローディング表示 */}
          {isLoadingVisible && (
            <LoadingIndicators.Fallback
              isLoading={!error && !poisError}
              isLoaded={false}
              error={error || poisError ? new Error(errorMessage || '') : null}
              message={loadingMessage}
              variant="spinner"
              spinnerClassName={styles.fullPageLoader}
              isFading={isFading}
              onRetry={error || poisError ? retryMapLoad : undefined}
            />
          )}

          {/* マップ読み込み完了通知 - アニメーション付きステータス表示 */}
          {isMapLoaded && (
            <div className={styles.mapStatusOverlay} aria-live="polite">
              <div className={styles.statusContent}>
                <span className={styles.statusIcon} aria-hidden="true">
                  ✓
                </span>
                マップが読み込まれました
              </div>
            </div>
          )}

          {/* Google Maps表示コンポーネント */}
          <Map onLoad={handleMapLoad} pois={allPois} selectedPoi={selectedPoi} onMarkerClick={handleMarkerClick} />

          {/* 位置情報の使用に関する警告表示 */}
          {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
        </div>
      </ErrorBoundary>
    </div>
  );
};

/**
 * DOMへのレンダリング処理
 */
const container = document.getElementById('app');

// アプリケーションのマウントポイントが存在しない場合はエラーをスロー
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

// React 18のcreateRootAPIを使用してレンダリング
const root = createRoot(container);
root.render(<App />);
