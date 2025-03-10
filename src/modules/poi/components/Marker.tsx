import React from 'react';
import { useMarkerElement } from '../hooks/useMarkerElement';
import { useMarkerInstance } from '../hooks/useMarkerInstance';
import { useMarkerInteraction } from '../hooks/useMarkerInteraction';
import type { MarkerProps } from '../../../core/types/poi';

const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    const markerElement = useMarkerElement(poi.area, poi.name);

    const markerRef = useMarkerInstance({
      position: poi.location,
      map,
      title: poi.name,
      zIndex,
      content: markerElement,
    });

    useMarkerInteraction({
      marker: markerRef.current,
      poi,
      onClick,
      isSelected,
    });

    return null;
  },
);

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
