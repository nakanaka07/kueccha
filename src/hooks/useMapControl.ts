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
// リセットボタンのアイコンを追加
import resetNorthIcon from '../utils/images/ano_icon04.png';

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

  // ...既存コードは変更なし...

  // マップが読み込まれていないか、エラーがある場合のレンダリング（既存コード）
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
      
      {/* 北向きリセットコントロールを追加（MapControls.tsxから移植） */}
      <div className="map-controls">
        <button 
          onClick={resetNorth} 
          title="北向きにリセットします。"
          className="map-control-button"
        >
          <img src={resetNorthIcon} alt="北向きにリセット" />
        </button>
      </div>
    </div>
  );
};

Map.displayName = 'Map';
export default Map;