// hooks/useMap.ts
import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { CONFIG } from '../config';

console.log('useMap.ts: Initializing useMap hook');

export function useMap() {
  console.log('useMap.ts: useMap hook called');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('useMap.ts: Starting map initialization');

    if (!CONFIG.maps) {
      console.error('useMap.ts: CONFIG.maps is undefined. Check your config file.');
      setError(new Error('CONFIG.maps is undefined.'));
      return;
    }

    const loader = new Loader({
      apiKey: CONFIG.maps.apiKey,
      version: CONFIG.maps.version,
      libraries: [...CONFIG.maps.libraries],
      language: CONFIG.maps.language,
    });

    console.log('useMap.ts: Loading Google Maps with config:', {
      version: CONFIG.maps.version,
      libraries: CONFIG.maps.libraries,
      language: CONFIG.maps.language,
      apiKey: CONFIG.maps.apiKey ? 'Present' : 'Missing', // APIキーの有無を確認
    });

    loader
      .importLibrary('maps')
      .then(() => {
        console.log('useMap.ts: Google Maps API loaded successfully');
      })
      .catch((err) => {
        console.error('useMap.ts: Error loading Google Maps API:', err);
        setError(err);
      });
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    console.log('useMap.ts: Map instance loaded');
    setMap(map);
    setIsLoaded(true);
  }, []);

  return { map, isLoaded, error, onMapLoad };
}
