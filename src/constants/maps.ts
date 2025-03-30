import { ENV, getMapsApiVersion, getMapsLibraries, isDevEnvironment } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';
// 環境ユーティリティ関数を追加インポート

// Libraries型を正しく定義
import type { LoaderOptions } from '@googlemaps/js-api-loader';
// Google Maps APIで使用される有効なライブラリの型定義
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
  LEFT_TOP: 5, // google.maps.ControlPosition.LEFT_TOP
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
 * マップID関連設定
 * Cloud-based stylingのIDとフォールバックオプション
 */
export const MAP_ID_CONFIG = {
  /** メインマップID - 環境変数から取得 */
  MAIN: ENV.google.MAPS_MAP_ID || '',

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
        logger.debug('Google Mapsオブジェクトが利用できません');
        return false;
      }

      // googleオブジェクトが存在する場合、mapsプロパティをチェック
      // Record<string, unknown>型を使用して型安全に存在確認
      const googleObj = window.google as Record<string, unknown>;
      const mapsAvailable =
        Object.prototype.hasOwnProperty.call(googleObj, 'maps') && googleObj.maps !== undefined;

      if (mapsAvailable) {
        logger.debug('Google Mapsオブジェクトが利用可能です');
      }

      return mapsAvailable;
    },
    LogLevel.DEBUG
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
  mapId: MAP_ID_CONFIG.MAIN || null,

  /** ジェスチャー設定 - 'greedy'でモバイル操作性向上 */
  gestureHandling: 'greedy' as const,

  /** デフォルトPOIアイコンのクリック有効化 */
  clickableIcons: true,

  /** UI要素の表示設定 */
  disableDefaultUI: false,

  /** ズームコントロール */
  zoomControl: true,
  get zoomControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_BOTTOM
        : CONTROL_POSITIONS.RIGHT_BOTTOM,
    };
  },

  /** マップタイプコントロール */
  mapTypeControl: true,
  get mapTypeControlOptions() {
    // 型安全なアクセスを確保
    const googleMaps = typeof google !== 'undefined' && google.maps;

    return {
      position:
        isGoogleMapsAvailable() && googleMaps
          ? googleMaps.ControlPosition.TOP_RIGHT
          : CONTROL_POSITIONS.TOP_RIGHT,
      style:
        isGoogleMapsAvailable() && googleMaps
          ? googleMaps.MapTypeControlStyle.DROPDOWN_MENU
          : MAP_TYPE_CONTROL_STYLES.DROPDOWN_MENU,
      mapTypeIds:
        isGoogleMapsAvailable() && googleMaps
          ? [
              googleMaps.MapTypeId.ROADMAP,
              googleMaps.MapTypeId.SATELLITE,
              googleMaps.MapTypeId.HYBRID,
              googleMaps.MapTypeId.TERRAIN,
            ]
          : [
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
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_BOTTOM
        : CONTROL_POSITIONS.RIGHT_BOTTOM,
    };
  },

  /** フルスクリーンコントロール */
  fullscreenControl: true,
  get fullscreenControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_TOP
        : CONTROL_POSITIONS.RIGHT_TOP,
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
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.RIGHT_CENTER
        : CONTROL_POSITIONS.RIGHT_CENTER,
    };
  },
  get fullscreenControlOptions() {
    return {
      position: isGoogleMapsAvailable()
        ? google.maps.ControlPosition.LEFT_TOP
        : CONTROL_POSITIONS.LEFT_TOP,
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
      const apiKey = ENV.google.API_KEY;
      const mapId = MAP_ID_CONFIG.MAIN;
      const version = getMapsApiVersion();
      // ライブラリ文字列を明示的に型変換して安全に扱う
      const libraryStrings = getMapsLibraries();
      const libraries = libraryStrings.filter(lib =>
        ['maps', 'core', 'places', 'geometry', 'drawing', 'marker', 'visualization'].includes(lib)
      ) as Libraries;

      logger.info('Google Maps API設定を生成', {
        hasApiKey: !!apiKey,
        hasMapId: MAP_ID_CONFIG.isValid(mapId),
        version,
        libraries,
        environment: isDevEnvironment() ? 'development' : 'production',
      });

      return {
        apiKey: apiKey || '',
        version,
        libraries,
        language: 'ja',
        region: 'JP',
        mapIds: mapId ? [mapId] : undefined,
      };
    },
    LogLevel.DEBUG
  );
};

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
