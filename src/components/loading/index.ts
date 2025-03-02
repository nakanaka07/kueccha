import { useLoadingState } from '../../hooks/useLoadingState';
import { LoadingFallback } from '../loadingfallback/LoadingFallback';
import { SkeletonLoader } from '../skeleton/SkeletonLoader';
import { Spinner } from '../spinner/Spinner';

export { useLoadingState };
export { Spinner };
export { LoadingFallback };
export { SkeletonLoader };

export const LoadingIndicators = {
  Spinner,
  Fallback: LoadingFallback,
  Skeleton: SkeletonLoader,
};
