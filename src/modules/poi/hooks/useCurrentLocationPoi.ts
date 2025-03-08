/*
 * 機能: 現在地の情報をPOIオブジェクトとして管理するカスタムフック
 * 依存関係:
 *   - React useMemo
 *   - CURRENT_LOCATION_POI定数 (現在地POIのテンプレート)
 *   - Poi, LatLngLiteral型定義
 * 注意点:
 *   - 座標値の妥当性検証を実施 (-90≤lat≤90, -180≤lng≤180)
 *   - 無効な座標の場合はnullを返す
 *   - 依存配列を最適化し不要な再計算を防止
 */

import { useMemo } from 'react';
import { CURRENT_LOCATION_POI } from '../../../constants/areas';
import type { Poi, LatLngLiteral } from '../../../types/poi';

export function useCurrentLocationPoi(currentLocation: LatLngLiteral | null): Poi | null {
  return useMemo(() => {
    if (!currentLocation) return null;

    const isValidLatitude = currentLocation.lat >= -90 && currentLocation.lat <= 90;
    const isValidLongitude = currentLocation.lng >= -180 && currentLocation.lng <= 180;

    if (!isValidLatitude || !isValidLongitude) {
      console.warn('不正な座標データが検出されました:', currentLocation);
      return null;
    }

    return {
      ...CURRENT_LOCATION_POI,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      },
    };
  }, [currentLocation?.lat, currentLocation?.lng]);
}
