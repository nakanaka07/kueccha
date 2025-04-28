import { Loader } from '@googlemaps/js-api-loader';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

import { getEnvVar } from '@/env/core';
import { logger } from '@/utils/logger';

/**
 * Google Maps APIライブラリの型定義
 * @description Google Maps APIで利用可能なライブラリ名を定義
 */
type GoogleMapsLibraries =
  | 'places'
  | 'geometry'
  | 'drawing'
  | 'visualization'
  | 'core'
  | 'maps'
  | 'marker';

/**
 * Google Mapsフックの状態型
 * @description フックが返す状態オブジェクトの型定義
 */
export interface GoogleMapsState {
  isLoaded: boolean;
  error: string | null;
  map: google.maps.Map | null;
  // 初期化状態を外部に公開（オプション）
  wasInitialized?: boolean;
}

/**
 * フックの引数オプションの型定義
 * @description useGoogleMapsフックに渡すオプションの型
 */
export interface UseGoogleMapsHookOptions {
  initOptions?: google.maps.MapOptions;
  timeout?: number;
  onLoad?: (map: google.maps.Map) => void;
  onError?: (error: string) => void;
  // 自動初期化を制御するためのオプション（デフォルトはtrue）
  autoInit?: boolean;
}

/**
 * マップ初期化結果の型定義
 * @description 初期化プロセスの結果を表す内部型
 */
interface MapInitResult {
  success: boolean;
  map: google.maps.Map | null;
  error: string | null;
}

/**
 * 環境変数検証の結果型
 */
interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * APIキーと必要な環境変数の検証
 * @returns 検証結果とエラーメッセージ
 */
