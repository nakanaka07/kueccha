/*
 * 機能: ブラウザのGeolocation APIを利用した位置情報取得機能を提供するカスタムフック
 * 依存関係:
 *   - React (useCallback)
 *   - GeolocationService（位置情報サービス）
 *   - CONFIG（位置情報設定）
 *   - 型定義: GeolocationError, LatLngLiteral
 * 注意点:
 *   - ユーザーの位置情報へのアクセス許可が必要
 *   - モバイルデバイスと一部ブラウザでは精度や動作が異なる場合がある
 *   - 位置情報の取得、監視開始、監視停止の3つの主要機能を提供
 */

import { useCallback } from 'react';
import { CONFIG } from '../../../constants/config';
import { GeolocationService } from '../../../core/services/geolocation';
import type { GeolocationError, LatLngLiteral } from '../../../types/common';

/**
 * 位置情報取得のカスタムフック
 *
 * @returns getCurrentPosition - 現在位置を取得する関数
 */
export const useGeolocation = () => {
  /**
   * 現在の位置情報を取得する
   */
  const getCurrentPosition = useCallback(
    (
      callbacks: {
        onSuccess: (location: LatLngLiteral) => void;
        onError: (error: GeolocationError) => void;
      },
      options?: Partial<typeof CONFIG.maps.geolocation>,
    ) => {
      // サービスにロジックを委譲
      GeolocationService.getCurrentPosition(callbacks, options);
    },
    [],
  );

  /**
   * 位置情報の監視を開始する
   */
  const watchPosition = useCallback(
    (
      callbacks: {
        onSuccess: (location: LatLngLiteral) => void;
        onError: (error: GeolocationError) => void;
      },
      options?: Partial<typeof CONFIG.maps.geolocation>,
    ) => {
      return GeolocationService.watchPosition(callbacks, options);
    },
    [],
  );

  /**
   * 位置情報の監視を停止する
   */
  const clearWatch = useCallback((watchId: number) => {
    GeolocationService.clearWatch(watchId);
  }, []);

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
};
