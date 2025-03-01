// useLoadingState.ts というファイルを作成
import { useState, useEffect } from 'react';

export function useLoadingState(isLoading: boolean, isLoaded: boolean, fadeDuration: number) {
  const [isVisible, setIsVisible] = useState(isLoading);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isLoading && isLoaded) {
      setIsFading(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, fadeDuration);

      return () => clearTimeout(timer);
    } else {
      setIsFading(false);
      setIsVisible(true);
    }
  }, [isLoaded, isLoading, fadeDuration]);

  return { isVisible, isFading };
}
