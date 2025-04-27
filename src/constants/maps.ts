import type { LoaderOptions } from '@googlemaps/js-api-loader';

import { logger } from '@/utils/logger';

/**
 * Google Maps API Loaderで使用される有効なライブラリの型定義
 *
 * Google Maps JavaScript APIのローダーで利用可能なライブラリを型安全に定義します。
 * これにより、無効なライブラリ名の指定を防ぎ、タイプミスを防止します。
 *
 * @see https://developers.google.com/maps/documentation/javascript/libraries
 * @see https://github.com/googlemaps/js-api-loader/blob/main/src/index.ts
 */
export type GoogleMapsLibrary =
  | 'places'
  | 'drawing'
  | 'geometry'
  | 'visualization'
  | 'marker'
  | 'maps'
  | 'core';

/**
 * 複数のGoogle Maps APIライブラリを表す型
 * js-api-loaderパッケージの型定義に合わせて制限
 */
export type Libraries = Array<GoogleMapsLibrary>;

/**
 * Google Maps API全体で使用される利用可能なライブラリ一覧
 * ローダーで直接使用する型と拡張ライブラリを含む
 * @remarks 参照用の定数であり、型定義ではありません
 */
export const ALL_GOOGLE_MAPS_LIBRARIES = {
  // Loaderで使用可能なライブラリ
  CORE_LIBRARIES: [
    'places',
    'drawing',
    'geometry',
    'visualization',
    'marker',
    'maps',
    'core',
  ] as const,

  // 拡張ライブラリ（別途インポートが必要）
  EXTENDED_LIBRARIES: ['geocoding', 'routes', 'elevation', 'directions', 'journeySharing'] as const,
};

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
 * 検証結果の型定義
 */
interface ValidationResult {
  isValid: boolean;
  messages: string[];
}

/**
 * APIキーを検証するヘルパー関数
 * @param apiKey APIキー文字列
 * @returns 検証結果
 */
const validateApiKey = (apiKey: string | undefined): ValidationResult => {
  const messages: string[] = [];

  // デフォルトは有効と仮定し、問題があれば無効にする
  const isValid = !(!apiKey || apiKey.length < 10);

  if (!apiKey) {
    messages.push('Google Maps APIキーが設定されていません');
  } else if (apiKey.length < 10) {
    messages.push('Google Maps APIキーが短すぎるか、不正な形式です');
  }

  return { isValid, messages };
};

/**
 * MapIDを検証するヘルパー関数
 * @param mapId マップID文字列
 * @returns 検証結果
 */
const validateMapId = (mapId: string | undefined): ValidationResult => {
  const messages: string[] = [];

  // エラー条件：マップIDが存在するが空白のみの場合
  const isValid = !(mapId && mapId.trim() === '');

  if (mapId && mapId.trim() === '') {
    messages.push('Google Maps MapIDが設定されていますが、空白文字のみです');
  }

  return { isValid, messages };
};

/**
 * APIバージョンを検証するヘルパー関数
 * @param version APIバージョン文字列
 * @returns 検証結果
 */
const validateVersion = (version: string | undefined): ValidationResult => {
  const messages: string[] = [];

  // versionが存在するかどうか確認
  const isValid = !!version;

  if (!version) {
    messages.push('Google Maps APIバージョンが設定されていません');
  }

  return { isValid, messages };
};

/**
 * ライブラリ設定を検証するヘルパー関数
 * @param libraries ライブラリの配列
 * @returns 検証結果
 */
const validateLibraries = (libraries: string[]): ValidationResult => {
  const messages: string[] = [];

  // ライブラリが空の場合は警告を表示するが、致命的ではないのでisValidはtrueのまま
  const isValid = true;

  if (libraries.length === 0) {
    messages.push('Google Maps ライブラリが設定されていません');
    // 警告のみ (致命的ではない)
  }

  return { isValid, messages };
};

/**
 * 環境変数の検証
 * Google Maps APIに必要な環境変数が正しく設定されているか確認
 * @returns 検証結果のオブジェクト
 * @remarks アプリケーション初期化時に実行するのがより適切です。
 */
export const validateGoogleMapsEnv = (): ValidationResult => {
  const messages: string[] = [];
  const validationResults: boolean[] = [];

  // 環境変数の取得
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  const version = import.meta.env.VITE_GOOGLE_MAPS_API_VERSION || 'weekly';
  const libraryString = import.meta.env.VITE_GOOGLE_MAPS_LIBRARIES || '';
  const libraries = libraryString
    .split(',')
    .map((lib: string) => lib.trim())
    .filter(Boolean);

  // 個別の検証を実行
  const apiKeyResult = validateApiKey(apiKey);
  const mapIdResult = validateMapId(mapId);
  const versionResult = validateVersion(version);
  const librariesResult = validateLibraries(libraries);

  // 検証結果を統合
  [apiKeyResult, mapIdResult, versionResult, librariesResult].forEach(result => {
    validationResults.push(result.isValid);
    messages.push(...result.messages);
  });
  const isValid = validationResults.every(Boolean);

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
 * 環境変数からライブラリ設定を解析して有効なライブラリのみを抽出
 * @param libraryString カンマ区切りのライブラリ文字列
 * @returns 有効なライブラリのみの配列
 */
const parseAndValidateLibraries = (libraryString: string): Libraries => {
  // カンマ区切り文字列から配列に変換
  const requestedLibraries = libraryString
    .split(',')
    .map((lib: string) => lib.trim())
    .filter(Boolean);

  // 有効なライブラリ値の配列（GoogleMapsLibrary型に合わせる）
  const validLibraryValues: GoogleMapsLibrary[] = [
    'core',
    'maps',
    'places',
    'marker',
    'geometry',
    'drawing',
    'visualization',
  ];

  // 型安全なフィルタリング
  return requestedLibraries.filter((lib: string): lib is GoogleMapsLibrary =>
    validLibraryValues.includes(lib as GoogleMapsLibrary)
  );
};

/**
 * マップローダーオプションを取得する
 *
 * Google Maps JS APIロード用の設定を環境変数から生成します。
 * 各設定値のバリデーションも含み、無効な値の場合はフォールバック値を使用します。
 *
 * @returns LoaderOptionsオブジェクト
 */
export const getLoaderOptions = (): LoaderOptions => {
  return logger.measureTime('Loader設定の取得', () => {
    // 環境変数から設定を取得
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
    const version = import.meta.env.VITE_GOOGLE_MAPS_API_VERSION || 'weekly';
    const libraryString = import.meta.env.VITE_GOOGLE_MAPS_LIBRARIES || '';

    // ライブラリ設定の解析と検証
    const libraries = parseAndValidateLibraries(libraryString);

    // マップIDの検証とフォールバック
    const useMapId = MAP_ID_CONFIG.isValid(mapId) ? mapId : MAP_ID_CONFIG.FALLBACK;

    // 基本設定の作成
    const options: LoaderOptions = {
      apiKey: apiKey || '', // APIキーがない場合は空文字を設定
      version,
      libraries,
      language: 'ja',
      region: 'JP',
    };

    // マップID設定を追加
    options.mapIds = [useMapId];

    // 設定値をログに記録
    logger.info('Google Maps API設定を生成', {
      component: 'GoogleMapsLoader',
      hasApiKey: !!apiKey,
      usedMapId: useMapId,
      version,
      libraries,
      environment: import.meta.env.DEV ? 'development' : 'production',
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
