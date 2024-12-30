import React, { useMemo } from 'react';
import { Marker as GoogleMapMarker } from '@react-google-maps/api';
import type { Poi } from '../types';
import { CONFIG } from '../config';

interface MarkerProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
}

const Marker = React.memo(({ poi, onClick }: MarkerProps) => {
  const color = CONFIG.markers.colors.areas[poi.area] || CONFIG.markers.colors.default;

  const markerIcon = useMemo(
    () => ({
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 10,
    }),
    [color],
  );

  return (
    <GoogleMapMarker
      position={poi.location}
      title={poi.name}
      icon={markerIcon}
      onClick={() => onClick(poi)}
      options={{
        clickable: true,
        visible: true,
      }}
      aria-label={`${poi.name}の位置`}
    />
  );
});

Marker.displayName = 'Marker';

export { Marker };
