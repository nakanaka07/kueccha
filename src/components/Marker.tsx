import React, { useMemo } from 'react';
import { Marker as GoogleMapsMarker } from '@react-google-maps/api';
import type { Poi } from '../types';
import { CONFIG } from '../config';

interface MarkerProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
}

const Marker = React.memo(({ poi, onClick }: MarkerProps) => {
  const color = CONFIG.markers.colors.areas[poi.area] || CONFIG.markers.colors.default;

  const markerElement = useMemo(() => {
    const element = document.createElement('div');
    element.className = 'custom-marker';
    element.style.width = '20px';
    element.style.height = '20px';
    element.style.borderRadius = '50%';
    element.style.backgroundColor = color;
    element.style.border = '2px solid white';
    element.style.cursor = 'pointer';
    element.title = poi.name;

    return element;
  }, [color, poi.name]);

  return (
    <GoogleMapsMarker
      position={poi.location}
      title={poi.name}
      icon={{
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerElement.outerHTML),
        scaledSize: new google.maps.Size(20, 20),
      }}
      onClick={() => onClick(poi)}
    />
  );
});

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
