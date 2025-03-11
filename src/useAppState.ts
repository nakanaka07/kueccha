import { createError } from '@/index';
import { useState, useCallback, useEffect } from 'react';
import type { Poi } from '@/index';

/**
 * アプリケーション全体の状態を管理するフック
 * （マップ関連のみに責任を制限）
 */
export function useAppState() {
  // マップ関連の状態のみを管理
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<AppError | null>(null);

  // ローディング表示制御
  const [loading, setLoading] = useState({
    isVisible: true,
    isFading: false,
  });

  // マップ関連のアクションのみを提供
  const actions = {
    setMapInstance,
    setIsMapLoaded,
    setIsMapLoading,
    setMapError,
    // その他のマップ関連アクション
  };

  // ローディング状態の更新
  useEffect(() => {
    // ローディングロジック
  }, [isMapLoaded, isMapLoading]);

  return {
    // マップ関連状態のみ
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading,
    error: mapError,
    actions,
  };
}
