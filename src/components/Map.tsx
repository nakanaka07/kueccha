import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { ErrorDisplay } from './ErrorDisplay';
import { LoadingFallback } from './LoadingFallback';
import { ERROR_MESSAGES, Map as MapConstants } from '../constants';
import { DEFAULT_LOADING_TIMEOUT } from '../constants/loading.constants';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { useMapControl } from '../hooks/useMapControl';
import type { MapLoadResult } from '../types/maps.types';
import type { MapComponentProps } from '../types/ui.types';
import { createError } from '../utils/errors.utils';
import { logError } from '../utils/logger';

if (!(MapConstants.Config.apiKey && MapConstants.Config.mapId)) {
  throw createError('MAP', 'CONFIG_ERROR', ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

export const Map: React.FC<MapComponentProps> = ({ onLoad, setIsMapLoaded, eventHandlers }) => {
  const { isMobile } = useDeviceDetection();
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MapConstants.Config.apiKey,
    mapIds: [MapConstants.Config.mapId],
    libraries: MapConstants.Config.libraries,
    version: MapConstants.Config.version,
    language: MapConstants.Config.language,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<Error | null>(null);
  const { resetNorth, handleGetCurrentLocation } = useMapControl(mapRef.current);

  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      const result: MapLoadResult = { success: true, map };
      onLoad?.(result);
      setIsMapLoaded?.(true);

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
    },
    [onLoad, setIsMapLoaded, eventHandlers],
  );

  const handleRetry = useCallback(() => {
    setMapError(null);
    window.location.reload();
  }, []);

  const handleMapError = useCallback((e: Error) => {
    const errorMessage = e.message || ERROR_MESSAGES.MAP.RENDER_FAILED;
    setMapError(createError('MAP', 'RENDER_ERROR', errorMessage));
    logError('MAP', 'RENDER_ERROR', errorMessage);
  }, []);

  const mapContainerStyle = useMemo(
    () => (isMobile ? MapConstants.MOBILE_MAP_CONTAINER_STYLE : MapConstants.MAP_CONTAINER_STYLE),
    [isMobile],
  );

  const mapOptions = useMemo(
    () => ({
      ...MapConstants.Config.options,
      mapId: MapConstants.Config.mapId,
      ...(isMobile ? MapConstants.Config.mobileOptions : {}),
    }),
    [isMobile],
  );

  if (!isLoaded) {
    return (
      <LoadingFallback
        message="地図データを読み込み中..."
        timeout={DEFAULT_LOADING_TIMEOUT}
        onRetry={handleRetry}
        spinnerSize="large"
        aria-label="地図データを読み込み中"
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
        aria-label="佐渡島の観光情報地図"
        onError={handleMapError}
      />
    </div>
  );
};

export default Map;
