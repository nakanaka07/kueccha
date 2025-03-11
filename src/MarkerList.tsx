import React, { memo } from 'react';
import { Marker } from '../../poi/components/Marker';
import { useMapMarkers } from './use/useMapMarkers';
import type { Poi } from '../../../core/types/poi';

interface MarkerListProps {
  pois: Poi[];
  map: google.maps.Map | null;
  selectedPoi: Poi | null;
  onMarkerClick: (poi: Poi) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({ pois, map, selectedPoi, onMarkerClick }) => {
  const { getMarkerZIndex } = useMapMarkers();

  if (!map || pois.length === 0) return null;

  return (
    <>
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          poi={poi}
          map={map}
          onClick={onMarkerClick}
          isSelected={selectedPoi?.id === poi.id}
          zIndex={getMarkerZIndex(poi.area)}
        />
      ))}
    </>
  );
};

export default memo(MarkerList);
