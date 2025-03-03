export * from './errorboundary/ErrorBoundary';
export * from './feedback/FeedbackForm';
export * from './filterpanel/FilterPanel';
export * from './hamburgermenu/HamburgerMenu';
export * from './infowindow/InfoWindow';
export * from './loadingfallback/LoadingFallback';
export * from './locationwarning/LocationWarning';
export * from './map/Map';
export * from './mapcontrols/MapControls';
export * from './marker/Marker';
export * from './searchbar/SearchBar';
export * from './searchresults/SearchResults';
export * from './spinner/Spinner';
export * from './skeleton/SkeletonLoader';

// 各コンポーネントを明示的にインポート
import { LoadingFallback } from './loadingfallback/LoadingFallback';
import { SkeletonLoader } from './skeleton/SkeletonLoader';
import { Spinner } from './spinner/Spinner';

export { useLoadingState } from '../hooks/useLoadingState';

// モダンなES Modules構文でオブジェクトを定義
export const LoadingIndicators = {
  Spinner,
  Fallback: LoadingFallback,
  Skeleton: SkeletonLoader,
};
