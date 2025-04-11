import { Loader } from '@googlemaps/js-api-loader';
import { useState, useEffect, useCallback, useRef } from 'react';

import { getLoaderOptions } from '@/constants/maps';
import { getEnvVar } from '@/utils/env';
import { logger } from '@/utils/logger';

// 定数の外部化
const DEFAULT_INIT_TIMEOUT_MS = 15000; // 15秒
const SADO_CENTER = { lat: 38.0413, lng: 138.3689 }; // 佐渡島の中心あたり
// MIN_LOADER_RETRY_DELAY_MSは使用されていないため削除

/**
 * Google Maps APIの初期化に必要な環境変数を検証する
 */
function validateMapsEnvironmentVars(): {
  apiKey: string;
  mapId?: string;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const apiKey = getEnvVar({ key: 'VITE_GOOGLE_API_KEY', defaultValue: '' });
  const mapId = getEnvVar({ key: 'VITE_GOOGLE_MAPS_MAP_ID', defaultValue: '' });

  // APIキーの検証 (必須)
  if (!apiKey) {
    errors.push('Google Maps APIキーが設定されていません');
  }

  // マップIDの検証 (任意だが警告)
  if (!mapId) {
    logger.warn(
      'Google Maps Map IDが設定されていません。Advanced Markerが正常に動作しない可能性があります。',
      { component: 'useGoogleMaps' }
    );
  }

  return {
    apiKey,
    mapId,
    isValid: errors.length === 0,
    errors,
  };
}

export interface GoogleMapsState {
  isLoaded: boolean;
  error: string | null;
  map: google.maps.Map | null;
}

export interface UseGoogleMapsOptions {
  /** マップを表示する要素のID */
  elementId: string;

  /** 初期中心座標 (デフォルト: 佐渡島の中心あたり) */
  center?: { lat: number; lng: number };

  /** 初期ズームレベル */
  zoom?: number;

  /** 地図の読み込み完了時のコールバック */
  onMapLoaded?: (map: google.maps.Map) => void;

  /** 初期化をスキップするかどうか */
  skipInit?: boolean;

  /** 初期化のタイムアウト時間(ミリ秒) */
  initTimeout?: number;
}

/**
 * Google Mapsを初期化して管理するカスタムフック
 * KISS原則に基づいてシンプル化されています
 */
export function useGoogleMaps({
  elementId,
  center = SADO_CENTER,
  zoom = 11,
  onMapLoaded,
  skipInit = false,
  initTimeout = DEFAULT_INIT_TIMEOUT_MS,
}: UseGoogleMapsOptions): GoogleMapsState {
  const [state, setState] = useState<GoogleMapsState>({
    isLoaded: false,
    error: null,
    map: null,
  });

  // マップインスタンスの参照を保持
  const mapRef = useRef<google.maps.Map | null>(null);
  // 初期化が進行中かどうかのフラグ
  const initializingRef = useRef<boolean>(false);
  // タイムアウトIDの参照
  const timeoutIdRef = useRef<number | null>(null);

  // マップをクリーンアップする
  const cleanupMap = useCallback(() => {
    if (timeoutIdRef.current) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (mapRef.current) {
      mapRef.current = null;
    }

    setState({
      isLoaded: false,
      error: null,
      map: null,
    });
  }, []);

  // マップ要素を取得する
  const getMapElement = useCallback(() => {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`要素ID "${elementId}" が見つかりません`);
    }
    return element;
  }, [elementId]);
  // マップを初期化する
  const initializeMap = useCallback(async () => {
    // 既に初期化中または初期化済みの場合は何もしない
    if (initializingRef.current || mapRef.current) {
      return;
    }

    // 初期化中フラグを設定
    initializingRef.current = true;

    try {
      // 環境変数を検証
      const { apiKey, mapId, isValid, errors } = validateMapsEnvironmentVars();
      if (!isValid) {
        throw new Error(`環境変数の検証に失敗しました: ${errors.join('; ')}`);
      }

      // マップ要素を取得
      const mapElement = getMapElement();
      if (!mapElement) {
        throw new Error(`マップ要素 (ID: "${elementId}") が見つかりません`);
      }

      // ローダーを作成
      const loader = new Loader({
        apiKey,
        mapId,
        ...getLoaderOptions(),
      });

      // Google Mapsを読み込み
      const { Map } = await loader.importLibrary('maps');

      // マップを作成
      const mapInstance = new Map(mapElement, {
        center,
        zoom,
        mapId,
      });

      // 参照を更新
      mapRef.current = mapInstance;

      // 状態を更新
      setState({
        isLoaded: true,
        error: null,
        map: mapInstance,
      });

      // コールバックを実行
      if (onMapLoaded) {
        onMapLoaded(mapInstance);
      }

      logger.info('Google Maps APIの初期化が完了しました', { component: 'useGoogleMaps' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Google Maps APIの初期化に失敗しました', {
        component: 'useGoogleMaps',
        error: errorMessage,
      });

      setState({
        isLoaded: false,
        error: errorMessage,
        map: null,
      });
    } finally {
      // 初期化中フラグをリセット
      initializingRef.current = false;
    }
  }, [elementId, center, zoom, onMapLoaded, getMapElement]);
  // マップの初期化と必要に応じてタイムアウト処理を実行
  useEffect(() => {
    // 初期化をスキップする場合
    if (skipInit) {
      return undefined;
    }

    // マウント時に初期化
    initializeMap();

    // タイムアウトを設定
    timeoutIdRef.current = window.setTimeout(() => {
      // 初期化が完了していない場合のみタイムアウト処理を実行
      if (!initializingRef.current && !mapRef.current) {
        logger.warn('Google Maps APIの初期化がタイムアウトしました', {
          component: 'useGoogleMaps',
          timeoutMs: initTimeout,
        });

        setState(prev => ({
          ...prev,
          error: `Google Maps APIの読み込みがタイムアウトしました (${initTimeout}ms)`,
        }));
      }
    }, initTimeout);

    // アンマウント時にクリーンアップ
    return () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      cleanupMap();
    };
  }, [skipInit, initializeMap, cleanupMap, initTimeout]);

  return state;
}
