/**
 * UI関連の型定義ファイル
 */

/// <reference types="@types/google.maps" />
import type {
  AreaType,
  AreaVisibility as AreaVisibilityMap,
  AreaInfo,
  AreasByCategory,
  AreaCategory,
} from './areas.types';
import type { BaseProps } from './base.types';
import type { LatLngLiteral } from './geo.types';
import type { Poi } from './poi.types';

/**
 * ピクセルオフセットの型定義
 */
export interface PixelOffset {
  width: number; // 幅
  height: number; // 高さ
  equals?: (other: any) => boolean; // 等価性比較メソッド
  toString?: () => string; // 文字列表現メソッド
}

/**
 * 状態更新関数の共通型
 */
export type StateUpdater<T> = T | ((prev: T) => T);

/**
 * メニューアイテムのアクション識別子型
 */
export type MenuItemAction = keyof MenuActionType;

/**
 * 情報ウィンドウの設定オプション
 */
export interface InfoWindowConfig {
  maxWidth: number; // 最大の幅（ピクセル）
  pixelOffset: google.maps.Size | PixelOffset; // 座標からのオフセット位置
  closeOnMapClick: boolean; // マップクリック時に閉じるかどうか
  mobileAdjustment?: {
    maxWidth?: number; // モバイル用の最大幅
    scale?: number; // スケーリング係数
  };
  animation?: {
    type?: 'fade' | 'slide'; // アニメーション種類
    duration?: number; // アニメーション時間（ミリ秒）
  };
}

/**
 * フィルタリング機能を持つコンポーネントの共通プロパティ
 */
export interface AreaFilteringProps {
  pois: Poi[]; // フィルター対象のすべてのPOI
  setSelectedPoi: (poi: Poi | null) => void; // 選択されたPOIを設定する関数
  setAreaVisibility: (visibility: StateUpdater<AreaVisibilityMap>) => void; // エリア表示状態を設定
  localAreaVisibility: AreaVisibilityMap; // ローカルなエリア表示状態
  setLocalAreaVisibility: (visibility: StateUpdater<AreaVisibilityMap>) => void; // ローカル状態を設定
  currentLocation: LatLngLiteral | null; // ユーザーの現在位置
  setCurrentLocation: (location: StateUpdater<LatLngLiteral | null>) => void; // 現在位置を設定する関数
  setShowWarning: (show: boolean) => void; // 位置情報の警告表示を制御する関数
}

/**
 * エリア選択UIのプロパティ型
 */
export interface AreaSelectorProps extends BaseProps {
  areas: AreaInfo[]; // 利用可能なすべてのエリア情報
  areasByCategory: AreasByCategory; // カテゴリごとにグループ化されたエリア
  visibility: AreaVisibilityMap; // 現在の表示状態
  onVisibilityChange: (areaId: AreaType, isVisible: boolean) => void; // 表示状態変更ハンドラ
  onToggleAll: (isVisible: boolean) => void; // すべてのエリアの表示/非表示を切り替える
  onToggleCategory: (category: AreaCategory, isVisible: boolean) => void; // カテゴリ内の切り替え
}

/**
 * 情報ウィンドウのプロパティ型
 */
export interface InfoWindowProps extends BaseProps {
  poi: Poi; // 表示する詳細情報のPOIオブジェクト
  onClose: () => void; // 情報ウィンドウを閉じるときに呼び出される関数
  config?: Partial<InfoWindowConfig>; // 情報ウィンドウの設定オプション
  isMobile?: boolean; // モバイルデバイス表示かどうか
}

/**
 * 位置情報の警告コンポーネントのプロパティ型
 */
export interface LocationWarningProps extends BaseProps {
  onClose: () => void; // 警告を閉じるときに呼び出される関数
  onRetry?: () => void; // 位置情報へのアクセスを再試行する関数
  errorMessage?: string; // エラーメッセージ（エラー発生時）
}

/**
 * ハンバーガーメニューのプロパティ型
 */
export interface HamburgerMenuProps extends AreaFilteringProps, BaseProps {
  onSearch: (query: string) => void; // 検索クエリが送信されたときに呼び出される関数
  searchResults: Poi[]; // 現在の検索結果
  onSearchResultClick: (poi: Poi) => void; // 検索結果の項目がクリックされたときの関数
}

/**
 * メニューアクション型
 */
export type MenuActionType = {
  onAreaSelect: () => void; // エリア選択メニューを表示する関数
  onFeedbackRequest: () => void; // フィードバックフォームを表示する関数
  onToggleSearchBar: () => void; // 検索バーの表示/非表示を切り替える関数
};

/**
 * メニューアイテムの型
 */
export interface MenuItem {
  label: string; // メニュー項目の表示ラベル
  title: string; // メニュー項目のアクセシビリティ用タイトル
  action: MenuItemAction; // 実行するアクションのキー
  icon: string; // メニュー項目のアイコン識別子
}

/**
 * フィルターパネルのプロパティ型
 */
export interface FilterPanelProps extends AreaFilteringProps, BaseProps {
  isFilterPanelOpen: boolean; // フィルターパネルの表示/非表示状態
  onClose: () => void; // パネルを閉じるときに呼び出される関数
}

/**
 * 検索バーコンポーネントのプロパティ型
 */
export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void; // 検索クエリが送信されたときに呼び出される関数
  pois: Poi[]; // 検索対象となるPOIの配列
  placeholder?: string; // プレースホルダーテキスト
  searchButtonLabel?: string; // 検索ボタンのラベル
  isSearching?: boolean; // 検索中の状態
}

/**
 * 検索結果コンポーネントのプロパティ型
 */
export interface SearchResultsProps extends BaseProps {
  results: Poi[]; // 表示する検索結果のPOIデータ配列
  onResultClick: (poi: Poi) => void; // 検索結果の項目がクリックされたときの関数
  noResultsMessage?: string; // 結果が空の場合のメッセージ
}

/**
 * フィードバックフォームのプロパティ型
 */
export interface FeedbackFormProps extends BaseProps {
  onClose: () => void; // フォームを閉じるときに呼び出される関数
  onSubmit?: (formData: Record<string, unknown>) => void; // フォーム送信時に呼び出される関数
  initialData?: Record<string, unknown>; // 初期フォームデータ（オプション）
}