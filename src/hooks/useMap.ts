// hooks/useMap.ts
import { useState, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { CONFIG } from '../config';

export function useMap() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!CONFIG.maps) {
      setError(new Error('マップの設定が見つかりません。設定ファイルを確認してください。'));
      return;
    }

    const loader = new Loader({
      apiKey: CONFIG.maps.apiKey,
      version: CONFIG.maps.version,
      libraries: [...CONFIG.maps.libraries],
      language: CONFIG.maps.language,
    });

    loader
      .importLibrary('maps')
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(new Error('Google Maps APIの読み込みに失敗しました。'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsLoaded(true);
  }, []);

  return {
    map,
    isLoaded,
    error,
    onMapLoad,
  };
}
