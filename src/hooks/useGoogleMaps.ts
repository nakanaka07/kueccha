import { Loader } from '@googlemaps/js-api-loader';
import { useState, useEffect, useCallback, useRef } from 'react';

import { getLoaderOptions, RETRY_CONFIG, getResponsiveMapOptions } from '@/constants/maps';
import { ENV } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

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
  // 通常の方法
  const byId = document.getElementById(elementId);
  if (byId) return byId;

  // querySelector()を使用した代替手段
  const bySelector = document.querySelector(`#${elementId}`);
  if (bySelector) return bySelector as HTMLElement;

  // ドキュメント内の全てのdiv要素を検索（id指定が誤っている場合に有効）
  const mapDivs = document.querySelectorAll('div.map-container');
  if (mapDivs.length > 0) {
    logger.warn(
      `ID "${elementId}"の要素が見つかりませんでしたが、マップらしき要素が見つかりました。`
    );
    return mapDivs[0] as HTMLElement;
  }

  return null;
};

/**
 * マップ要素を取得する（複数回試行）
 * @param elementId マップ要素のID
 * @returns 見つかったマップ要素
 * @throws 要素が見つからない場合はエラー
 */
const getMapElementWithRetry = async (elementId: string): Promise<HTMLElement> => {
  // 最初の試行
  let mapElement = tryGetMapElement(elementId);

  // 要素が見つからない場合、短い遅延後に再試行
  if (!mapElement) {
    logger.debug('マップ要素が見つかりません。500ms後に再試行します...');
    await new Promise(resolve => setTimeout(resolve, 500));
    mapElement = tryGetMapElement(elementId);

    // 2回目の試行後も見つからない場合、さらに待機
    if (!mapElement) {
      logger.debug('マップ要素がまだ見つかりません。最後の試行として1秒後に再試行します...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      mapElement = tryGetMapElement(elementId);

      if (!mapElement) {
        throw new Error(
          `マップ要素が見つかりません。ID "${elementId}"のHTML要素が存在し、CSSで適切なサイズが設定されていることを確認してください。`
        );
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
  // レスポンシブなマップオプションを取得
  const mapOptions = getResponsiveMapOptions();

  // 引数で渡された値を優先
  const options = {
    ...mapOptions,
    center,
    zoom,
  };

  // マップインスタンスの作成
  return new google.maps.Map(mapElement, options);
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
  // Loaderオプションを取得
  const loaderOptions = getLoaderOptions();

  // ロギング操作をタスクとして分離（デバッグ/開発用）
  const logMapInitStart = () => {
    logger.debug('Google Maps APIをロード中...');
  };

  // 初期化開始のログ
  logMapInitStart();

  // Google Maps APIのロード
  const loader = new Loader({
    ...loaderOptions,
    apiKey,
  });

  // APIをロード（パフォーマンス計測と連携）
  await logger.measureTimeAsync('Google Maps APIライブラリのロード', () =>
    loader.importLibrary('maps')
  );

  logger.debug('Google Maps APIのロードが完了しました');

  // マップ要素の取得（パフォーマンス計測と連携）
  logger.debug(`マップ要素ID "${elementId}" を検索中...`);

  const mapElement = await logger.measureTimeAsync('マップ要素の取得', () =>
    getMapElementWithRetry(elementId)
  );

  logger.debug('マップ要素が見つかりました。地図を初期化します...');

  // 要素にサイズがない場合は警告
  if (mapElement.clientWidth === 0 || mapElement.clientHeight === 0) {
    logger.warn('マップ要素のサイズが0です。CSSが正しく適用されているか確認してください。', {
      elementId,
      element: elementId,
    });
  } else {
    logger.debug(`マップ要素のサイズ: ${mapElement.clientWidth} x ${mapElement.clientHeight}`);
  }

  // マップインスタンスの作成（パフォーマンス計測と連携）
  const mapInstance = logger.measureTime(
    'マップインスタンスの作成',
    () => createMapInstance(mapElement, center, zoom),
    LogLevel.DEBUG
  );

  logger.info('Google Maps初期化が完了しました', {
    center: mapInstance.getCenter()?.toJSON(),
    zoom: mapInstance.getZoom(),
  });

  return mapInstance;
};

/**
 * 再試行ロジックを処理する
 * @param retryCount 現在の試行回数
 * @param setRetryCount 試行回数の状態を更新する関数
 * @param initMap マップ初期化関数
 * @returns 再試行したかどうか
 */
const handleRetry = (
  retryCount: number,
  setRetryCount: React.Dispatch<React.SetStateAction<number>>,
  initMap: () => Promise<void>
): boolean => {
  const { MAX_RETRIES, RETRY_DELAY } = RETRY_CONFIG;

  if (retryCount < MAX_RETRIES) {
    logger.debug(`初期化に失敗したため再試行します... (${retryCount + 1}/${MAX_RETRIES})`);
    setRetryCount(prev => prev + 1);
    // 少し待ってから再試行
    setTimeout(() => {
      void initMap();
    }, RETRY_DELAY);
    return true;
  }
  return false;
};

/**
 * エラー状態を設定する処理
 * @param err エラーオブジェクト
 * @param setState 状態更新関数
 */
const setErrorState = (
  err: unknown,
  setState: React.Dispatch<React.SetStateAction<GoogleMapsState>>
): void => {
  // エラーメッセージの生成（エラーオブジェクトかどうかで分岐）
  const errorMessage =
    err instanceof Error
      ? `地図の読み込みに失敗しました: ${err.message}`
      : '地図の読み込みに失敗しました。ネットワーク接続を確認してください。';

  // エラーの詳細をログに記録
  logger.error('マップ初期化エラー', err instanceof Error ? err : { message: String(err) });

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
      timeout,
      component: 'useGoogleMaps',
    });

    setState(prev => ({
      ...prev,
      isLoaded: true,
      error: '地図の読み込みがタイムアウトしました。ページを再読み込みしてください。',
    }));
  }, timeout);
};

