import { useMemo } from 'react';
import { CURRENT_LOCATION_POI } from '../../../core/constants/areas';
import { useCurrentLocation } from '../../../core/hooks/useCurrentLocation';
import type { LatLngLiteral } from '../../../core/types/common';
import type { Poi } from '../../../core/types/poi';

// 後方互換性のために既存のフック名を維持
export function useCurrentLocationPoi() {
  const { currentLocationPoi } = useCurrentLocation();
  return currentLocationPoi;
}
