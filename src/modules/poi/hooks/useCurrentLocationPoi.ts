import { useMemo } from 'react';
import { CURRENT_LOCATION_POI } from '../../../constants/areas';
import type { Poi, LatLngLiteral } from '../../../types/poi';

/**
 * 現在地のPOIを生成するカスタムフック
 *
 * @param currentLocation - 現在地の座標情報
 * @returns 現在地POIオブジェクトまたはnull（現在地が未取得の場合）
 *
 * @example
 * // 使用例
 * const currentLocation = {...};  // GeolocationAPIなどから取得
 * const currentLocationPoi = useCurrentLocationPoi(currentLocation);
 * if (currentLocationPoi) {
 *   // 現在地POIをマーカー表示などに利用
 * }
 */
export function useCurrentLocationPoi(currentLocation: LatLngLiteral | null): Poi | null {
  return useMemo(() => {
    // 現在地情報が取得できていない場合
    if (!currentLocation) return null;

    // 座標値の妥当性チェック（実際の地図表示で問題が起きる可能性を防止）
    const isValidLatitude = currentLocation.lat >= -90 && currentLocation.lat <= 90;
    const isValidLongitude = currentLocation.lng >= -180 && currentLocation.lng <= 180;

    if (!isValidLatitude || !isValidLongitude) {
      console.warn('不正な座標データが検出されました:', currentLocation);
      return null;
    }

    // 現在地POIを生成（位置情報のみ更新）
    return {
      ...CURRENT_LOCATION_POI,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      },
    };
  }, [currentLocation?.lat, currentLocation?.lng]); // 依存配列を最適化
}
