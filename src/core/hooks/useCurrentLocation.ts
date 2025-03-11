// src/core/hooks/useCurrentLocation.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { CURRENT_LOCATION_POI } from '@core/constants/areas';
import { CONFIG } from '@core/constants/config';
import { GeolocationService } from '@core/services/geolocation';
import type { LatLngLiteral, GeolocationError } from '@core/types';
import type { Poi } from '@core/types/poi';

export function useCurrentLocation(options?: {
  autoRequest?: boolean; // 自動的に位置情報を取得するか
  watchPosition?: boolean; // 位置情報を監視するか
  geolocationOptions?: Partial<typeof CONFIG.maps.geolocation>; // 詳細オプション
}) {
  const opts = {
    autoRequest: false,
    watchPosition: false,
    geolocationOptions: {},
    ...options,
  };

  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<GeolocationError | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // 位置情報取得の関数（既存コードを少し強化）
  const getCurrentLocationInfo = useCallback(() => {
    setIsLocating(true);

    GeolocationService.getCurrentPosition(
      {
        onSuccess: (location) => {
          setCurrentLocation(location);
          setIsLocating(false);
        },
        onError: (error) => {
          setLocationError({
            code: error.code,
            message: error.message,
          });
          setShowWarning(true);
          setIsLocating(false);
        },
      },
      opts.geolocationOptions,
    );
  }, [opts.geolocationOptions]);

  const startWatchingLocation = useCallback(() => {
    const id = GeolocationService.watchPosition({
      onSuccess: (location) => {
        setCurrentLocation(location);
      },
      onError: (error) => {
        setLocationError({
          code: error.code,
          message: error.message,
        });
      },
    });
    setWatchId(id);
  }, []);

  const stopWatchingLocation = useCallback(() => {
    if (watchId !== null) {
      GeolocationService.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // 現在地POIの生成（既存コード）
  const currentLocationPoi = useMemo(() => {
    if (!currentLocation) return null;
    return {
      ...CURRENT_LOCATION_POI,
      location: currentLocation,
    };
  }, [currentLocation]);

  // ユーザー設定の読み込み
  useEffect(() => {
    try {
      const savedSetting = localStorage.getItem('location_enabled');
      if (savedSetting === 'true') {
        getCurrentLocationInfo();
      }
    } catch (e) {
      console.error('設定の読み込みに失敗しました', e);
    }
  }, [getCurrentLocationInfo]);

  // 位置情報の有効/無効を設定する関数
  const setLocationEnabled = useCallback(
    (enabled: boolean) => {
      try {
        localStorage.setItem('location_enabled', enabled.toString());
        if (enabled) {
          getCurrentLocationInfo();
        }
      } catch (e) {
        console.error('設定の保存に失敗しました', e);
      }
    },
    [getCurrentLocationInfo],
  );

  // オプションに基づいて初期化
  useEffect(() => {
    if (opts.autoRequest) {
      getCurrentLocationInfo();
    }

    if (opts.watchPosition) {
      startWatchingLocation();
      return () => stopWatchingLocation();
    }
  }, [opts.autoRequest, opts.watchPosition, getCurrentLocationInfo, startWatchingLocation, stopWatchingLocation]);

  const clearError = useCallback(() => {
    setLocationError(null);
    setShowWarning(false);
  }, []);

  return {
    currentLocation,
    currentLocationPoi,
    showWarning,
    setShowWarning,
    getCurrentLocationInfo,
    isLocating,
    locationError,
    setLocationEnabled,
    startWatchingLocation,
    stopWatchingLocation,
    clearError, // エラークリア関数を追加
  };
}

/**
 * シンプルに現在位置のPOIのみを返すユーティリティフック
 * @returns 現在位置のPOIオブジェクト、または位置情報がない場合はnull
 */
export function useCurrentLocationPoi() {
  const { currentLocationPoi } = useCurrentLocation();
  return currentLocationPoi;
}

/**
 * 現在地のPOIとその他のPOIを適切に結合するフック
 * @param pois 結合するPOIリスト
 * @param currentLocationPoi 現在地POI（省略時はuseCurrentLocationから取得）
 * @param showCurrentLocation 現在地を表示するかどうか
 * @returns 結合されたPOIリスト
 */
export function useCombinedPois(
  pois: Poi[] | null | undefined,
  customCurrentLocationPoi?: Poi | null,
  showCurrentLocation = true,
): Poi[] {
  // 現在地POIが明示的に渡されない場合はフックから取得
  const { currentLocationPoi: defaultCurrentLocationPoi } = useCurrentLocation();
  const actualCurrentLocationPoi = customCurrentLocationPoi ?? defaultCurrentLocationPoi;

  return useMemo(() => {
    // 既存の結合ロジック
    if (!pois || pois.length === 0) {
      return showCurrentLocation && actualCurrentLocationPoi ? [actualCurrentLocationPoi] : [];
    }

    if (!showCurrentLocation || !actualCurrentLocationPoi) {
      return [...pois];
    }

    const hasCurrentLocationId = pois.some((poi) => poi.id === actualCurrentLocationPoi.id);

    if (hasCurrentLocationId) {
      return pois.map((poi) => (poi.id === actualCurrentLocationPoi.id ? actualCurrentLocationPoi : poi));
    }

    return [actualCurrentLocationPoi, ...pois];
  }, [pois, actualCurrentLocationPoi, showCurrentLocation]);
}
