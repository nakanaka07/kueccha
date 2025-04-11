import type { LoaderOptions } from '@googlemaps/js-api-loader';

import { ENV, getMapsApiVersion, getMapsLibraries, isDevEnvironment } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

// Libraries型を正しく定義

/**
 * Google Maps APIで使用される有効なライブラリの型定義
 * @see https://developers.google.com/maps/documentation/javascript/libraries
 */
type Libraries = Array<
  'maps' | 'core' | 'places' | 'geometry' | 'drawing' | 'marker' | 'visualization'
>;

/**
 * Google Maps API関連の定数
 *
 * 目的:
 * - マップ設定の一元管理
 * - 環境に応じた設定切り替え
 * - コード重複の防止
 * - 一貫性のある地図体験の提供
 */

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
 * マップコントロール位置の定数
 * googleオブジェクト未ロード時のフォールバック用
 */
export const CONTROL_POSITIONS = {
  RIGHT_BOTTOM: 7, // google.maps.ControlPosition.RIGHT_BOTTOM
  RIGHT_CENTER: 3, // google.maps.ControlPosition.RIGHT_CENTER
  RIGHT_TOP: 6, // google.maps.ControlPosition.RIGHT_TOP
  TOP_RIGHT: 2, // google.maps.ControlPosition.TOP_RIGHT
  LEFT_TOP: 5, // google.maps.ControlPosition.LEFT_TOP,
};

/**
 * マップタイプコントロールスタイルの定数
 */
export const MAP_TYPE_CONTROL_STYLES = {
  DROPDOWN_MENU: 2, // google.maps.MapTypeControlStyle.DROPDOWN_MENU
};

/**
 * マップタイプIDの定数
 */
export const MAP_TYPE_IDS = {
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
};

// MAP_TYPESはMAP_TYPE_IDSと重複しているため削除
// 重複定義を避けるため、既存のMAP_TYPE_IDSを使用

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
 */
