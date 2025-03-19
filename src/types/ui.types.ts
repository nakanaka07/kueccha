/**
 * UI関連の型定義ファイル
 *
 * アプリケーションのUIコンポーネントで使用される型を定義します。
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

// ============================================================================
// Google Maps関連の型定義
// ============================================================================

/**
 * ピクセルオフセットの型定義
 * Google Maps の Size オブジェクトと互換性を持つインターフェース
 */
export interface PixelOffset {
  /** 幅 */
  width: number;

  /** 高さ */
  height: number;

  /** 等価性比較メソッド */
  equals?: (other: any) => boolean;

  /** 文字列表現メソッド */
  toString?: () => string;
}

// ============================================================================
// 共通の型エイリアス
// ============================================================================

/**
 * 状態更新関数の共通型
 * 直接値または更新関数を受け取れるようにする
 */
export type StateUpdater<T> = T | ((prev: T) => T);

/**
 * メニューアイテムのアクション識別子型
 * メニューアクションの一覧として使用されます
 */
export type MenuItemAction = keyof MenuActionType;

// ============================================================================
// 設定関連の型定義
// ============================================================================

/**
 * 情報ウィンドウの設定オプション
 * Google Maps InfoWindowのカスタム設定を定義します
 */
export interface InfoWindowConfig {
  /** 最大の幅（ピクセル） */
  maxWidth: number;

  /** 座標からのオフセット位置 */
  pixelOffset: google.maps.Size | PixelOffset;

  /** マップクリック時に閉じるかどうか */
  closeOnMapClick: boolean;

  /** モバイルでの表示調整 */
  mobileAdjustment?: {
    /** モバイル用の最大幅 */
    maxWidth?: number;

    /** スケーリング係数 */
    scale?: number;
  };

  /** アニメーション設定 */
  animation?: {
    /** アニメーション種類 */
    type?: 'fade' | 'slide';

    /** アニメーション時間（ミリ秒） */
    duration?: number;
  };
}

// ============================================================================
// 共通の基底インターフェース
// ============================================================================

/**
 * フィルタリング機能を持つコンポーネントの共通プロパティ
 * 複数のUI要素で共有される地図フィルタリング関連の機能を定義します
 */
export interface AreaFilteringProps {
  /** フィルター対象のすべてのPOI（ポイントオブインタレスト） */
  pois: Poi[];

  /** 選択されたPOIを設定する関数 */
  setSelectedPoi: (poi: Poi | null) => void;

  /** エリア表示状態を設定する関数 */
  setAreaVisibility: (visibility: StateUpdater<AreaVisibilityMap>) => void;

  /** ローカルなエリア表示状態 */
  localAreaVisibility: AreaVisibilityMap;

  /** ローカルなエリア表示状態を設定する関数 */
  setLocalAreaVisibility: (visibility: StateUpdater<AreaVisibilityMap>) => void;

  /** ユーザーの現在位置 */
  currentLocation: LatLngLiteral | null;

  /** 現在位置を設定する関数 */
  setCurrentLocation: (location: StateUpdater<LatLngLiteral | null>) => void;

  /** 位置情報の警告表示を制御する関数 */
  setShowWarning: (show: boolean) => void;
}

// ============================================================================
// エリア選択関連の型定義
// ============================================================================

/**
 * エリア選択UIのプロパティ型
 * エリアのカテゴリ別表示とフィルタリング用
 */
export interface AreaSelectorProps extends BaseProps {
  /** 利用可能なすべてのエリア情報 */
  areas: AreaInfo[];

  /** カテゴリごとにグループ化されたエリア */
  areasByCategory: AreasByCategory;

  /** 現在の表示状態 */
  visibility: AreaVisibilityMap;

  /** 表示状態変更ハンドラ */
  onVisibilityChange: (areaId: AreaType, isVisible: boolean) => void;

  /** すべてのエリアの表示/非表示を切り替える */
  onToggleAll: (isVisible: boolean) => void;

  /** カテゴリ内のすべてのエリアの表示/非表示を切り替える */
  onToggleCategory: (category: AreaCategory, isVisible: boolean) => void;
}

// ============================================================================
// 情報表示関連の型定義
// ============================================================================

