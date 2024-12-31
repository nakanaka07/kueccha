import React, { useMemo } from 'react';
import { Marker as GoogleMapsMarker } from '@react-google-maps/api';
import type { Poi } from '../types';
import { MARKER_COLORS } from '../constants';

interface MarkerProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
}

const createMarkerSVG = (color: string) => `
  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/>
  </svg>
`;

const Marker = React.memo(({ poi, onClick }: MarkerProps) => {
  const color = MARKER_COLORS[poi.area] || MARKER_COLORS.DEFAULT;

  const markerIcon = useMemo(
    () => ({
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createMarkerSVG(color))}`,
      scaledSize: new google.maps.Size(20, 20),
      anchor: new google.maps.Point(10, 10),
    }),
    [color],
  );

  return (
    <GoogleMapsMarker
      position={poi.location}
      title={poi.name}
      icon={markerIcon}
      onClick={() => onClick(poi)}
      aria-label={`${poi.name}のマーカー`}
      options={{
        optimized: true,
        clickable: true,
      }}
    />
  );
});

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
