import { useState, useCallback, useMemo, useEffect } from 'react';
import { CURRENT_LOCATION_POI } from '../constants/area.constants';
import { CONFIG } from '../constants/config.constants';
import { GeolocationService } from '../service/geolocation.service';
import type { LatLngLiteral } from '../types/common.types';
import type { GeolocationError } from '../types/error.types';
import type { Poi } from '../types/poi.types';

export function useCurrentLocation(options?: {
  autoRequest?: boolean;
  watchPosition?: boolean;
  geolocationOptions?: Partial<typeof CONFIG.maps.geolocation>;
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

  const currentLocationPoi = useMemo(() => {
    if (!currentLocation) return null;
    return {
      ...CURRENT_LOCATION_POI,
      location: currentLocation,
    };
  }, [currentLocation]);

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
    clearError,
  };
}

export function useCurrentLocationPoi() {
  const { currentLocationPoi } = useCurrentLocation();
  return currentLocationPoi;
}

export function useCombinedPois(
  pois: Poi[] | null | undefined,
  customCurrentLocationPoi?: Poi | null,
  showCurrentLocation = true,
): Poi[] {
  const { currentLocationPoi: defaultCurrentLocationPoi } = useCurrentLocation();
  const actualCurrentLocationPoi = customCurrentLocationPoi ?? defaultCurrentLocationPoi;

  return useMemo(() => {
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
