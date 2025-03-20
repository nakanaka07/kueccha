/**
 * Googleマップコンポーネント
 *
 * 地図の読み込みと表示を処理し、エラーハンドリングとローディング状態を管理します。
 * このコンポーネントはアプリケーションの中核となる地図表示機能を提供します。
 */
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ErrorDisplay } from './ErrorDisplay';
import { LoadingFallback } from './LoadingFallback';
import { Core, ERROR_MESSAGES, Map as MapConstants, UI } from '../constants';
import { DEFAULT_LOADING_TIMEOUT, RETRY_TIMEOUT } from '../constants/loading.constants';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { useMapControl } from '../hooks/useMapControl';
import { PWA, UI as UIService } from '../services';
import { createError } from '../utils/errors.utils';
import { logError } from '../utils/logger';

import type { LoadingStatus } from '../types/loading.types';
import type { MapLoadResult } from '../types/maps.types';
import type { MapComponentProps } from '../types/ui.types';

/**
 * 設定が正しいか事前検証
 */
if (!(MapConstants.Config.apiKey && MapConstants.Config.mapId)) {
  throw createError('MAP', 'CONFIG_ERROR', ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

/**
 * Googleマップコンポーネント
 *
 * @param onLoad - マップロード完了時に呼び出されるコールバック関数
 * @param setIsMapLoaded - マップのロード状態を更新する関数
 * @param eventHandlers - マップイベントハンドラ（オプション）
 */
export const Map: React.FC<MapComponentProps> = ({ onLoad, setIsMapLoaded, eventHandlers }) => {
  // デバイス検出フックの利用（モバイル対応）
  const { isMobile } = useDeviceDetection();

  // Google Maps APIをロード
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MapConstants.Config.apiKey,
    mapIds: [MapConstants.Config.mapId],
    libraries: MapConstants.Config.libraries,
    version: MapConstants.Config.version,
    language: MapConstants.Config.language,
  });

  // マップの参照を保持
  const mapRef = useRef<google.maps.Map | null>(null);

  // マップ固有のエラー状態
  const [mapError, setMapError] = useState<Error | null>(null);

  // ローディング状態のタイムアウト検知
  const [isTimeout, setIsTimeout] = useState<boolean>(false);

  // マップコントロールフックの初期化
  const { resetNorth, handleGetCurrentLocation } = useMapControl(mapRef.current);

  /**
   * タイムアウト検知のためのエフェクト
   */
  useEffect(() => {
    if (!isLoaded && !loadError) {
      const timer = setTimeout(() => {
        setIsTimeout(true);
        logError(
          'MAP',
          'LOAD_TIMEOUT',
          UI.Loading.default.message || 'マップの読み込みがタイムアウトしました',
        );
      }, DEFAULT_LOADING_TIMEOUT);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, loadError]);

  /**
   * マップロード完了時の処理
   */
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // 成功結果オブジェクトを作成
      const result: MapLoadResult = {
        success: true,
        map,
      };

      // コールバック関数を呼び出し
      onLoad?.(result);
      setIsMapLoaded?.(true);

      // イベントハンドラの登録
      if (eventHandlers) {
        if (eventHandlers.onClick) map.addListener('click', eventHandlers.onClick);
        if (eventHandlers.onDragEnd) map.addListener('dragend', eventHandlers.onDragEnd);
        if (eventHandlers.onZoomChanged) {
          map.addListener('zoom_changed', () => {
            const newZoom = map.getZoom();
            if (newZoom !== undefined) eventHandlers.onZoomChanged?.(newZoom);
          });
        }
        if (eventHandlers.onBoundsChanged) {
          map.addListener('bounds_changed', () => {
            const bounds = map.getBounds();
            if (bounds) eventHandlers.onBoundsChanged?.(bounds);
          });
        }
        if (eventHandlers.onIdle) map.addListener('idle', eventHandlers.onIdle);
      }

      // ログ出力（開発環境のみ）
      if (Core.IS_DEV) {
        console.log('🗺️ マップが正常に読み込まれました');
      }
    },
    [onLoad, setIsMapLoaded, eventHandlers],
  );

  /**
   * エラー発生時のリトライ処理
   */
  const handleRetry = useCallback(() => {
    setMapError(null);
    setIsTimeout(false);
    window.location.reload();
  }, []);

  /**
   * マップレンダリングエラー処理
   */
  const handleMapError = useCallback((e: Error) => {
    const errorMessage = e.message || ERROR_MESSAGES.MAP.RENDER_FAILED;
    setMapError(createError('MAP', 'RENDER_ERROR', errorMessage));
    logError('MAP', 'RENDER_ERROR', errorMessage);
  }, []);

  // マップコンテナのスタイルをメモ化
  const mapContainerStyle = useMemo(
    () => (isMobile ? MapConstants.MOBILE_MAP_CONTAINER_STYLE : MapConstants.MAP_CONTAINER_STYLE),
    [isMobile],
  );

  // マップオプションをメモ化 - デバイスに応じた設定を適用
  const mapOptions = useMemo(
    () => ({
      ...MapConstants.Config.options,
      mapId: MapConstants.Config.mapId,
      ...(isMobile ? MapConstants.Config.mobileOptions : {}), // モバイル用オプションを条件付きで適用
    }),
    [isMobile],
  );

  // ローディング中の表示
  if (!isLoaded) {
    return (
      <LoadingFallback
        message={
          isTimeout ? 'マップの読み込みに時間がかかっています...' : UI.Loading.default.message
        }
        timeout={RETRY_TIMEOUT}
        onRetry={isTimeout ? handleRetry : undefined}
        spinnerSize="large"
        aria-label={'地図データを読み込み中'}
        role="progressbar"
        aria-busy="true"
      />
    );
  }

  // API読み込みエラーの表示
  if (loadError) {
    logError('MAP', 'LOAD_ERROR', loadError.message);
    return (
      <ErrorDisplay
        type="map"
        message={loadError.message}
        detailMessage="Google Maps APIの読み込みに失敗しました。ネットワーク接続を確認してください。"
        onRetry={handleRetry}
      />
    );
  }

  // マップ固有のエラー表示
  if (mapError) {
    return (
      <ErrorDisplay
        type="map"
        message={mapError.message}
        detailMessage="マップの表示中にエラーが発生しました。"
        onRetry={handleRetry}
        alternativeActionText="ヘルプを表示"
        onAlternativeAction={() => window.open('/help/map-issues', '_blank')}
      />
    );
  }

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={MapConstants.Config.defaultCenter}
        zoom={MapConstants.Config.defaultZoom}
        options={mapOptions}
        onLoad={handleMapLoad}
        aria-label={'佐渡島の観光情報地図'}
        onError={handleMapError}
      />
    </div>
  );
};

Map.displayName = 'Map';
export default Map;