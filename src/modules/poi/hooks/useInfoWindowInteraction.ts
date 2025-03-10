import { useEffect, useRef } from 'react';

export function useInfoWindowInteraction(onCloseClick: () => void) {
  const windowRef = useRef<HTMLDivElement>(null);

  const handleResize = () => {
    if (windowRef.current) {
      const windowHeight = window.innerHeight;
      const maxHeight = windowHeight - 150;
      windowRef.current.style.maxHeight = `${maxHeight}px`;
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (windowRef.current && !windowRef.current.contains(event.target as Node)) {
      onCloseClick();
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return {
    windowRef,
  };
}
