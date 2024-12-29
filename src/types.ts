// types.ts
import { Library } from '@googlemaps/js-api-loader';

export interface Location {
  lat: number;
  lng: number;
}

export interface MapConfig {
  apiKey: string;
  mapId: string;
  defaultCenter: Location;
  defaultZoom: number;
  libraries: Library[];
  language: string;
  version: string;
}

export const AREAS = {
  RYOTSU_AIKAWA: '両津・相川地区',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
  SNACK: 'スナック',
  PUBLIC_TOILET: '公共トイレ',
  PARKING: '駐車場',
  RECOMMEND: 'おすすめ',
} as const;

export type AreaType = keyof typeof AREAS;

export interface Poi {
  id: string;
  name: string;
  area: AreaType;
  location: { lat: number; lng: number };
  category?: string;
  genre?: string;
  description?: string;
  reservation?: string;
  payment?: string;
  phone?: string;
  address?: string;
  information?: string;
  view?: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
}