/**
 * Google Maps APIを初期化・管理するカスタムフック（最適化版）
 *
 * @param options マップ初期化オプション
 * @returns マップの状態（読み込み状態、エラー、マップインスタンス）
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

  // タイムアウト処理用のref
  const timeoutIdRef = useRef<number | null>(null);

  // マップ初期化関数
  const initMap = useCallback(async () => {
    // すでに初期化済みの場合はスキップ
    if (mapInstanceRef.current) {
      logger.debug('マップはすでに初期化されています');
      setState({
        isLoaded: true,
        error: null,
        map: mapInstanceRef.current,
      });
      return;
    }

    // skipInitがtrueの場合は初期化をスキップ
    if (skipInit) {
      logger.debug('マップの初期化をスキップします。要素が準備できるのを待機中...', {
        elementId,
        skipInit,
      });
      return;
    }

    // 以前のタイムアウトをクリア
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // タイムアウト処理の設定
    timeoutIdRef.current = setupInitTimeout(initTimeout, setState);

    try {
      // パフォーマンス計測でラップした初期化処理
      logger.info('Google Maps初期化を開始します...', {
        center,
        zoom,
        elementId,
      });

      // APIキーのチェック
      const apiKey = ENV.google.API_KEY;
      if (!apiKey) {
        throw new Error(
          'Google Maps APIキーが設定されていません。.envファイルを確認してください。'
        );
      }

      // マップの読み込みと初期化
      const mapInstance = await loadAndInitializeMap(apiKey, elementId, center, zoom);

      // マップインスタンスをrefに保存
      mapInstanceRef.current = mapInstance;

      // タイムアウトをクリア
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      // 状態の更新
      setState({
        isLoaded: true,
        error: null,
        map: mapInstance,
      });

      // コールバック呼び出し
      if (onMapLoaded) {
        logger.debug('onMapLoaded コールバック実行');
        onMapLoaded(mapInstance);
      }
    } catch (err) {
      logger.error('Google Maps APIの初期化に失敗しました', err instanceof Error ? err : undefined);

      // タイムアウトをクリア
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      // 再試行ロジック
      if (handleRetry(retryCount, setRetryCount, initMap)) {
        return;
      }

      // 再試行回数を超えた場合はエラー状態を設定
      setErrorState(err, setState);
    }
  }, [elementId, center, zoom, onMapLoaded, retryCount, skipInit, initTimeout]);

  // マウント時の初期化および依存関係の変更時
  useEffect(() => {
    logger.debug('useGoogleMaps useEffect トリガー', { skipInit });

    // skipInitがfalseになった時だけ初期化を実行
    if (!skipInit) {
      logger.debug('skipInitがfalseになりました。マップ初期化を開始します...');

      // すでに初期化済みの場合は不要な処理を避ける
      if (!mapInstanceRef.current) {
        const timeoutId = setTimeout(() => {
          void initMap();
        }, 100);

        return () => {
          clearTimeout(timeoutId);
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }
        };
      } else {
        logger.debug('マップはすでに初期化されています。処理をスキップします。');
      }
    }
  }, [initMap, skipInit]);

  return state;
};
