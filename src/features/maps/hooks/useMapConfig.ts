import { useState, useEffect } from 'react';
import { MAPS_CONFIG } from '../../../core/constants/config';
import { ERROR_MESSAGES } from '../../../core/constants/messages';

export function useMapConfig() {
  const [configError, setConfigError] = useState<Error | null>(null);

  useEffect(() => {
    if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
      setConfigError(new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING));
    } else {
      setConfigError(null);
    }
  }, []);

  return {
    configError,
    apiKey: MAPS_CONFIG.apiKey || '',
    mapId: MAPS_CONFIG.mapId || '',
    libraries: MAPS_CONFIG.libraries,
    version: MAPS_CONFIG.version,
    language: MAPS_CONFIG.language,
    defaultCenter: MAPS_CONFIG.defaultCenter,
    defaultZoom: MAPS_CONFIG.defaultZoom,
    mapOptions: {
      ...MAPS_CONFIG.options,
      mapTypeControlOptions: {
        ...MAPS_CONFIG.options.mapTypeControlOptions,
        mapTypeIds: Array.from(MAPS_CONFIG.options.mapTypeControlOptions.mapTypeIds),
      },
    },
  };
}
