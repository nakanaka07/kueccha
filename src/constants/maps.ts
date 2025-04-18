import type { LoaderOptions } from '@googlemaps/js-api-loader';

import { logger } from '@/utils/logger';

/**
 * Google Maps APIで使用される有効なライブラリの型定義
 * @see https://developers.google.com/maps/documentation/javascript/libraries
 */
type Libraries = Array<
  | 'core'
  | 'maps'
  | 'places'
  | 'geocoding'
  | 'routes'
  | 'marker'
  | 'geometry'
  | 'elevation'
  | 'directions'
  | 'journeySharing'
  | 'drawing'
  | 'visualization' // 重複 'places' を削除
>;

/** 佐渡島の中心座標 */
export const SADO_CENTER = {
  lat: 38.0413,
  lng: 138.3689,
};

/** 地図初期表示のデフォルトズームレベル */
export const DEFAULT_ZOOM = 10;

/** モバイル時のデフォルトズームレベル (やや広めに表示) */
export const MOBILE_DEFAULT_ZOOM = 9;

/**
 * 再試行関連の設定
 * API接続失敗時のリトライ戦略
 */
export const RETRY_CONFIG = {
  /** 最大再試行回数 */
  MAX_RETRIES: 3,

  /** 再試行間隔（ミリ秒） */
  RETRY_DELAY: 1000,
};

/**
 * 環境変数の検証
 * Google Maps APIに必要な環境変数が正しく設定されているか確認
 * @returns 検証結果のオブジェクト
 * @remarks アプリケーション初期化時に実行するのがより適切かもしれません。
 */
export const validateGoogleMapsEnv = (): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  let isValid = true;
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const version = import.meta.env.VITE_GOOGLE_MAPS_API_VERSION || 'weekly'; // 直接取得
  const libraryString = import.meta.env.VITE_GOOGLE_MAPS_LIBRARIES || ''; // 直接取得
  const libraries = libraryString
    .split(',')
    .map((lib: string) => lib.trim()) // 型 'string' を追加
    .filter(Boolean); // パース

  // APIキーの検証
  if (!apiKey) {
    messages.push('Google Maps APIキーが設定されていません');
    isValid = false;
  } else if (apiKey.length < 10) {
    messages.push('Google Maps APIキーが短すぎるか、不正な形式です');
    isValid = false;
  }

  // MapIDの検証 (任意だが設定されている場合は検証)
  if (mapId && mapId.trim() === '') {
    messages.push('Google Maps MapIDが設定されていますが、空白文字のみです');
    isValid = false;
  }

  // API バージョンの検証
  if (!version) {
    // version は常にデフォルト値を持つため、このチェックは実質不要になるが念のため残す
    messages.push('Google Maps APIバージョンが設定されていません');
    isValid = false;
  }

  // ライブラリ設定の検証
  if (libraries.length === 0) {
    messages.push('Google Maps ライブラリが設定されていません');
    // 警告のみ (致命的ではない)
  }

  // 検証結果をログに記録
  if (!isValid) {
    messages.forEach(msg => logger.error(msg, { component: 'GoogleMapsConfig' }));
  } else {
    logger.info('Google Maps環境変数の検証に成功しました', {
      component: 'GoogleMapsConfig',
      apiKeyLength: apiKey ? apiKey.length : 0,
      hasMapId: !!mapId,
      version,
      libraries,
    });
  }

  return { isValid, messages };
};

/**
 * マップID関連設定
 * Cloud-based stylingのIDとフォールバックオプション
 */
export const MAP_ID_CONFIG = {
  /** メインマップID - 環境変数から取得 */
  MAIN: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '', // import.meta.env を使用

  /** フォールバック用マップID（メインが無効な場合） */
  FALLBACK: 'DEMO_MAP_ID', // 例: デモ用ID

  /** マップIDが有効かどうかを確認 */
  isValid: (id: string | undefined): boolean =>
    !!id && id.trim() !== '' && id !== MAP_ID_CONFIG.FALLBACK,
};

/**
 * マップオプションのデフォルト設定
 *
 * Google Maps APIの初期化時に使用するオプション
 * @see https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
 * @remarks ローダー成功後に google.maps オブジェクトが利用可能であることを前提とします。
 */
