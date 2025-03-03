import { useState, useCallback, useEffect } from 'react';
import { useAreaVisibility } from './useAreaVisibility';
import { useLoadingState } from './useLoadingState';
import { useLocationWarning } from './useLocationWarning';
import { useMapState } from './useMapState';
import { usePoiState } from './usePoiState';
import { CONFIG } from '../utils/config';
import { APP, ERROR_MESSAGES } from '../utils/constants';
import type { Poi, AppError, LatLngLiteral } from '../utils/types';

export const useAppState = (pois: Poi[]) => {
  const mapState = useMapState();
  const poiState = usePoiState(pois);
  const { areaVisibility, setAreaVisibility } = useAreaVisibility();
  const locationWarning = useLocationWarning();
  const [error, setError] = useState<AppError | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);

  // APP.ui.loadingDelayから遅延時間を取得して使用
  const { isVisible, isFading } = useLoadingState(
    mapState.isLoading,
    mapState.isMapLoaded,
    APP.ui.loadingDelay || 5000,
  );

  // CONFIG.maps.geolocationの設定を使用して位置情報を取得
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        message: ERROR_MESSAGES.GEOLOCATION.UNKNOWN,
        code: 'GEOLOCATION_NOT_SUPPORTED',
      });
      return;
    }

    const geolocationOptions = {
      timeout: CONFIG.maps.geolocation.timeout,
      maximumAge: CONFIG.maps.geolocation.maxAge,
      enableHighAccuracy: CONFIG.maps.geolocation.highAccuracy,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (geoError) => {
        let errorMessage: string = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
        let errorCode = 'GEOLOCATION_UNKNOWN_ERROR';

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
            errorCode = 'GEOLOCATION_PERMISSION_DENIED';
            locationWarning.setShowWarning(true);
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
            errorCode = 'GEOLOCATION_POSITION_UNAVAILABLE';
            break;
          case geoError.TIMEOUT:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
            errorCode = 'GEOLOCATION_TIMEOUT';
            break;
        }

        setError({ message: errorMessage, code: errorCode });
      },
      geolocationOptions,
    );
  }, [locationWarning]);

  const retryMapLoad = useCallback(() => {
    setError(null);
    if (mapState.isMapLoaded) {
      // マップが読み込まれている場合は、位置情報の取得を試みる
      getUserLocation();
    } else {
      // マップが読み込まれていない場合は、マップの再読み込みを試みる
      // mapInstanceがある場合は引数として渡す
      if (mapState.mapInstance) {
        mapState.handleMapLoad(mapState.mapInstance);
      } else {
        // mapInstanceがない場合はエラーを設定
        setError({
          message: ERROR_MESSAGES.MAP.LOAD_FAILED,
          code: 'MAP_INSTANCE_MISSING',
        });
      }
    }
  }, [mapState, getUserLocation]);

  // マップの読み込み完了時に位置情報を取得
  useEffect(() => {
    if (mapState.isMapLoaded && !currentLocation && !error) {
      getUserLocation();
    }
  }, [mapState.isMapLoaded, currentLocation, getUserLocation, error]);

  // エラー状態の監視
  // mapStateからエラー情報を取得する代わりに、他の方法でエラーを検出
  useEffect(() => {
    // マップ読み込み中にエラーが発生した場合の処理
    if (!mapState.isMapLoaded && !mapState.isLoading && !error) {
      setError({
        message: ERROR_MESSAGES.MAP.LOAD_FAILED,
        code: 'MAP_LOADING_ERROR',
      });
    }
  }, [mapState.isMapLoaded, mapState.isLoading, error]);

  return {
    ...mapState,
    ...poiState,
    isMapLoaded: mapState.isMapLoaded,
    areaVisibility,
    setAreaVisibility,
    ...locationWarning,
    isMapLoading: mapState.isLoading,
    error,
    currentLocation,
    loading: {
      isVisible,
      isFading,
    },
    actions: {
      handleMapLoad: mapState.handleMapLoad,
      setSelectedPoi: poiState.setSelectedPoi,
      retryMapLoad,
      getUserLocation,
    },
  };
};
