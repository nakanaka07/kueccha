/**
 * App.tsx
 *
 * @description
 * アプリケーションのルートコンポーネントとエントリーポイント。
 */

// useEffectを削除（使用していないため）
import React, { useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
import { LoadingIndicators } from './components/loading';
import LocationWarning from './components/locationwarning/LocationWarning';
import Map from './components/map/Map';
// MapControlsコンポーネントをインポート
import { MapControls } from './components/mapcontrols/MapControls';
import { useAppState } from './hooks/useAppState';
import { useLocationWarning } from './hooks/useLocationWarning';
// 北向きリセット機能用のフックをインポート
import { useMapNorthControl } from './hooks/useMapNorthControl';
import { useSheetData } from './hooks/useSheetData';
import { ERROR_MESSAGES } from './utils/constants';
import type { Poi } from './utils/types';

const App: React.FC = () => {
  const { pois, error: poisError } = useSheetData();

  // 現在地マーカーの表示/非表示を管理するステート
  // この変数宣言を先頭に移動
  const [showCurrentLocationMarker, setShowCurrentLocationMarker] = useState(true);

  // 現在地管理フックから、現在地取得メソッドも取得
  const { currentLocation, showWarning, setShowWarning, handleCurrentLocationChange } = useLocationWarning();

  const currentLocationPoi: Poi | null = useMemo(() => {
    if (!currentLocation) return null;

    return {
      id: 'current-location',
      name: '現在地',
      location: currentLocation,
      area: 'CURRENT_LOCATION',
      genre: '現在地',
      category: '現在地',
    };
  }, [currentLocation]);

  const allPois = useMemo(() => {
    const basePois = pois || [];
    // 表示状態に応じて現在地マーカーを含めるかどうかを決定
    return currentLocationPoi && showCurrentLocationMarker ? [...basePois, currentLocationPoi] : basePois;
  }, [pois, currentLocationPoi, showCurrentLocationMarker]);

  // useAppStateからの値を正しく取り出す
  const {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading: { isVisible: isLoadingVisible, isFading },
    error,
    actions,
    selectedPoi,
    areaVisibility,
  } = useAppState(allPois);

  // 北向きリセット機能を追加
  const { resetNorth } = useMapNorthControl(mapInstance);

  // 現在地取得ボタン用ハンドラ
  const handleGetCurrentLocation = useCallback(() => {
    // 現在地を取得し、マーカーを表示状態にする
    handleCurrentLocationChange(true);
    setShowCurrentLocationMarker(true);
  }, [handleCurrentLocationChange]);

  // マーカーを全て表示する範囲に調整する関数
  const handleFitMarkers = useCallback(() => {
    if (mapInstance && allPois && allPois.length > 0) {
      // 表示されているエリアのマーカーと現在地マーカーを対象にする
      const visiblePois = allPois.filter((poi) => poi.id === 'current-location' || areaVisibility[poi.area]);

      // 表示するマーカーがない場合は何もしない
      if (visiblePois.length === 0) return;

      // 境界オブジェクトを作成
      const bounds = new google.maps.LatLngBounds();

      // 全ての表示中マーカーの位置を境界に追加
      visiblePois.forEach((poi) => {
        bounds.extend(poi.location);
      });

      // 型アサーションを追加して、mapInstanceが存在することをTypeScriptに伝える
      (mapInstance as google.maps.Map).fitBounds(bounds);

      // 過度にズームインしすぎるのを防止（マーカーが1つだけの場合など）
      const zoomListener = google.maps.event.addListener(mapInstance, 'idle', () => {
        if ((mapInstance?.getZoom() ?? 0) > 17) {
          mapInstance?.setZoom(17);
        }
        google.maps.event.removeListener(zoomListener);
      });
    }
  }, [mapInstance, allPois, areaVisibility]);

  // エラーメッセージを動的に決定
  const errorMessage = useMemo(() => {
    if (!error && !poisError) return null;
    return (error || poisError)?.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
  }, [error, poisError]);

  // ローディングメッセージを動的に決定
  const loadingMessage = useMemo(() => {
    return isMapLoading ? ERROR_MESSAGES.LOADING.MAP : ERROR_MESSAGES.LOADING.DATA;
  }, [isMapLoading]);

  // マーカークリック時の処理を実装
  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      // 現在地マーカーの場合は表示/非表示を切り替える特別処理
      if (poi.id === 'current-location') {
        setShowCurrentLocationMarker(false); // マーカークリックで非表示にする
        // 選択状態も解除する
        actions.setSelectedPoi(null);
        return;
      }

      // 通常のPOIの場合は既存の処理を実行
      actions.setSelectedPoi(poi);
      if (mapInstance) {
        mapInstance.panTo(poi.location);
        mapInstance.setZoom(15);
      }
    },
    [mapInstance, actions.setSelectedPoi],
  );

  // デバッグ用にコンソールログを追加
  console.log('isMapLoaded:', isMapLoaded);

  return (
    <div className={styles.app}>
      <ErrorBoundary>
        <div className={styles.appContainer}>
          {isLoadingVisible && (
            <LoadingIndicators.Fallback
              isLoading={!error && !poisError}
              isLoaded={false}
              error={error || poisError ? new Error(errorMessage || '') : null}
              message={loadingMessage}
              variant="spinner"
              spinnerClassName={styles.fullPageLoader}
              isFading={isFading}
              onRetry={error || poisError ? actions.retryMapLoad : undefined}
            />
          )}

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

          <Map
            onLoad={actions.handleMapLoad}
            pois={allPois}
            selectedPoi={selectedPoi}
            onMarkerClick={handleMarkerClick}
          />

          <MapControls
            onResetNorth={resetNorth}
            onGetCurrentLocation={handleGetCurrentLocation}
            onFitMarkers={handleFitMarkers}
          />

          {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
        </div>
      </ErrorBoundary>
    </div>
  );
};

// DOMへのレンダリング処理
const container = document.getElementById('app');

// アプリケーションのマウントポイントが存在しない場合はエラーをスロー
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

// React 18のcreateRootAPIを使用してレンダリング
const root = createRoot(container);
root.render(<App />);
