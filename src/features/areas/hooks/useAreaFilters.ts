import { useAreaFiltering } from './useAreaFiltering';
import type { AreaType } from '@core/types/common';
import type { Poi } from '@core/types/poi';

/**
 * @deprecated このフックは非推奨です。代わりに useAreaFiltering を使用してください。
 */
export function useAreaFilters(
  pois: Poi[],
  localAreaVisibility?: Record<AreaType, boolean>,
  setAreaVisibility?: (visibility: Record<AreaType, boolean>) => void,
) {
  console.warn('useAreaFilters は非推奨です。useAreaFiltering を使用してください。');
  const { areaFilters } = useAreaFiltering(pois);
  return areaFilters;
}
