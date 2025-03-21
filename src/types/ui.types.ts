/**
 * UI関連の型定義ファイル
 *
 * このファイルには、UIコンポーネント、コントロール、共通プロパティなど、
 * ユーザーインターフェース関連のすべての型定義が含まれています。
 *
 * 主要セクション:
 * - 基本UI型: 共通のプロパティと設定
 * - コンポーネント型: 表示用UIコンポーネントのプロパティ
 * - コントロール型: ユーザー入力と操作のためのコンポーネント
 * - フィルタリング型: データのフィルタリングと選択に関連するコンポーネント
 */

import type { BaseProps, Dimensions, AnimationOptions, StateUpdater } from './base.types';
import type { LatLngLiteral } from './geo.types';
import type { Poi } from './poi.types';
import type {
  AreaType,
  AreaVisibility,
  AreaInfo,
  AreasByCategory,
  AreaCategory,
} from './areas.types';

// ============================================================================
// 基本UI型
// ============================================================================

/**
 * ピクセルオフセットの型定義
 * base.types.tsのDimensionsを活用
 *
 * Google Maps APIのSizeと互換性のある独自実装。
 * Google Mapsがロードされていない状態でも使用できます。
 *
 * @see GoogleMapsのSizeクラスの互換シグネチャ
 * @see constants/ui.constants.ts の createSafePixelOffset 関数で生成
 */
export interface PixelOffset extends Dimensions {
  /** 他のオフセットオブジェクトとの等価性を比較するメソッド */
  equals?: (other: PixelOffset | google.maps.Size) => boolean;

  /** デバッグ表示用の文字列表現を返すメソッド */
  toString?: () => string;
}

// ============================================================================
// フィルタリング関連
// ============================================================================

/**
 * フィルタリング機能を持つコンポーネントの共通プロパティ
 */
export interface AreaFilteringProps {
  /** フィルター対象のすべてのPOI */
  pois: Poi[];

  /** 選択されたPOIを設定する関数 */
  setSelectedPoi: (poi: Poi | null) => void;

  /** グローバルなエリア表示状態を設定する関数 */
  setAreaVisibility: (visibility: StateUpdater<AreaVisibility>) => void;

  /** コンポーネント内部のエリア表示状態 */
  localAreaVisibility: AreaVisibility;

  /** コンポーネント内部のエリア表示状態を設定する関数 */
  setLocalAreaVisibility: (visibility: StateUpdater<AreaVisibility>) => void;

  /** ユーザーの現在位置 */
  currentLocation: LatLngLiteral | null;

  /** 現在位置を設定する関数 */
  setCurrentLocation: (location: StateUpdater<LatLngLiteral | null>) => void;

  /** 位置情報の警告表示を制御する関数 */
  setShowWarning: (show: boolean) => void;
}

/**
 * エリア選択UIのプロパティ型
 */
export interface AreaSelectorProps extends BaseProps {
  /** 利用可能なすべてのエリア情報 */
  areas: AreaInfo[];

  /** カテゴリごとにグループ化されたエリア */
  areasByCategory: AreasByCategory;

  /** 現在の表示状態 */
  visibility: AreaVisibility;

  /** 個別エリアの表示/非表示を切り替える関数 */
  onVisibilityChange: (areaId: AreaType, isVisible: boolean) => void;

  /** すべてのエリアの表示/非表示を一括切り替えする関数 */
  onToggleAll: (isVisible: boolean) => void;

  /** 特定カテゴリに属するすべてのエリアを切り替える関数 */
  onToggleCategory: (category: AreaCategory, isVisible: boolean) => void;
}

// ============================================================================
// 情報ウィンドウ関連
// ============================================================================

/**
 * 情報ウィンドウのプロパティ型
 */
export interface InfoWindowProps extends BaseProps {
  poi: Poi;
  position: LatLngLiteral;
  pixelOffset?: PixelOffset;
  onClose: () => void;
  maxWidth?: number;
  animation?: AnimationOptions;
}

// ============================================================================
// メニュー関連
// ============================================================================

/**
 * メニューアクション型
 */
export type MenuActionType = {
  /** エリア選択メニューを表示する関数 */
  onAreaSelect: () => void;

  /** フィードバックフォームを表示する関数 */
  onFeedbackRequest: () => void;

  /** 検索バーの表示/非表示を切り替える関数 */
  onToggleSearchBar: () => void;
};

/**
 * メニューアイテムのアクション識別子型
 */
export type MenuItemAction = keyof MenuActionType;

/**
 * メニュー項目の定義
 */
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action?: MenuItemAction;
  disabled?: boolean;
  children?: MenuItem[];
  divider?: boolean;
}

// ============================================================================
// 検索コンポーネント関連
// ============================================================================

/**
 * 検索結果コンポーネントのプロパティ型
 */
export interface SearchResultsProps extends BaseProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
  onClear: () => void;
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
}

/**
 * 検索バーコンポーネントのプロパティ型
 */
export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
  debounceTime?: number;
}

/**
 * フィードバックフォームのプロパティ型
 */
export interface FeedbackFormProps extends BaseProps {
  onSubmit: (data: { name: string; email: string; message: string }) => Promise<void>;
  onCancel: () => void;
}
