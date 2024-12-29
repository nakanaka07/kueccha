import React from 'react';
import { Marker as GoogleMapMarker } from '@react-google-maps/api';
import type { Poi } from '../types';
import { CONFIG } from '../config';

console.log('Marker.tsx: Initializing Marker component');

interface MarkerProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
}

const Marker = React.memo(({ poi, onClick }: MarkerProps) => {
  console.log('Marker.tsx: Rendering marker for:', poi.name);

  const color = CONFIG.markers.colors.areas[poi.area] || CONFIG.markers.colors.default;
  console.log('Marker.tsx: Using color:', color, 'for area:', poi.area);

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
      onClick={() => {
        console.log('Marker.tsx: Marker clicked:', poi.name);
        onClick(poi);
      }}
    />
  );
});

Marker.displayName = 'Marker';

export { Marker };