export const DEFAULT_MAP_OPTIONS: () => google.maps.MapOptions = () => ({
  center: SADO_CENTER,
  zoom: DEFAULT_ZOOM,
  mapId: MAP_ID_CONFIG.isValid(MAP_ID_CONFIG.MAIN) ? MAP_ID_CONFIG.MAIN : MAP_ID_CONFIG.FALLBACK,
  disableDefaultUI: true, // デフォルトUIを無効化 (カスタムUIを想定)
  gestureHandling: 'greedy', // すべてのジェスチャーを許可
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false, // POIクリックを無効化 (カスタムInfoWindowのため)
});

/**
 * モバイル向けマップオプション
 *
 * スマートフォンなど小型デバイス向けの最適化設定
 * @remarks ローダー成功後に google.maps オブジェクトが利用可能であることを前提とします。
 */
export const MOBILE_MAP_OPTIONS: () => google.maps.MapOptions = () => ({
  ...DEFAULT_MAP_OPTIONS(), // デフォルト設定を継承
  zoom: MOBILE_DEFAULT_ZOOM, // モバイル向けズームレベル
  gestureHandling: 'greedy', // モバイルでは特に 'greedy' が使いやすい
});

// 佐渡島の地理的な境界
export const SADO_BOUNDS: google.maps.LatLngBoundsLiteral = {
  north: 38.36,
  south: 37.78,
  west: 138.18,
  east: 138.6,
};

/**
 * 佐渡島に最適化されたマップオプション (例)
 * 必要に応じて DEFAULT_MAP_OPTIONS や MOBILE_MAP_OPTIONS とマージして使用
 */
export const SADO_OPTIMIZED_OPTIONS: () => google.maps.MapOptions = () => ({
  restriction: {
    latLngBounds: SADO_BOUNDS,
    strictBounds: false, // 境界外へのスクロールをある程度許可
  },
  minZoom: 9, // 佐渡島全体が見える程度の最小ズーム
  maxZoom: 18, // 詳細表示のための最大ズーム
});

/**
 * マップローダーオプションを取得する
 * @returns LoaderOptionsオブジェクト
 */
export const getLoaderOptions = (): LoaderOptions => {
  return logger.measureTime('Loader設定の取得', () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
    const version = import.meta.env.VITE_GOOGLE_MAPS_API_VERSION || 'weekly'; // 直接取得
    const libraryString = import.meta.env.VITE_GOOGLE_MAPS_LIBRARIES || ''; // 直接取得

    // Libraries 型を直接利用 (validLibraries 定義は不要)
    const requestedLibraries = libraryString
      .split(',')
      .map((lib: string) => lib.trim())
      .filter(Boolean);

    // Libraries 型に含まれるものだけをフィルタリング
    // Note: Libraries 型が Array<...> なので、直接 includes を使うために一時的な配列を作成
    const validLibraryValues: Libraries = [
      'core',
      'maps',
      'places',
      'geocoding',
      'routes',
      'marker',
      'geometry',
      'elevation',
      'directions',
      'journeySharing',
      'drawing',
      'visualization',
    ];
    // 型エラーを修正
    const libraries = requestedLibraries.filter(
      (lib: string): lib is Libraries[number] =>
        validLibraryValues.includes(lib as Libraries[number]) // lib に string 型を明示 // any キャストではなく型アサーションを使用
    );

    // マップIDが有効か確認
    const useMapId = MAP_ID_CONFIG.isValid(mapId) ? mapId : MAP_ID_CONFIG.FALLBACK;

    // 基本設定を作成
    const options: LoaderOptions = {
      apiKey: apiKey || '', // APIキーがない場合は空文字を設定
      version: version,
      libraries: libraries,
      language: 'ja',
      region: 'JP',
    };

    // マップID設定を追加 (フォールバックIDも含む)
    options.mapIds = [useMapId];

    // 設定値をログに記録
    logger.info('Google Maps API設定を生成', {
      component: 'GoogleMapsLoader',
      hasApiKey: !!apiKey,
      usedMapId: useMapId,
      version: version,
      libraries: libraries,
      environment: import.meta.env.DEV ? 'development' : 'production', // import.meta.env.DEV を使用
    });

    return options;
  });
};

/**
 * デバイス検出のためのブレークポイント値（ピクセル）
 */
export const DEVICE_BREAKPOINT = 768;

/**
 * デバイスタイプ検出
 * ビューポートサイズに基づいてデバイスタイプを判定
 * @returns モバイルデバイスかどうか
 * @remarks CSSメディアクエリや専用ライブラリの利用も検討できます。
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') {
    // サーバーサイドレンダリングなど、windowがない環境への対応
    return false;
  }
  return window.innerWidth < DEVICE_BREAKPOINT;
};