const validateMapsEnvironmentVars = (): EnvValidationResult => {
  const required = ['VITE_GOOGLE_API_KEY'];
  const errors: string[] = [];

  required.forEach(key => {
    if (!getEnvVar({ key, defaultValue: '' })) {
      errors.push(`${key}が設定されていません`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * ローダーオプションの設定を取得
 * @returns Google Maps APIのローダーオプション
 */
const getLoaderOptions = () => {
  const mapId = getEnvVar({ key: 'VITE_GOOGLE_MAPS_MAP_ID', defaultValue: '' }).trim();
  const apiKey = getEnvVar({ key: 'VITE_GOOGLE_API_KEY', defaultValue: '' });
  const version = getEnvVar({ key: 'VITE_GOOGLE_MAPS_VERSION', defaultValue: 'weekly' });

  // ベースとなるオプション（必須項目）
  const baseOptions = {
    apiKey,
    version,
    libraries: [
      'places',
      'geometry',
      'drawing',
      'visualization',
      'marker',
    ] as GoogleMapsLibraries[],
    language: 'ja',
    region: 'JP',
  };

  // マップIDが存在する場合のみmapIdsプロパティを追加
  return mapId ? { ...baseOptions, mapIds: [mapId] } : baseOptions;
};

/**
 * マップオプションを構築する関数（単一責任原則に基づく分離）
 * @param initOptions ユーザー指定の初期化オプション
 * @returns 最終的なマップオプション
 */
const buildMapOptions = (initOptions: google.maps.MapOptions = {}): google.maps.MapOptions => {
  const mapId = getEnvVar({ key: 'VITE_GOOGLE_MAPS_MAP_ID', defaultValue: '' }).trim();

  // 基本オプション（東京中心をデフォルトに）
  const baseOptions: google.maps.MapOptions = {
    center: { lat: 35.6812, lng: 139.7671 },
    zoom: 12,
    ...initOptions,
  };

  // マップIDがある場合のみ追加
  return mapId ? { ...baseOptions, mapId } : baseOptions;
};

/**
 * Google Mapsを初期化して管理するカスタムフック
 *
 * @param selector マップを配置するDOM要素のCSSセレクタ、nullの場合は初期化をスキップ
 * @param options マップ初期化オプション
 * @returns Google Maps状態オブジェクト
 */
export function useGoogleMaps(
  selector: string | null,
  options: UseGoogleMapsHookOptions = {}
): GoogleMapsState {
  const { initOptions = {}, timeout = 10000, onLoad, onError, autoInit = true } = options;

  // 状態管理（状態更新を最小限に抑える）
  const [state, setState] = useState<GoogleMapsState>({
    isLoaded: false,
    error: null,
    map: null,
    wasInitialized: false,
  });

  // refの管理
  const mapRef = useRef<google.maps.Map | null>(null);
  const loaderRef = useRef<Loader | null>(null);

  // マップオプションをメモ化（不要な再計算を防止）
  const mapOptions = useMemo(() => buildMapOptions(initOptions), [initOptions]);

  // Google Mapsをロードする関数
  const loadGoogleMapsApi = useCallback(async (): Promise<typeof google.maps> => {
    if (!loaderRef.current) {
      const loaderOptions = getLoaderOptions();
      loaderRef.current = new Loader(loaderOptions);

      logger.info('Google Maps APIローダーを初期化しました', {
        component: 'useGoogleMaps',
        version: loaderOptions.version,
      });
    }

    return new Promise<typeof google.maps>((resolve, reject) => {
      if (!loaderRef.current) {
        reject(new Error('ローダーが初期化されていません'));
        return;
      }

      loaderRef.current
        .load()
        .then(google => resolve(google.maps))
        .catch(error => {
          logger.error('Google Maps APIのロードに失敗しました', {
            component: 'useGoogleMaps',
            error: error instanceof Error ? error.message : String(error),
          });
          reject(error);
        });
    });
  }, []);

  // マップインスタンスを作成する関数
  const createMapInstance = useCallback(
    async (maps: typeof google.maps, container: HTMLElement): Promise<google.maps.Map> => {
      const finalMapOptions = mapOptions;

      // マップID関連のロギング
      const mapId = getEnvVar({ key: 'VITE_GOOGLE_MAPS_MAP_ID', defaultValue: '' }).trim();
      if (mapId) {
        logger.debug('マップIDを設定しました', {
          component: 'useGoogleMaps',
          mapId,
        });
      }

      // マップインスタンス作成
      const mapInstance = new maps.Map(container, finalMapOptions);

      logger.info('Google Mapsインスタンスを作成しました', {
        component: 'useGoogleMaps',
        selectorExists: !!selector,
      });

      return mapInstance;
    },
    [mapOptions, selector]
  );

  // マップの初期化プロセス全体を管理する関数（単一責任原則）
  const initializeMap = useCallback(async (): Promise<MapInitResult> => {
    try {
      if (!selector) {
        logger.debug('セレクタがnullのため、マップ初期化をスキップします', {
          component: 'useGoogleMaps',
        });
        return { success: false, map: null, error: null };
      }

      // 既にマップが初期化済みの場合は早期リターン
      if (mapRef.current) {
        return { success: true, map: mapRef.current, error: null };
      }

      // 環境変数の検証
      const { isValid, errors } = validateMapsEnvironmentVars();
      if (!isValid) {
        const errorMsg = `Google Maps API初期化エラー: ${errors.join(', ')}`;
        throw new Error(errorMsg);
      }

      // APIロードとタイムアウト処理
      const mapsApiPromise = loadGoogleMapsApi();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Google Maps APIのロードがタイムアウトしました (${timeout}ms)`)),
          timeout
        );
      });

      // どちらか先に完了した方を採用
      const mapsApi = await Promise.race([mapsApiPromise, timeoutPromise]);

      // コンテナ要素の取得
      const container = document.querySelector(selector);
      if (!container) {
        throw new Error(`指定されたセレクタ「${selector}」に該当する要素が見つかりません`);
      }

      // マップインスタンスの作成
      const mapInstance = await createMapInstance(mapsApi, container as HTMLElement);
      mapRef.current = mapInstance;

      return { success: true, map: mapInstance, error: null };
    } catch (error) {
      // エラー情報を構造化
      const errorMsg = error instanceof Error ? error.message : String(error);

      logger.error('Google Maps APIの初期化に失敗しました', {
        component: 'useGoogleMaps',
        action: 'api_initialization_error',
        selector: selector || 'null',
        errorDetail: errorMsg,
      });

      return { success: false, map: null, error: errorMsg };
    }
  }, [selector, timeout, loadGoogleMapsApi, createMapInstance]);

  // 初期化処理の実行と状態の更新
  const runInitialization = useCallback(async () => {
    // 既に試行済みの場合は何もしない
    if (state.wasInitialized) {
      return;
    }

    const result = await initializeMap();

    // 状態の更新
    setState({
      isLoaded: result.success,
      error: result.error,
      map: result.map,
      wasInitialized: true,
    });

    // コールバックの呼び出し
    if (result.success && result.map && onLoad) {
      onLoad(result.map);
    } else if (!result.success && result.error && onError) {
      onError(result.error);
    }
  }, [initializeMap, onLoad, onError, state.wasInitialized]);

  // 自動初期化の実行
  useEffect(() => {
    // 自動初期化が無効または既に初期化済みの場合はスキップ
    if (!autoInit || state.wasInitialized) {
      return;
    }

    // selectorがnullでない場合のみ初期化を実行
    if (selector) {
      runInitialization();
    }
  }, [selector, autoInit, runInitialization, state.wasInitialized]);

  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      // マップインスタンスが存在する場合のみクリーンアップ
      if (mapRef.current) {
        try {
          // イベントリスナーの削除
          google.maps.event.clearInstanceListeners(mapRef.current);

          logger.debug('Google Maps リソースをクリーンアップしました', {
            component: 'useGoogleMaps',
            action: 'cleanup',
          });
        } catch (error) {
          logger.warn('Google Maps クリーンアップ中にエラーが発生しました', {
            component: 'useGoogleMaps',
            action: 'cleanup_error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };
  }, []);

  // 拡張した状態を返す
  return state;
}
