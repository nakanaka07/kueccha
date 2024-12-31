import React, { useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import type { Poi } from '../types';
import { MARKER_COLORS } from '../constants';

interface MarkerProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
}

const Marker = React.memo(({ poi, onClick }: MarkerProps) => {
  const color = MARKER_COLORS[poi.area] || MARKER_COLORS.DEFAULT;

  const markerIcon = useMemo(
    () => ({
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8,
    }),
    [color],
  );

  return (
    <MarkerF
      position={poi.location}
      title={poi.name}
      icon={markerIcon}
      onClick={() => onClick(poi)}
    />
  );
});

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
