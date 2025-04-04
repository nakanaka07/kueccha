import { Loader, type LoaderOptions } from '@googlemaps/js-api-loader';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { getLoaderOptions } from '@/constants/maps';
import { ENV, isDevEnvironment, getMapsApiVersion } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

/**
 * Google Maps APIの初期化に必要な環境変数を検証する
 * ガイドラインに従い、必須変数と任意変数を明確に区別する
 */
function validateMapsEnvironmentVars(): {
  apiKey: string;
  mapId?: string;
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const apiKey = ENV.google.apiKey;
  const mapId = ENV.google.mapId;

  // APIキーの検証 (必須)
  if (!apiKey) {
    errors.push(
      'Google Maps APIキーが設定されていません。.env ファイルの VITE_GOOGLE_API_KEY を確認してください。'
    );
  } else if (apiKey.length < 10) {
    errors.push('Google Maps APIキーが短すぎるか不正な形式です。');
  }

  // マップIDの検証 (任意だが警告)
  if (!mapId || mapId.length === 0) {
    logger.warn(
      'Google Maps Map IDが設定されていません。Advanced Markerが正常に動作しない可能性があります。',
      {
        component: 'useGoogleMaps',
        missingEnv: 'VITE_GOOGLE_MAPS_MAP_ID',
      }
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
 * マップ要素の取得を試みる関数
 * @param elementId マップ要素のID
 * @returns 見つかった要素または null
 */
const tryGetMapElement = (elementId: string): HTMLElement | null => {
  const logContext = { component: 'useGoogleMaps', action: 'element_lookup', elementId };

  // 通常の方法
  const byId = document.getElementById(elementId);
  if (byId) {
    logger.debug('マップ要素をIDで取得しました', logContext);
    return byId;
  }

  // querySelector()を使用した代替手段
  const bySelector = document.querySelector(`#${elementId}`);
  if (bySelector) {
    logger.debug('マップ要素をquerySelector経由で取得しました', {
      ...logContext,
      method: 'querySelector',
    });
    return bySelector as HTMLElement;
  }

  // ドキュメント内の全てのdiv要素を検索（id指定が誤っている場合に有効）
  const mapDivs = document.querySelectorAll('div.map-container');
  if (mapDivs.length > 0) {
    logger.warn(
      `ID "${elementId}"の要素が見つかりませんでしたが、マップらしき要素が見つかりました。`,
      {
        ...logContext,
        method: 'fallback_selector',
        foundElements: mapDivs.length,
      }
    );
    return mapDivs[0] as HTMLElement;
  }

  logger.warn(`マップ要素 (ID: "${elementId}") が見つかりません`, {
    ...logContext,
    documentReady: document.readyState,
  });
  return null;
};

/**
 * マップ要素を取得する（複数回試行）
 * @param elementId マップ要素のID
 * @returns 見つかったマップ要素
 * @throws 要素が見つからない場合はエラー
 */
const getMapElementWithRetry = async (elementId: string): Promise<HTMLElement> => {
  const logContext = { component: 'useGoogleMaps', action: 'get_map_element', elementId };

  // 最初の試行
  let mapElement = tryGetMapElement(elementId);

  // 要素が見つからない場合、短い遅延後に再試行
  if (!mapElement) {
    logger.debug('マップ要素が見つかりません。500ms後に再試行します...', logContext);
    await new Promise(resolve => setTimeout(resolve, 500));
    mapElement = tryGetMapElement(elementId);

    // 2回目の試行後も見つからない場合、さらに待機
    if (!mapElement) {
      logger.debug('マップ要素がまだ見つかりません。最後の試行として1秒後に再試行します...', {
        ...logContext,
        retryCount: 2,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      mapElement = tryGetMapElement(elementId);

      if (!mapElement) {
        // エラーメッセージを生成し、型安全に処理
        const errorMessage = `マップ要素が見つかりません。ID "${elementId}"のHTML要素が存在し、CSSで適切なサイズが設定されていることを確認してください。`;
        logger.error(errorMessage, {
          ...logContext,
          retryCount: 3,
          documentReady: document.readyState,
          visibleElements: document.querySelectorAll('*').length,
        });
        throw new Error(errorMessage);
      }
    }
  }

  return mapElement;
};

/**
 * マップインスタンスを作成する
 * @param mapElement マップを表示するHTML要素
 * @param center 地図の中心座標
 * @param zoom ズームレベル
 * @returns Google Maps インスタンス
 */
const createMapInstance = (
  mapElement: HTMLElement,
  center: { lat: number; lng: number },
  zoom: number
): google.maps.Map => {
  const logContext = {
    component: 'useGoogleMaps',
    action: 'create_map_instance',
    center,
    zoom,
  };

  // レスポンシブなマップオプションを取得
  const mapOptions: google.maps.MapOptions = logger.measureTime(
    'レスポンシブマップオプションの取得',
    () => getResponsiveMapOptions(),
    LogLevel.DEBUG,
    logContext
  );

  // マップIDの取得
  const mapId = ENV.google.mapId;

  if (!mapId || mapId.trim() === '') {
    logger.warn('マップIDが設定されていないか無効です', {
      component: 'useGoogleMaps',
      missingEnv: 'VITE_GOOGLE_MAPS_MAP_ID',
    });
  }

  // 引数で渡された値とマップIDを優先
  const options: google.maps.MapOptions = {
    ...mapOptions,
    center,
    zoom,
    ...(mapId ? { mapId } : {}),
  };

  logger.debug('マップインスタンスを作成中...', {
    ...logContext,
    hasMapId: !!mapId,
    mapElementSize: {
      width: mapElement.clientWidth,
      height: mapElement.clientHeight,
    },
  });

  // マップインスタンスの作成
  return new google.maps.Map(mapElement, options);
};

/**
 * 現在のデバイスに適したマップオプションを取得
 * @returns マップ初期化オプション
 */
export const getResponsiveMapOptions = (): google.maps.MapOptions => {
  const logContext = { component: 'useGoogleMaps', action: 'get_map_options' };

  const isMobile = isMobileDevice();
  logger.debug('デバイスタイプに基づくマップオプションを選択', {
    ...logContext,
    isMobileDevice: isMobile,
    selectedOption: isMobile ? 'MOBILE_MAP_OPTIONS' : 'DEFAULT_MAP_OPTIONS',
  });

  return isMobile ? MOBILE_MAP_OPTIONS : DEFAULT_MAP_OPTIONS;
};

/**
 * ローダーオプションを準備する
 * @param mapId マップID
 * @returns Google Maps ローダーオプション
 */
const prepareLoaderOptions = (mapId: string | undefined) => {
  const logContext = { component: 'useGoogleMaps', action: 'prepare_loader_options' };

  const loaderOptions = getLoaderOptions();

  if (mapId) {
    loaderOptions.mapIds = [mapId];
  } else {
    logger.warn('マップIDが設定されていません。.env ファイルを確認してください。', {
      ...logContext,
      missingEnv: 'VITE_GOOGLE_MAPS_MAP_ID',
    });
  }

  const mapIds = loaderOptions.mapIds as string[] | undefined;
  const libraries = loaderOptions.libraries as string[] | undefined;

  logger.debug('Google Maps APIをロード中...', {
    ...logContext,
    version: loaderOptions.version,
    libraries: libraries,
    hasMapId: mapIds && Array.isArray(mapIds) && mapIds.length > 0,
    mapIds: mapIds,
  });

  if (!mapIds || !Array.isArray(mapIds) || mapIds.length === 0) {
    loaderOptions.mapIds = mapId ? [mapId] : [];
  }

  return { loaderOptions, mapIds, libraries };
};

/**
 * Maps APIをロードする
 * @param loaderOptions ローダーオプション
 * @param apiKey Google Maps APIキー
 */
const loadMapsApi = async (loaderOptions: LoaderOptions, apiKey: string) => {
  const logContext = {
    component: 'useGoogleMaps',
    action: 'load_maps_api',
    apiVersion: loaderOptions.version,
  };

  const loader = new Loader({
    ...loaderOptions,
    apiKey,
  });

  await logger.measureTimeAsync(
    'Google Maps APIライブラリのロード',
    () => loader.load(),
    LogLevel.INFO,
    logContext
  );

  logger.debug('Google Maps APIのロードが完了しました', logContext);
};

/**
 * マップインスタンスを初期化する
 * @param elementId マップ要素のID
 * @param center 初期中心座標
 * @param zoom 初期ズームレベル
 * @returns 初期化されたGoogle Mapsインスタンス
 */
const initializeMapInstance = async (
  elementId: string,
  center: { lat: number; lng: number },
  zoom: number
) => {
  const logContext = {
    component: 'useGoogleMaps',
    action: 'initialize_map_instance',
    elementId,
  };

  logger.debug(`マップ要素ID "${elementId}" を検索中...`, logContext);

  const mapElement = await logger.measureTimeAsync(
    'マップ要素の取得',
    () => getMapElementWithRetry(elementId),
    LogLevel.DEBUG,
    logContext
  );

  const mapInstance = logger.measureTime(
    'マップインスタンスの作成',
    () => createMapInstance(mapElement, center, zoom),
    LogLevel.DEBUG,
    {
      ...logContext,
      center,
      zoom,
    }
  );

  return mapInstance;
};

/**
 * API初期化後の検証とログ記録を行う
 * @param loaderOptions ローダーオプション
 * @param libraries 要求されたライブラリ
 * @param mapIds 設定されたマップID
 */
const validateAndLogInitialization = (
  loaderOptions: LoaderOptions,
  libraries: string[] | undefined,
  mapIds: string[] | undefined
) => {
  const logContext = {
    component: 'useGoogleMaps',
    action: 'validate_initialization',
    requestedVersion: loaderOptions.version,
  };

  if (google.maps.version) {
    logger.info('Google Maps API初期化完了', {
      ...logContext,
      apiVersion: google.maps.version,
      environment: isDevEnvironment() ? 'development' : 'production',
    });
  }

  const hasMarkerLibrary = libraries && Array.isArray(libraries) && libraries.includes('marker');

  if (hasMarkerLibrary) {
    validateMarkerLibraries(libraries, mapIds);
  }
};

/**
 * マーカーライブラリの検証
 * @param libraries 要求されたライブラリ
 * @param mapIds 設定されたマップID
 */
const validateMarkerLibraries = (libraries: string[] | undefined, mapIds: string[] | undefined) => {
  const logContext = {
    component: 'useGoogleMaps',
    action: 'validate_marker_libraries',
    requestedLibraries: libraries,
  };

  const hasMarkerNamespace = typeof google.maps.marker !== 'undefined';

  if (!hasMarkerNamespace) {
    logger.warn('マーカーライブラリが読み込まれていません', logContext);
  } else if (!hasAdvancedMarkerSupport()) {
    logger.warn('Advanced Markerライブラリが使用できません。基本的なマーカー機能のみ利用可能です', {
      ...logContext,
      markerApiAvailable: true,
      hasValidMapId: mapIds && Array.isArray(mapIds) && mapIds.length > 0,
    });
  } else {
    const hasValidMapId = mapIds && Array.isArray(mapIds) && mapIds.length > 0;
    logger.info('Advanced Markerライブラリが利用可能です', {
      ...logContext,
      hasValidMapId,
    });
  }
};

/**
 * APIロードエラーを処理する
 * @param rawError エラーオブジェクト
 * @param loaderOptions ローダーオプション
 * @param apiKey APIキー
 * @param elementId マップ要素ID
 * @param mapIds マップID
 */
const handleApiLoadError = (
  rawError: unknown,
  loaderOptions: LoaderOptions,
  apiKey: string,
  elementId: string,
  mapIds: string[] | undefined
) => {
  const errorMessage = rawError instanceof Error ? rawError.message : String(rawError);

  logger.error('Google Maps APIのロードに失敗しました', {
    component: 'useGoogleMaps',
    action: 'api_load_error',
    version: loaderOptions.version,
    errorMessage,
    apiKeyValid: !!apiKey && apiKey.length > 10,
    elementId,
    hasMapId: mapIds && Array.isArray(mapIds) && mapIds.length > 0,
    stack: rawError instanceof Error ? rawError.stack : undefined,
  });

  throw new Error(`Google Maps APIのロードエラー: ${errorMessage}`);
};

/**
 * APIのロードとマップの初期化を行う
 * @param apiKey Google Maps API キー
 * @param elementId マップ要素のID
 * @param center 地図の中心座標
 * @param zoom ズームレベル
 * @returns 初期化されたGoogle Mapsインスタンス
 */
const loadAndInitializeMap = async (
  apiKey: string,
  elementId: string,
  center: { lat: number; lng: number },
  zoom: number
): Promise<google.maps.Map> => {
  const logContext = {
    component: 'useGoogleMaps',
    action: 'load_and_initialize',
    elementId,
    center,
    zoom,
  };

  const mapId = ENV.google.mapId;
  const { loaderOptions, mapIds, libraries } = prepareLoaderOptions(mapId);

  try {
    logger.debug('Google Maps APIおよびマップの初期化を開始します', logContext);

    // Google Maps APIのロード
    await loadMapsApi(loaderOptions, apiKey);

    // マップインスタンスの初期化
    const mapInstance = await initializeMapInstance(elementId, center, zoom);

    // 初期化後の検証とログ
    validateAndLogInitialization(loaderOptions, libraries, mapIds);

    logger.debug('Google Maps初期化が完了しました', {
      ...logContext,
      mapInstance: !!mapInstance,
      apiState: 'loaded',
    });

    return mapInstance;
  } catch (rawError: unknown) {
    handleApiLoadError(rawError, loaderOptions, apiKey, elementId, mapIds);
    throw rawError; // コンパイラが到達不可能コードとしてマークしないために必要
  }
};

/**
 * Advanced Marker APIがサポートされているか確認する
 * APIの存在確認を型安全に行う
 * @returns Advanced Markerをサポートしていればtrue
 */
function hasAdvancedMarkerSupport(): boolean {
  if (typeof google === 'undefined') return false;
  if (typeof google.maps === 'undefined') return false;
  if (typeof google.maps.marker === 'undefined') return false;

  // google.maps.markerをオブジェクトとして扱い、プロパティの存在をチェック
  const markerNamespace = google.maps.marker as object;
  return (
    'AdvancedMarkerElement' in markerNamespace &&
    // 念のため関数かどうかもチェック
    typeof (markerNamespace as Record<string, unknown>).AdvancedMarkerElement === 'function'
  );
}

/**
 * エラー状態を設定する処理
 * @param err エラーオブジェクト
 * @param setState 状態更新関数
 */
const setErrorState = (
  err: unknown,
  setState: React.Dispatch<React.SetStateAction<GoogleMapsState>>
): void => {
  // エラーメッセージの生成
  const errorMessage =
    err instanceof Error
      ? `地図の読み込みに失敗しました: ${err.message}`
      : '地図の読み込みに失敗しました。ネットワーク接続を確認してください。';

  // APIバージョン関連のエラーを検出
  const isVersionError =
    err instanceof Error && (err.message.includes('version') || err.message.includes('library'));

  // エラーの詳細をログに記録
  logger.error('マップ初期化エラー', {
    component: 'useGoogleMaps',
    action: 'initialization_error',
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    apiVersion: getMapsApiVersion(),
    isVersionRelated: isVersionError,
    environment: isDevEnvironment() ? 'development' : 'production',
  });

  // 状態の更新
  setState(prev => ({
    ...prev,
    isLoaded: true,
    error: errorMessage,
  }));
};

/**
 * 初期化タイムアウトを設定する
 * @param timeout タイムアウト時間(ms)
 * @param setState 状態更新関数
 * @returns タイムアウトID
 */
const setupInitTimeout = (
  timeout: number,
  setState: React.Dispatch<React.SetStateAction<GoogleMapsState>>
): number => {
  return window.setTimeout(() => {
    logger.error(`Google Maps初期化がタイムアウトしました（${timeout}ms）`, {
      component: 'useGoogleMaps',
      action: 'initialization_timeout',
      timeout,
    });

    setState(prev => ({
      ...prev,
      isLoaded: true,
      error: '地図の読み込みがタイムアウトしました。ページを再読み込みしてください。',
    }));
  }, timeout);
};

/**
 * マウント時の初期化処理
 * @param initMap 初期化関数
 * @param skipInit 初期化スキップフラグ
 * @param cleanupTimeout タイムアウトクリーンアップ関数
 */
const useMapInitialization = (
  initMap: () => Promise<void>,
  skipInit: boolean,
  cleanupTimeout: () => void
) => {
  useEffect(() => {
    logger.debug('useGoogleMaps useEffect トリガー', {
      component: 'useGoogleMaps',
      skipInit,
    });

    // skipInitがfalseの場合のみ初期化
    if (!skipInit) {
      logger.debug('初期化を実行します', { component: 'useGoogleMaps' });

      // 即時実行ではなく少し遅延させる
      const timeoutId = setTimeout(() => {
        void initMap();
      }, 100);

      // クリーンアップ
      return () => {
        clearTimeout(timeoutId);
        cleanupTimeout();
      };
    }

    return undefined;
  }, [initMap, skipInit, cleanupTimeout]);
};

/**
 * マップの初期化を管理するためのフック（メモ化版）
 * @param elementId マップ要素のID
 * @param center 初期中心座標
 * @param zoom 初期ズームレベル
 */
const useMapInitializer = (
  elementId: string,
  center: { lat: number; lng: number },
  zoom: number
) => {
  // 依存関係の変更でのみ再作成されるメモ化処理
  return useCallback(async () => {
    logger.info('Google Maps初期化を開始します...', {
      component: 'useGoogleMaps',
      action: 'initialization_start',
      center,
      zoom,
      elementId,
    });

    // APIキーの取得と検証
    const apiKey = validateInitRequirements();

    // 地図の読み込みと初期化
    return await loadAndInitializeMap(apiKey, elementId, center, zoom);
  }, [center, zoom, elementId]);
};

/**
 * 初期化のリトライを管理するためのフック（メモ化版）
 * @param retryCount 現在のリトライ回数
 * @param setRetryCount リトライ回数更新関数
 */
const useRetryHandler = (
  retryCount: number,
  setRetryCount: React.Dispatch<React.SetStateAction<number>>
) => {
  return useCallback(
    (retryFunc: () => void) => {
      // 最大再試行回数
      const MAX_RETRIES = 3;

      if (retryCount < MAX_RETRIES) {
        const nextCount = retryCount + 1;
        logger.warn(`Google Maps初期化を再試行します (${nextCount}/${MAX_RETRIES})...`, {
          component: 'useGoogleMaps',
          action: 'initialization_retry',
          retryCount: nextCount,
          maxRetries: MAX_RETRIES,
        });

        setRetryCount(nextCount);

        // 遅延を入れて再試行
        setTimeout(retryFunc, 1000 * nextCount); // 再試行ごとに待ち時間を増やす
        return true;
      }
      return false;
    },
    [retryCount, setRetryCount]
  );
};

/**
 * タイムアウト処理を管理するためのフック（メモ化版）
 */
const useTimeoutHandler = () => {
  // タイムアウト処理用のref
  const timeoutIdRef = useRef<number | null>(null);

  // タイムアウト処理を管理する
  const cleanupTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
      logger.debug('初期化タイムアウトをクリアしました', {
        component: 'useGoogleMaps',
        action: 'timeout_cleanup',
      });
    }
  }, []);

  return { timeoutIdRef, cleanupTimeout };
};

/**
 * 初期化の成功処理を管理するためのフック（メモ化版）
 */
const useSuccessHandler = (
  mapInstanceRef: React.MutableRefObject<google.maps.Map | null>,
  cleanupTimeout: () => void,
  setState: React.Dispatch<React.SetStateAction<GoogleMapsState>>,
  onMapLoaded?: (map: google.maps.Map) => void
) => {
  return useCallback(
    (mapInstance: google.maps.Map) => {
      const logContext = {
        component: 'useGoogleMaps',
        action: 'initialization_success',
      };

      // マップインスタンスをrefに保存
      mapInstanceRef.current = mapInstance;

      // タイムアウトをクリア
      cleanupTimeout();

      // 状態の更新
      setState({
        isLoaded: true,
        error: null,
        map: mapInstance,
      });

      logger.debug('Mapインスタンスを正常に設定しました', logContext);

      // コールバック呼び出し
      if (onMapLoaded) {
        logger.debug('onMapLoaded コールバック実行', logContext);
        onMapLoaded(mapInstance);
      }
    },
    [cleanupTimeout, onMapLoaded, setState, mapInstanceRef]
  );
};

/**
 * マップの初期化スキップ条件を評価するためのフック（メモ化版）
 */
const useSkipHandler = (
  mapInstanceRef: React.MutableRefObject<google.maps.Map | null>,
  skipInit: boolean,
  setState: React.Dispatch<React.SetStateAction<GoogleMapsState>>
) => {
  // 初期化済みのマップを返す
  const updateWithExistingMap = useCallback(() => {
    if (mapInstanceRef.current) {
      setState({
        isLoaded: true,
        error: null,
        map: mapInstanceRef.current,
      });

      logger.debug('既存のマップインスタンスで状態を更新しました', {
        component: 'useGoogleMaps',
        action: 'update_with_existing',
      });
    }
  }, [setState, mapInstanceRef]);

  // 初期化スキップ条件の検証
  return useCallback(() => {
    const logContext = {
      component: 'useGoogleMaps',
      action: 'check_skip_conditions',
    };

    // すでに初期化済みの場合
    if (mapInstanceRef.current) {
      logger.debug('マップはすでに初期化されています', logContext);
      updateWithExistingMap();
      return true;
    }

    // skipInitフラグがtrueの場合
    if (skipInit) {
      logger.debug('マップの初期化をスキップします。要素が準備できるのを待機中...', {
        ...logContext,
        skipInit,
      });
      return true;
    }

    return false;
  }, [skipInit, updateWithExistingMap, mapInstanceRef]);
};

/**
 * Google Maps APIを初期化・管理するカスタムフック（最適化版）
 */
export const useGoogleMaps = (options: UseGoogleMapsOptions): GoogleMapsState => {
  const {
    elementId,
    center = { lat: 38.0413, lng: 138.3689 }, // 佐渡島の中心あたり
    zoom = 10,
    onMapLoaded,
    skipInit = false,
    initTimeout = 15000, // デフォルト15秒
  } = options;

  // デフォルト値のメモ化
  const defaultCenter = useMemo(() => ({ lat: 38.0413, lng: 138.3689 }), []);
  const effectiveCenter = center || defaultCenter;

  // 状態管理
  const [state, setState] = useState<GoogleMapsState>({
    isLoaded: false,
    error: null,
    map: null,
  });

  // マップインスタンスの参照を保持
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // 再試行カウンター
  const [retryCount, setRetryCount] = useState(0);

  // タイムアウト管理
  const { timeoutIdRef, cleanupTimeout } = useTimeoutHandler();

  // 初期化スキップ条件
  const shouldSkipInit = useSkipHandler(mapInstanceRef, skipInit, setState);

  // 成功時の処理
  const handleInitSuccess = useSuccessHandler(
    mapInstanceRef,
    cleanupTimeout,
    setState,
    onMapLoaded
  );

  // 初期化処理
  const initializeMap = useMapInitializer(elementId, effectiveCenter, zoom);

  // リトライ処理
  const retryInitialization = useRetryHandler(retryCount, setRetryCount);

  // メイン初期化プロセス
  const initMap = useCallback(async () => {
    const logContext = {
      component: 'useGoogleMaps',
      action: 'init_map_process',
    };

    // 初期化をスキップすべき条件をチェック
    if (shouldSkipInit()) {
      return;
    }

    // タイムアウト設定
    cleanupTimeout();
    timeoutIdRef.current = setupInitTimeout(initTimeout, setState);

    try {
      logger.debug('マップ初期化処理を開始します', logContext);

      // 初期化実行
      const mapInstance = await initializeMap();
      handleInitSuccess(mapInstance);
    } catch (rawError: unknown) {
      // エラーを型安全に処理
      const error = rawError instanceof Error ? rawError : new Error(String(rawError));

      logger.error('Google Maps APIの初期化に失敗しました', {
        ...logContext,
        errorMessage: error.message,
        errorType: error.name,
        stack: error.stack,
      });

      // タイムアウトをクリア
      cleanupTimeout();

      // 再試行処理
      if (
        retryInitialization(() => {
          void initMap();
        })
      ) {
        return;
      }

      // 再試行回数超過でエラー状態設定
      setErrorState(error, setState);
    }
  }, [
    shouldSkipInit,
    cleanupTimeout,
    timeoutIdRef,
    initTimeout,
    setState,
    initializeMap,
    handleInitSuccess,
    retryInitialization,
  ]);

  // マウント時の初期化処理
  useMapInitialization(initMap, skipInit, cleanupTimeout);

  return state;
};

/**
 * 初期化のための前提条件をチェックし、APIキーの検証を行う
 * @returns APIキー（検証済み）
 * @throws APIキーがない場合はエラー
 */
const validateInitRequirements = (): string => {
  const logContext = { component: 'useGoogleMaps', action: 'validate_requirements' };
  logger.debug('環境変数の検証を開始します', logContext);

  const { apiKey, isValid, errors } = validateMapsEnvironmentVars();

  if (!isValid) {
    errors.forEach(error => logger.error(error, logContext));
    throw new Error('Google Maps APIの初期化に必要な環境変数が不足しています。');
  }

  logger.debug('環境変数の検証が完了しました', {
    ...logContext,
    apiKeyValid: !!apiKey && apiKey.length > 10,
  });

  return apiKey;
};

/**
 * モバイルデバイスかどうかを判定する
 * @returns モバイルデバイスの場合はtrue
 */
function isMobileDevice(): boolean {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

// デフォルトのマップオプション
const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
};

// モバイル向けマップオプション
const MOBILE_MAP_OPTIONS: google.maps.MapOptions = {
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};
