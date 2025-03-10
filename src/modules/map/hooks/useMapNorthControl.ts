import { useCallback } from 'react';
import { CONFIG } from '../../../core/constants/config';

export const useMapNorthControl = (map: google.maps.Map | null) => {
  const onResetNorth = useCallback(() => {
    try {
      if (!map) {
        console.warn('マップが初期化されていないため、向きをリセットできません');
        return;
      }

      map.setHeading(0);

      if (CONFIG.maps.options.zoomControl) {
      }
    } catch (error) {
      console.error('マップの向きリセット中にエラーが発生しました:', error);
    }
  }, [map]);

  return {
    onResetNorth,
  };
};