/**
 * 情報ウィンドウのプロパティ型
 * マップ上のPOIをクリックした際に表示される詳細情報ウィンドウを制御します
 */
export interface InfoWindowProps extends BaseProps {
  /** 表示する詳細情報のPOIオブジェクト */
  poi: Poi;

  /** 情報ウィンドウを閉じるときに呼び出される関数 */
  onClose: () => void;

  /** 情報ウィンドウの設定オプション */
  config?: Partial<InfoWindowConfig>;

  /** モバイルデバイス表示かどうか */
  isMobile?: boolean;
}

/**
 * 位置情報の警告コンポーネントのプロパティ型
 * 位置情報の使用に関する警告を表示する際に使用されます
 * geo.types.ts から統合して一元管理
 */
export interface LocationWarningProps extends BaseProps {
  /** 警告を閉じるときに呼び出される関数 */
  onClose: () => void;

  /** 位置情報へのアクセスを再試行する関数 */
  onRetry?: () => void;

  /** エラーメッセージ（エラー発生時） */
  errorMessage?: string;
}

// ============================================================================
// ナビゲーション関連の型定義
// ============================================================================

/**
 * ハンバーガーメニューのプロパティ型
 * モバイルビューでのナビゲーションメニューを制御します
 */
export interface HamburgerMenuProps extends AreaFilteringProps, BaseProps {
  /** 検索クエリが送信されたときに呼び出される関数 */
  onSearch: (query: string) => void;

  /** 現在の検索結果 */
  searchResults: Poi[];

  /** 検索結果の項目がクリックされたときに呼び出される関数 */
  onSearchResultClick: (poi: Poi) => void;
}

/**
 * メニューアクション型
 * メニュー内の各アクションを定義します
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
 * メニューアイテムの型
 * メニュー内の各項目の構造を定義します
 */
export interface MenuItem {
  /** メニュー項目の表示ラベル */
  label: string;

  /** メニュー項目のアクセシビリティ用タイトル */
  title: string;

  /** 実行するアクションのキー */
  action: MenuItemAction;

  /** メニュー項目のアイコン識別子 */
  icon: string;
}

// ============================================================================
// フィルタリング関連の型定義
// ============================================================================

/**
 * フィルターパネルのプロパティ型
 * マップ上のPOIフィルタリングUIを制御するために使用されます
 */
export interface FilterPanelProps extends AreaFilteringProps, BaseProps {
  /** フィルターパネルの表示/非表示状態 */
  isFilterPanelOpen: boolean;

  /** パネルを閉じるときに呼び出される関数 */
  onClose: () => void;
}

// ============================================================================
// 検索関連の型定義
// ============================================================================

/**
 * 検索バーコンポーネントのプロパティ型
 * POI検索機能を提供するUIコンポーネントを制御します
 */
export interface SearchBarProps extends BaseProps {
  /** 検索クエリが送信されたときに呼び出される関数 */
  onSearch: (query: string) => void;

  /** 検索対象となるPOIの配列 */
  pois: Poi[];

  /** プレースホルダーテキスト */
  placeholder?: string;

  /** 検索ボタンのラベル */
  searchButtonLabel?: string;

  /** 検索中の状態 */
  isSearching?: boolean;
}

/**
 * 検索結果コンポーネントのプロパティ型
 * 検索結果のPOIリストを表示し、クリックイベントを処理するコンポーネント用
 */
export interface SearchResultsProps extends BaseProps {
  /** 表示する検索結果のPOIデータ配列 */
  results: Poi[];

  /** 検索結果の項目がクリックされたときに呼び出されるコールバック関数 */
  onResultClick: (poi: Poi) => void;

  /** 結果が空の場合のメッセージ */
  noResultsMessage?: string;
}

// ============================================================================
// フォーム関連の型定義
// ============================================================================

/**
 * フィードバックフォームのプロパティ型
 * ユーザーからのフィードバックを収集するフォームコンポーネントの設定に使用されます
 */
export interface FeedbackFormProps extends BaseProps {
  /** フォームを閉じるときに呼び出される関数 */
  onClose: () => void;

  /** フォーム送信時に呼び出される関数 */
  onSubmit?: (formData: Record<string, unknown>) => void;

  /** 初期フォームデータ（オプション） */
  initialData?: Record<string, unknown>;
}
