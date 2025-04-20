import { Loader } from '@googlemaps/js-api-loader';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getEnvVar } from '@/utils/env/core';
import { logger } from '@/utils/logger';

// GoogleマップAPIライブラリの型定義
type GoogleMapsLibrary =
  | 'places'
  | 'geometry'
  | 'drawing'
  | 'visualization'
  | 'core'
  | 'maps'
  | 'marker';

// 型定義の改善
export interface GoogleMapsState {
  isLoaded: boolean;
  error: string | null;
  map: google.maps.Map | null;
}

// フックの引数オプションの型定義
export interface UseGoogleMapsHookOptions {
  initOptions?: google.maps.MapOptions;
  timeout?: number;
  onLoad?: (map: google.maps.Map) => void;
  onError?: (error: string) => void;
}

// APIキーと必要な環境変数の検証
function validateMapsEnvironmentVars() {
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
}

// ローダーオプションの設定を取得
function getLoaderOptions() {
  return {
    apiKey: getEnvVar({ key: 'VITE_GOOGLE_API_KEY', defaultValue: '' }),
    version: getEnvVar({ key: 'VITE_GOOGLE_MAPS_VERSION', defaultValue: 'weekly' }),
    libraries: ['places', 'geometry', 'drawing', 'visualization'] as GoogleMapsLibrary[],
    language: 'ja',
    region: 'JP',
  };
}

/**
 * Google Mapsを初期化して管理するカスタムフック
 * KISS原則に基づいてシンプル化されています
 */
export function useGoogleMaps(
  selector: string | null, // 型を string | null に変更
  options: UseGoogleMapsHookOptions = {}
): GoogleMapsState {
  const { initOptions = {}, timeout = 10000, onLoad, onError } = options;
  // 状態管理
  const [state, setState] = useState<GoogleMapsState>({
    isLoaded: false,
    error: null,
    map: null,
  });

  // refの管理
  const mapRef = useRef<google.maps.Map | null>(null);
  const loaderRef = useRef<Loader | null>(null);
  // 初期化状態を追跡するためのref（コンポーネントのトップレベルで定義）
  const isInitializedRef = useRef<boolean>(false);

  // 初期化処理 - パフォーマンス向上のための最適化
  const initializeMap = useCallback(async () => {
    // selector が null の場合は初期化しない
    if (!selector) {
      logger.debug('Selector is null, skipping map initialization.', {
        component: 'useGoogleMaps',
      });
      // 初期化しない場合の状態を設定することも検討できますが、
      // App.tsx 側で shouldLoadMap が false の場合は useGoogleMaps の結果 (特に error) を
      // 意図的に無視するロジックになっているため、ここでは何もしないか、
      // isLoaded: false, error: null の状態を維持します。
      // 必要であれば、初期化されないことを示す状態を追加しても良いでしょう。
      setState(prev => ({ ...prev, isLoaded: false, error: null, map: null }));
      return;
    }

    try {
      // 環境変数の検証
      const { isValid, errors } = validateMapsEnvironmentVars();
      if (!isValid) {
        throw new Error(`Google Maps API初期化エラー: ${errors.join(', ')}`);
      }

      // ローダーインスタンスの再利用（メモリ効率）
      if (!loaderRef.current) {
        const loaderOptions = getLoaderOptions();
        loaderRef.current = new Loader(loaderOptions);

        logger.info('Google Maps APIローダーを初期化しました', {
          component: 'useGoogleMaps',
          version: loaderOptions.version,
        });
      }

      // ローダーの初期化とタイムアウト処理
      const loadMapsApi = () => {
        return new Promise<typeof google.maps>((resolve, reject) => {
          if (!loaderRef.current) {
            reject(new Error('ローダーが初期化されていません'));
            return;
          }

          loaderRef.current
            .load()
            .then(google => resolve(google.maps))
            .catch(reject);
        });
      };

      // タイムアウト処理
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Google Maps APIのロードがタイムアウトしました (${timeout}ms)`)),
          timeout
        );
      });

      // どちらか先に完了した方を採用
      const mapsApi = await Promise.race([loadMapsApi(), timeoutPromise]);

      // マップインスタンスの作成
      if (!mapRef.current) {
        const container = document.querySelector(selector);
        if (!container) {
          throw new Error(`指定されたセレクタ「${selector}」に該当する要素が見つかりません`);
        }

        // マップ作成
        mapRef.current = new mapsApi.Map(container as HTMLElement, {
          center: { lat: 35.6812, lng: 139.7671 }, // デフォルト: 東京
          zoom: 12,
          ...initOptions,
        });

        logger.info('Google Mapsインスタンスを作成しました', {
          component: 'useGoogleMaps',
          selector: selector,
        });

        // 状態更新
        setState({
          isLoaded: true,
          error: null,
          map: mapRef.current,
        });

        // 成功コールバック
        onLoad?.(mapRef.current);
      }
    } catch (error) {
      // エラー情報を構造化
      const errorMsg = error instanceof Error ? error.message : String(error);

      logger.error('Google Maps APIの初期化に失敗しました', {
        component: 'useGoogleMaps',
        action: 'api_initialization_error',
        selector: selector,
        errorDetail: errorMsg,
      });

      setState(prev => ({
        ...prev,
        isLoaded: false,
        error: errorMsg,
        map: null,
      }));

      onError?.(errorMsg);
    }
  }, [selector, initOptions, timeout, onLoad, onError]); // 依存配列に selector を追加  // マップの初期化は selector が有効な場合にのみ実行
  useEffect(() => {
    // selector が null の場合は何もしない
    if (!selector) {
      return;
    }

    // 初期化済みでなく、まだロードもエラーも発生していない場合のみ初期化する
    if (!isInitializedRef.current && !state.isLoaded && !state.error) {
      isInitializedRef.current = true;
      initializeMap();
    }
  }, [selector, initializeMap, state.isLoaded, state.error]); // 依存配列に state.isLoaded と state.error を追加

  // コンポーネントのアンマウント時のみ実行されるクリーンアップ処理
  useEffect(() => {
    // コンポーネントのアンマウント時のみクリーンアップを実行
    return () => {
      if (mapRef.current) {
        // イベントリスナーの削除
        google.maps.event.clearInstanceListeners(mapRef.current);
        logger.debug('Google Maps リソースをクリーンアップしました', {
          component: 'useGoogleMaps',
          action: 'cleanup',
        });
      }
    };
  }, []); // 空の依存配列で、コンポーネントのアンマウント時のみ実行

  // mapRef は内部管理用とし、state のみを返す (KISS)
  return state;
}
