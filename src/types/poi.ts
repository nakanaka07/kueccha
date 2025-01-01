import { LatLngLiteral } from './map';
import { AREAS, BUSINESS_HOURS } from '../constants';

export type AreaType = keyof typeof AREAS;
export type BusinessHourKey = (typeof BUSINESS_HOURS)[number]['key'];

export interface Poi extends PoiBusinessHours {
  id: string;
  name: string;
  area: AreaType;
  location: LatLngLiteral;
  category?: string;
  genre?: string;
  description?: string;
  reservation?: string;
  payment?: string;
  phone?: string;
  address?: string;
  information?: string;
  view?: string;
}

export type PoiBusinessHours = {
  [key in BusinessHourKey]?: string;
};
