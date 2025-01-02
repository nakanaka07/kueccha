import { ReactNode, CSSProperties } from 'react';
import type { Poi, AreaType } from './poi';

export interface BaseProps {
  className?: string;
  style?: CSSProperties;
}

export interface MapProps extends BaseProps {
  pois: Poi[];
}

export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  onCloseClick: () => void;
}

export interface MarkerProps extends BaseProps {
  poi: Poi;
  onClick: (poi: Poi) => void;
  map: google.maps.Map | null;
}

export interface FilterPanelProps extends BaseProps {
  areaCounts: Record<AreaType, number>;
  areaVisibility: Record<AreaType, boolean>;
  onAreaToggle: (area: AreaType, visible: boolean) => void;
}

export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean;
  message?: string;
  spinnerClassName?: string;
}

export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode;
  fallback?: ReactNode;
}
