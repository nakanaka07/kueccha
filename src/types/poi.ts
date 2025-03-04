import { BaseProps, LatLngLiteral, AreaType } from './common';

export type Location = LatLngLiteral;

export interface Poi {
  id: string;
  name: string;
  location: LatLngLiteral;
  area: AreaType;
  genre: string;
  category: string;
  parking?: string;
  payment?: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
  holidayInfo?: string;
  information?: string;
  view?: string;
  phone?: string;
  address?: string;
  [key: string]: string | LatLngLiteral | AreaType | undefined;
}

export interface MarkerProps extends BaseProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
  map: google.maps.Map | null;
}

export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

export interface PoiManagementProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
}
