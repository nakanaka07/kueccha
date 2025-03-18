/**
 * サービスのバレルファイル
 *
 * アプリケーション全体で使用されるサービス群を構造化してエクスポートします。
 * これらのサービスはアプリケーションの中核機能を提供し、
 * ビジネスロジックとビュー層の橋渡しをします。
 */

// ============================================================================
// 直接エクスポート（下位互換性のため）
// ============================================================================

// 設定サービス
export * from './config.services';

// デバイス検出サービス
export * from './device.services';

// フォーマッターサービス
export * from './formatters.services';

// ============================================================================
// 名前空間によるグループ化
// ============================================================================

// 個別サービスのインポート
import * as ConfigService from './config.services';
import * as DeviceService from './device.services';
import * as FormattersService from './formatters.services';

/**
 * 設定サービス
 *
 * アプリケーション全体の設定を管理し、環境変数の検証を行います。
 */
export const Config = {
  /** アプリケーション全体設定オブジェクト */
  CONFIG: ConfigService.CONFIG,
  /** 設定を検証する関数 */
  validate: ConfigService.validateConfig,
  /** 必須環境変数の配列（内部で使用） */
  REQUIRED_ENV_VARS: ['VITE_GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_SHEETS_API_KEY'],
};

/**
 * デバイス検出サービス
 *
 * デバイスタイプとビューポートサイズを検出し、
 * レスポンシブUIのための情報を提供します。
 */
export const Device = {
  /** ユーザーエージェントに基づくモバイル判定 */
  isMobile: DeviceService.isMobileDevice,
  /** 画面サイズに基づくモバイル判定 */
  isMobileViewport: DeviceService.isMobileViewport,
  /** デバイスと画面サイズを総合したモバイル判定 */
  isMobileExperience: DeviceService.isMobileExperience,
  /** レスポンシブ設計のブレークポイント */
  BREAKPOINTS: DeviceService.BREAKPOINTS,
  /** デバイス設定の統合オブジェクト */
  config: DeviceService.DeviceConfig,
};

/**
 * フォーマッターサービス
 *
 * データの整形と表示形式への変換機能を提供します。
 * 主にPOI（Point of Interest）情報の表示に使用されます。
 */
export const Formatters = {
  /** POIの詳細情報全体をフォーマット */
  poiDetails: FormattersService.formatPoiDetails,
  /** 営業時間情報をフォーマット */
  businessHours: FormattersService.formatBusinessHours,
  /** 休日情報をフォーマット */
  holidayInfo: FormattersService.formatHolidayInfo,
  /** 情報テキストをフォーマットしてリンクを追加 */
  information: FormattersService.formatInformation,
  /** 住所情報をフォーマット */
  address: FormattersService.formatAddress,
  /** 電話番号の有効性を検証 */
  isValidPhone: FormattersService.isValidPhoneNumber,
};

// ============================================================================
// 統合サービスアクセス
// ============================================================================

/**
 * 統合サービスアクセス
 *
 * よく使用されるサービス機能への簡易アクセスを提供します。
 * 複数のサービスを横断する処理のインターフェースとして機能します。
 */
export const App = {
  /** アプリケーション設定 */
  config: ConfigService.CONFIG,
  /** モバイル環境かどうかを判定 */
  isMobile: DeviceService.isMobileExperience,
  /** POI詳細情報をフォーマット */
  formatPoiDetails: FormattersService.formatPoiDetails,
  /** アプリケーション設定の検証を実行 */
  validateConfig: ConfigService.validateConfig,
  /** デバイス情報 */
  device: DeviceService.DeviceConfig,
};

/**
 * UI表示関連のヘルパー
 *
 * ユーザーインターフェース表示に関する機能をグループ化します。
 */
export const UI = {
  /** 情報テキストをリンク付きでフォーマット */
  formatInfoText: FormattersService.formatInformation,
  /** モバイル表示かどうかを判定 */
  isMobile: DeviceService.isMobileExperience,
  /** 画面サイズのブレークポイント */
  breakpoints: DeviceService.BREAKPOINTS,
};

/**
 * データ整形ヘルパー
 *
 * データの整形と変換に関する機能をグループ化します。
 */
export const Format = {
  /** POI詳細情報を整形 */
  poi: FormattersService.formatPoiDetails,
  /** 営業時間情報を整形 */
  businessHours: FormattersService.formatBusinessHours,
  /** 休日情報を整形 */
  holidayInfo: FormattersService.formatHolidayInfo,
  /** 住所情報を整形 */
  address: FormattersService.formatAddress,
  /** テキスト情報をリンク付きで整形 */
  information: FormattersService.formatInformation,
};

// ============================================================================
// デフォルトエクスポート
// ============================================================================

/**
 * アプリケーション設定をデフォルトエクスポート
 * 最も頻繁に使用される設定オブジェクトへの簡単なアクセスを提供します。
 */
export default ConfigService.CONFIG;
