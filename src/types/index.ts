/**
 * 型定義のバレルファイル
 * 
 * アプリケーション全体の型定義を構造化してエクスポートします。
 * 依存関係の明確化と循環参照の防止に配慮した設計です。
 */

// ============================================================================
// 依存関係の少ない基本型から順にエクスポート
// ============================================================================

// 基本型定義（他の型に依存しない最も基本的な型）
export * from './base.types';

// 地理情報関連の型（基本型のみに依存）
export * from './geo.types';

// エリア関連の型（地理情報型に依存）
export * from './areas.types';

// エラー関連の型（基本型のみに依存）
export * from './errors.types';

// ローディング関連の型（エラー型と基本型に依存）
export * from './loading.types';

// Sheets関連の型（基本型とエラー型に依存）
export * from './sheets.types';

// POI関連の型（地理情報型、エリア型、基本型に依存）
export * from './poi.types';

// マーカー関連の型（POI型、エリア型、基本型に依存）
export * from './markers.types';

// マップ関連の型（マーカー型、POI型、地理情報型に依存）
export * from './maps.types';

// UI関連の型（マップ型、POI型などに依存）
export * from './ui.types';

// 設定関連の型（すべての型に依存する可能性があるため最後）
export * from './config.types';

// 国際化関連の型定義
// 実装注意: 循環参照を避けるため、シンプルな型のみをインポート
export type { SupportedLanguage } from '../constants/i18n.constants';

// ============================================================================
// 名前空間によるグループ化（型の組織化と名前衝突防止）
// ============================================================================

// 循環参照を避けるため、各型モジュールをimport typeとして読み込む
import type * as BaseTypes from './base.types';
import type * as GeoTypes from './geo.types';
import type * as AreasTypes from './areas.types';
import type * as ErrorsTypes from './errors.types';
import type * as LoadingTypes from './loading.types';
import type * as SheetsTypes from './sheets.types';
import type * as PoiTypes from './poi.types';
import type * as MarkersTypes from './markers.types';
import type * as MapsTypes from './maps.types';
import type * as UiTypes from './ui.types';
import type * as ConfigTypes from './config.types';

/**
 * モジュール別の名前空間
 * 重複する型名を避けるためのネームスペース
 */
export const Types = {
  Base: BaseTypes,
  Geo: GeoTypes,
  Areas: AreasTypes,
  Errors: ErrorsTypes,
  Loading: LoadingTypes,
  Sheets: SheetsTypes,
  Poi: PoiTypes,
  Markers: MarkersTypes,
  Maps: MapsTypes,
  Ui: UiTypes,
  Config: ConfigTypes
} as const;

// ============================================================================
// 機能グループ別の型エクスポート（関連する型の集約）
// ============================================================================

/**
 * エンティティ関連の型をグループ化
 * データモデル関連の主要な型を一箇所に集約
 */
export const Entities = {
  Base: BaseTypes.BaseEntity,
  Extended: BaseTypes.ExtendedBaseEntity,
  Poi: PoiTypes.Poi,
  Area: AreasTypes.AreaInfo
} as const;

/**
 * コンポーネントProps関連の型をグループ化
 * Reactコンポーネントのprops型を機能別に分類
 */
export const Props = {
  Base: BaseTypes.BaseProps,
  Map: MapsTypes.MapProps,
  Marker: MarkersTypes.MarkerProps,
  AreaSelector: UiTypes.AreaSelectorProps,
  InfoWindow: UiTypes.InfoWindowProps,
  FilterPanel: UiTypes.FilterPanelProps,
  SearchBar: UiTypes.SearchBarProps,
  ErrorBoundary: ErrorsTypes.ErrorBoundaryProps,
  LoadingFallback: LoadingTypes.LoadingFallbackProps
} as const;

/**
 * 設定関連の型をグループ化
 * アプリケーション全体の設定に関する型
 */
export const Configuration = {
  App: ConfigTypes.AppConfig,
  Map: MapsTypes.MapConfig,
  Display: ConfigTypes.DisplayConfig,
  Environment: ConfigTypes.EnvironmentConfig,
  ErrorHandling: ConfigTypes.ErrorHandlingConfig,
  Sheets: SheetsTypes.SheetsConfig
} as const;

/**
 * ヘルパーとユーティリティの型
 * アプリケーション全体で使用される汎用的な型
 */
export const Utils = {
  Result: BaseTypes.Result,
  LoadingState: LoadingTypes.LoadingState,
  AreaVisibility: AreasTypes.AreaVisibility,
  MapDisplayMode: MapsTypes.MapDisplayMode,
  Distance: GeoTypes.Distance,
  Pagination: {
    Params: BaseTypes.PaginationParams,
    Meta: BaseTypes.PaginationMeta
  },
  // 型安全なユーティリティ関数を追加
  CreateProgress: LoadingTypes.validateProgress,
  CreateLoadingState: LoadingTypes.createInitialLoadingState
} as const;

// ============================================================================
// よく使用される型定数（型安全な列挙値）
// ============================================================================

/**
 * エリア関連の頻出値
 * 読み取り専用として型安全に定義
 */
export const AreaConstants = {
  Categories: AreasTypes.AreaCategory
} as const;

/**
 * 地図関連の頻出値
 * 読み取り専用として型安全に定義
 */
export const MapConstants = {
  ControlPositions: MapsTypes.ControlPosition,
  TypeControlStyles: MapsTypes.MapTypeControlStyle,
  DisplayModes: MapsTypes.MapDisplayMode
} as const;

/**
 * エラー関連の頻出値
 * 読み取り専用として型安全に定義
 */
export const ErrorConstants = {
  LoadingStatus: LoadingTypes.LoadingStatus,
  CommonErrorCodes: ErrorsTypes.CommonErrorCode
} as const;

// ============================================================================
// 型安全なヘルパー関数（型推論の強化）
// ============================================================================

/**
 * 型安全に設定を取得するためのヘルパー関数型
 * 例: const mapConfig = getConfig('maps');
 */
export type ConfigGetter = <K extends keyof ConfigTypes.AppConfig>(
  key: K
) => ConfigTypes.AppConfig[K];

/**
 * 型安全なエリア情報取得関数型
 * 例: const area = getAreaInfo('RYOTSU_AIKAWA');
 */
export type AreaInfoGetter = (
  areaId: AreasTypes.AreaType
) => AreasTypes.AreaInfo | undefined;