export const validateGoogleMapsEnv = (): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  let isValid = true;

  // APIキーの検証
  if (!ENV.google.apiKey) {
    messages.push('Google Maps APIキーが設定されていません');
    isValid = false;
  } else if (ENV.google.apiKey.length < 10) {
    messages.push('Google Maps APIキーが短すぎるか、不正な形式です');
    isValid = false;
  }

  // MapIDの検証 (任意だが設定されている場合は検証)
  if (ENV.google.mapId && ENV.google.mapId.trim() === '') {
    messages.push('Google Maps MapIDが設定されていますが、空白文字のみです');
    isValid = false;
  }

  // API バージョンの検証
  const version = getMapsApiVersion();
  if (!version) {
    messages.push('Google Maps APIバージョンが設定されていません');
    isValid = false;
  }

  // ライブラリ設定の検証
  const libraries = getMapsLibraries();
  if (libraries.length === 0) {
    messages.push('Google Maps ライブラリが設定されていません');
    // 警告のみ (致命的ではない)
  }

  // 検証結果をログに記録
  if (!isValid) {
    logger.error('Google Maps環境変数の検証に失敗しました', {
      component: 'GoogleMapsConfig',
      messages,
    });
  } else {
    logger.info('Google Maps環境変数の検証に成功しました', {
      component: 'GoogleMapsConfig',
      apiKeyLength: ENV.google.apiKey ? ENV.google.apiKey.length : 0,
      hasMapId: !!ENV.google.mapId,
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
  MAIN: ENV.google.mapId || '',

  /** フォールバック用マップID（メインが無効な場合） */
  FALLBACK: '',

  /** マップIDが有効かどうかを確認 */
  isValid: (mapId: string): boolean => {
    return !!mapId && mapId.trim() !== '';
  },
};

/**
 * googleオブジェクトの可用性をチェック
 * @returns google.mapsが利用可能かどうか
 */
export const isGoogleMapsAvailable = (): boolean => {
  // 処理をロギングで計測
  return logger.measureTime(
    'Google Maps利用可能性チェック',
    () => {
      // グローバルスコープでgoogleオブジェクトが存在するかチェック
      if (typeof window === 'undefined' || typeof window.google === 'undefined') {
        logger.debug('Google Mapsオブジェクトが利用できません', {
          component: 'GoogleMapsStatus',
          environment: typeof window === 'undefined' ? 'non-browser' : 'browser',
        });
        return false;
      }

      // googleオブジェクトが存在する場合、mapsプロパティをチェック
      // Record<string, unknown>型を使用して型安全に存在確認
      const googleObj = window.google as Record<string, unknown>;
      const mapsAvailable =
        Object.prototype.hasOwnProperty.call(googleObj, 'maps') && googleObj.maps !== undefined;

      // 条件付きロギング - DEBUGレベルのみログ出力
      // logger.isLevelEnabled メソッドは存在しないため、直接 debug メソッドを使用
      // ロガーは内部で適切なレベルでのフィルタリングを行う
      logger.debug('Google Mapsオブジェクト可用性チェック', {
        component: 'GoogleMapsStatus',
        isAvailable: mapsAvailable,
        hasGoogleObject: true,
      });

      return mapsAvailable;
    },
    LogLevel.DEBUG,
    { component: 'GoogleMapsStatus' }
  );
};

/**
 * マップオプションのデフォルト設定
 *
 * Google Maps APIの初期化時に使用するオプション
 * @see https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
 */
export const DEFAULT_MAP_OPTIONS = {
  /** 中心座標（佐渡島） */
  center: SADO_CENTER,

  /** ズームレベル */
  zoom: DEFAULT_ZOOM,

  /** マップID - 環境変数から取得（スタイルのカスタマイズに使用） */
  get mapId(): string | null {
    // マップIDが有効な場合のみ値を設定、そうでない場合はnull
    return MAP_ID_CONFIG.isValid(MAP_ID_CONFIG.MAIN) ? MAP_ID_CONFIG.MAIN : null;
  },

  /** ジェスチャー設定 - 'greedy'でモバイル操作性向上 */
  gestureHandling: 'greedy' as const,

  /** デフォルトPOIアイコンのクリック有効化 */
  clickableIcons: true,

  /** UI要素の表示設定 */
  disableDefaultUI: false,

  /** ズームコントロール */
  zoomControl: true,
  get zoomControlOptions() {
    // 型安全なアクセスを確保
    const googleMaps = typeof google !== 'undefined' ? google.maps : undefined;

    // isGoogleMapsAvailable()の結果に基づいてさらにgoogleMapsオブジェクトの存在を確認
    if (isGoogleMapsAvailable() && googleMaps) {
      return {
        position: googleMaps.ControlPosition.RIGHT_BOTTOM,
      };
    }

    // フォールバック値を返す
    return {
      position: CONTROL_POSITIONS.RIGHT_BOTTOM,
    };
  },

  /** マップタイプコントロール */
  mapTypeControl: true,
  get mapTypeControlOptions() {
    // 型安全なアクセスを確保
    const googleMaps = typeof google !== 'undefined' ? google.maps : undefined;

    // isGoogleMapsAvailable()の結果に基づいてさらにgoogleMapsオブジェクトの存在を確認
    if (isGoogleMapsAvailable() && googleMaps) {
      return {
        position: googleMaps.ControlPosition.TOP_RIGHT,
        style: googleMaps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeIds: [
          googleMaps.MapTypeId.ROADMAP,
          googleMaps.MapTypeId.SATELLITE,
          googleMaps.MapTypeId.HYBRID,
          googleMaps.MapTypeId.TERRAIN,
        ],
      };
    }

    // フォールバック値を返す
    return {
      position: CONTROL_POSITIONS.TOP_RIGHT,
      style: MAP_TYPE_CONTROL_STYLES.DROPDOWN_MENU,
      mapTypeIds: [
        MAP_TYPE_IDS.ROADMAP,
        MAP_TYPE_IDS.SATELLITE,
        MAP_TYPE_IDS.HYBRID,
        MAP_TYPE_IDS.TERRAIN,
      ],
    };
  },

  /** ストリートビューコントロール */
  streetViewControl: true,
  get streetViewControlOptions() {
    // 型安全なアクセスを確保
    const googleMaps = typeof google !== 'undefined' ? google.maps : undefined;

    // isGoogleMapsAvailable()の結果に基づいてさらにgoogleMapsオブジェクトの存在を確認
    if (isGoogleMapsAvailable() && googleMaps) {
      return {
        position: googleMaps.ControlPosition.RIGHT_BOTTOM,
      };
    }

    // フォールバック値を返す
    return {
      position: CONTROL_POSITIONS.RIGHT_BOTTOM,
    };
  },

  /** フルスクリーンコントロール */
  fullscreenControl: true,
  get fullscreenControlOptions() {
    // 型安全なアクセスを確保
    const googleMaps = typeof google !== 'undefined' ? google.maps : undefined;

    // isGoogleMapsAvailable()の結果に基づいてさらにgoogleMapsオブジェクトの存在を確認
    if (isGoogleMapsAvailable() && googleMaps) {
      return {
        position: googleMaps.ControlPosition.RIGHT_TOP,
      };
    }

    // フォールバック値を返す
    return {
      position: CONTROL_POSITIONS.RIGHT_TOP,
    };
  },
};

/**
 * モバイル向けマップオプション
 *
 * スマートフォンなど小型デバイス向けの最適化設定
 */
export const MOBILE_MAP_OPTIONS = {
  ...DEFAULT_MAP_OPTIONS,
  zoom: MOBILE_DEFAULT_ZOOM,
  // モバイルではよりシンプルなUIに
  mapTypeControl: false,
  streetViewControl: false,
  // モバイルでは操作しやすい位置に
  get zoomControlOptions() {
    // 型安全なアクセスを確保
    const googleMaps = typeof google !== 'undefined' ? google.maps : undefined;

    // isGoogleMapsAvailable()の結果に基づいてさらにgoogleMapsオブジェクトの存在を確認
    if (isGoogleMapsAvailable() && googleMaps) {
      return {
        position: googleMaps.ControlPosition.RIGHT_CENTER,
      };
    }

    // フォールバック値を返す
    return {
      position: CONTROL_POSITIONS.RIGHT_CENTER,
    };
  },
  get fullscreenControlOptions() {
    // 型安全なアクセスを確保
    const googleMaps = typeof google !== 'undefined' ? google.maps : undefined;

    // isGoogleMapsAvailable()の結果に基づいてさらにgoogleMapsオブジェクトの存在を確認
    if (isGoogleMapsAvailable() && googleMaps) {
      return {
        position: googleMaps.ControlPosition.LEFT_TOP,
      };
    }

    // フォールバック値を返す
    return {
      position: CONTROL_POSITIONS.LEFT_TOP,
    };
  },
};

/**
 * Loader設定
 * Google Maps JavaScript APIのロード設定
 * 環境変数から設定を取得
 */
export const LOADER_OPTIONS = {
  /** APIバージョン - 環境変数から取得 */
  version: getMapsApiVersion(),

  /** 読み込む追加ライブラリ - 環境変数から取得 */
  libraries: getMapsLibraries(),

  /** 言語設定 - デフォルトは日本語 */
  language: 'ja',

  /** 地域設定 - 日本 */
  region: 'JP',
};

/**
 * Google Maps Loader設定を取得
 * 環境に応じた適切な設定を返す
 * @returns LoaderOptions
 */
export const getLoaderOptions = (): LoaderOptions => {
  return logger.measureTime(
    'Loader設定の取得',
    () => {
      // 各設定値を取得
      const options = getMapLoaderConfigValues();

      // 設定値をログに記録
      logger.info('Google Maps API設定を生成', {
        component: 'GoogleMapsLoader',
        hasApiKey: !!options.apiKey,
        hasMapId: options.hasValidMapId,
        version: options.version,
        libraries: options.libraries,
        environment: isDevEnvironment() ? 'development' : 'production',
      });

      // 最終的なオプションを構築して返す
      return buildLoaderOptions(options);
    },
    LogLevel.DEBUG,
    { component: 'GoogleMapsLoader' }
  );
};

/**
 * Google Maps Loaderの設定値を取得
 * 一度に複数の設定値を取得してパフォーマンスを最適化
 */
function getMapLoaderConfigValues() {
  const apiKey = ENV.google.apiKey;
  const mapId = ENV.google.mapId;
  const version = getMapsApiVersion();

  // ライブラリ文字列を明示的に型変換して安全に扱う
  const libraryStrings = getMapsLibraries();
  const validLibraries = [
    'maps',
    'core',
    'places',
    'geometry',
    'drawing',
    'marker',
    'visualization',
  ];

  const libraries = libraryStrings.filter(lib => validLibraries.includes(lib)) as Libraries;

  // マップIDが空でないか確認
  const hasValidMapId = !!mapId && mapId.trim() !== '';

  return {
    apiKey,
    mapId,
    version,
    libraries,
    hasValidMapId,
  };
}

/**
 * 取得した設定値からLoaderOptionsオブジェクトを構築
 * @param options 構築に必要な設定値
 * @returns LoaderOptions
 */
function buildLoaderOptions(options: {
  apiKey: string;
  mapId: string;
  version: string;
  libraries: Libraries;
  hasValidMapId: boolean;
}): LoaderOptions {
  // 基本設定を作成
  const baseOptions: LoaderOptions = {
    apiKey: options.apiKey || '',
    version: options.version,
    libraries: options.libraries,
    language: 'ja',
    region: 'JP',
  };

  // マップIDが有効な場合のみマップID設定を追加
  if (options.hasValidMapId) {
    return {
      ...baseOptions,
      mapIds: [options.mapId],
    };
  }

  // それ以外は基本設定のみを返す
  return baseOptions;
}

/**
 * デバイス検出のためのブレークポイント値（ピクセル）
 */
export const DEVICE_BREAKPOINT = 768;

/**
 * デバイスタイプ検出
 * ビューポートサイズに基づいてデバイスタイプを判定
 * @returns モバイルデバイスかどうか
 */
export const isMobileDevice = (): boolean => {
  // 型安全なチェックを追加
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;

  // navigatorオブジェクトの存在と型安全なプロパティアクセスを確保
  const hasTouchSupport =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    ('ontouchstart' in window ||
      ('maxTouchPoints' in navigator &&
        typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 0));

  return windowWidth <= DEVICE_BREAKPOINT || hasTouchSupport;
};

/**
 * 現在のデバイスに適したマップオプションを取得
 * @returns マップ初期化オプション
 */
export const getResponsiveMapOptions = (): google.maps.MapOptions => {
  return logger.measureTime(
    'レスポンシブマップオプションの決定',
    () => {
      const isMobile = isMobileDevice();
      logger.debug('デバイスタイプに基づくマップオプションを選択', {
        isMobileDevice: isMobile,
        selectedOption: isMobile ? 'MOBILE_MAP_OPTIONS' : 'DEFAULT_MAP_OPTIONS',
      });

      return isMobile ? MOBILE_MAP_OPTIONS : DEFAULT_MAP_OPTIONS;
    },
    LogLevel.DEBUG
  );
};
