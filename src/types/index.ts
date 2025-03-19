/**
 * 型定義のバレルファイル
 *
 * アプリケーション全体の型定義をシンプルにエクスポートします。
 * 依存関係の順序を守りながら循環参照を防止します。
 */

// ============================================================================
// 依存関係の少ない基本型から順にエクスポート
// ============================================================================

// 基本型定義（他の型に依存しない最も基本的な型）
export * from './base.types';

// 地理情報関連の型
export * from './geo.types';

// エリア関連の型
export * from './areas.types';

// エラー関連の型
export * from './errors.types';

// ローディング関連の型
export * from './loading.types';

// Sheets関連の型
export * from './sheets.types';

// POI関連の型
export * from './poi.types';

// マーカー関連の型
export * from './markers.types';

// マップ関連の型
export * from './maps.types';

// UI関連の型
export * from './ui.types';

// 設定関連の型
export * from './config.types';

// ============================================================================
// 頻繁に使用される型のエイリアス
// ============================================================================

// エクスポートする共通型へのわかりやすいエイリアスを提供
export {
  // よく使用される基本型
  type BaseProps,
  type BaseEntity,
  type Result,
} from './base.types';

export {
  // 地理データ型
  type LatLngLiteral,
  type Bounds,
  createLatLng,
  createLatitude,
  createLongitude,
} from './geo.types';

export {
  // エリア関連
  type AreaType,
  type AreaInfo,
  type AreaVisibility,
  AreaCategory,
} from './areas.types';

export {
  // POI関連
  type Poi,
  type PoiGenre,
  type PoiSearchParams,
} from './poi.types';

export {
  // 設定関連
  type AppConfig,
  type DisplayConfig,
  type EnvironmentName,
} from './config.types';

export {
  // エラー関連
  type AppError,
  type ErrorCategory,
  CommonErrorCode,
} from './errors.types';

export {
  // ローディング関連
  type LoadingState,
  LoadingStatus,
  createInitialLoadingState,
} from './loading.types';
