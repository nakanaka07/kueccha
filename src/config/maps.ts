import type { MapConfig } from '../types';
import { MARKER_COLORS } from '../constants';
import { LoadScriptProps } from '@react-google-maps/api';

const libraries: LoadScriptProps['libraries'] = ['places', 'geometry', 'drawing', 'marker'];

export const mapsConfig: MapConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  defaultCenter: { lat: 38.0, lng: 138.5 },
  defaultZoom: 10,
  libraries,
  language: 'ja',
  version: 'weekly',
  style: {
    width: '100%',
    height: '100%',
    disableDefaultUI: false,
    clickableIcons: false,
  },
  options: {
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  },
};

export const markerConfig = {
  colors: MARKER_COLORS,
};
