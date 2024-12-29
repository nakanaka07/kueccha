// hooks/useMap.ts
import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { CONFIG } from '../config';

export function useMap() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!CONFIG.maps) {
      console.error("CONFIG.maps is undefined. Check your config file.");
      setError(new Error("CONFIG.maps is undefined."));
      return;
    }

    const loader = new Loader({
      apiKey: CONFIG.maps.apiKey,
      version: CONFIG.maps.version,
      libraries: [...CONFIG.maps.libraries],
      language: CONFIG.maps.language,
    });

    // Import the Google Maps library using the new importLibrary method
    loader
      .importLibrary('maps')
      .then(() => {
        // マップの読み込みが完了した後の処理は、onMapLoad コールバックで行う
      })
      .catch((err) => {
        console.error("Error loading Google Maps API:", err);
        setError(err);
      });
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsLoaded(true);
  }, []);

  return { map, isLoaded, error, onMapLoad };
}

