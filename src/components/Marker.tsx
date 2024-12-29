import React from 'react';
import { Marker as GoogleMapMarker } from '@react-google-maps/api';
import type { Poi } from '../types';
import { CONFIG } from '../config';

interface MarkerProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
}

const Marker = React.memo(({ poi, onClick }: MarkerProps) => {
  const color = CONFIG.markers.colors.areas[poi.area] || CONFIG.markers.colors.default;

  return (
    <GoogleMapMarker
      position={poi.location}
      title={poi.name}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10,
      }}
      onClick={() => onClick(poi)}
    />
  );
});

Marker.displayName = 'Marker';

export { Marker };
