import { useCallback } from 'react';
import type { LatLngLiteral } from '../types/types';

/**
 * Google Maps のコントロール機能を提供するカスタムフック
 * 
 * @param map - 制御対象のGoogle Mapインスタンス
 * @returns マップコントロール関数のオブジェクト
 */
const useMapControl = (map: google.maps.Map | null) => {
  /**
   * 地図を北向きにリセットする
   */
  const resetNorth = useCallback(() => {
    if (!map) return;
    
    map.setHeading(0);
  }, [map]);

  /**
   * 現在地を取得してその位置に移動する
   * @param zoom - 設定するズームレベル（省略可）
   */
  const handleGetCurrentLocation = useCallback((zoom?: number) => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPosition: LatLngLiteral = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.panTo(currentPosition);
        if (zoom) map.setZoom(zoom);
      },
      (error) => {
        console.error('現在地の取得に失敗しました:', error);
      }
    );
  }, [map]);

  return {
    resetNorth,
    handleGetCurrentLocation
  };
};

export default useMapControl;