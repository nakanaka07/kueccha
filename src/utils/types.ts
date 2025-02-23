// @react-google-maps/apiからLoadScriptPropsをインポートします。
// ReactNode型をインポートします。
// 定数AREASとBUSINESS_HOURSをインポートします。
import { LoadScriptProps } from '@react-google-maps/api';
import { ReactNode } from 'react';
import { AREAS, INFO_WINDOW_BUSINESS_HOURS } from './constants';

// AREASのキーを表す型
export type AreaType = keyof typeof AREAS;

// 共通のプロパティを持つ基本的なプロパティ型
export interface BaseProps {
  className?: string; // 任意のクラス名
  style?: React.CSSProperties; // 任意のスタイル
}

// BUSINESS_HOURSのキーを表す型
export type BusinessHourKey = (typeof INFO_WINDOW_BUSINESS_HOURS)[number]['key'];

// アプリケーションの設定を表す型
export interface Config {
  maps: MapConfig; // マップの設定
  sheets: {
    apiKey: string; // Google Sheets APIキー
    spreadsheetId: string; // スプレッドシートID
  };
  markers: {
    colors: Record<string, string>; // マーカーの色設定
  };
}

// エラーバウンダリのプロパティ型
export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode; // 子要素
  fallback?: ReactNode; // フォールバック要素
}

// エラーバウンダリの状態型
export interface ErrorBoundaryState {
  hasError: boolean; // エラーが発生したかどうか
  error: Error | null; // エラーオブジェクト
  errorInfo: {
    componentStack: string; // コンポーネントスタック情報
  } | null;
}

// フィルターパネルのプロパティ型
export interface FilterPanelProps extends BaseProps {
  pois: Poi[]; // POIの配列
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // POI選択の状態を設定する関数
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // エリアの可視性を設定する関数
  isFilterPanelOpen: boolean; // フィルターパネルが開いているかどうか
  onCloseClick: () => void; // 閉じるボタンのクリックハンドラー
  localAreaVisibility: Record<AreaType, boolean>; // ローカルのエリア可視性
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // ローカルのエリア可視性を設定する関数
  currentLocation: LatLngLiteral | null; // 現在の位置
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>; // 現在の位置を設定する関数
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>; // 警告表示を設定する関数
}

// 情報ウィンドウのプロパティ型
export interface InfoWindowProps extends BaseProps {
  poi: Poi; // POIオブジェクト
  onCloseClick: () => void; // 閉じるボタンのクリックハンドラー
}

// 緯度経度を表す型
export interface LatLngLiteral {
  lat: number; // 緯度
  lng: number; // 経度
}

// ロケーションを表す型
export type Location = LatLngLiteral;

// ローディング中のフォールバックプロパティ型
export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean; // ローディング中かどうか
  message?: string; // ローディングメッセージ
  spinnerClassName?: string; // スピナーのクラス名
  isLoaded: boolean; // ロードが完了したかどうか
}

// マップの設定を表す型
export interface MapConfig {
  apiKey: string; // Google Maps APIキー
  mapId: string; // マップID
  defaultCenter: Location; // デフォルトの中心位置
  defaultZoom: number; // デフォルトのズームレベル
  libraries: LoadScriptProps['libraries']; // 使用するライブラリ
  language: string; // 言語設定
  version: string; // APIバージョン
  style: MapStyle; // マップのスタイル
  options: {
    mapId?: string; // マップID（オプション）
    disableDefaultUI: boolean; // デフォルトUIを無効にするかどうか
    zoomControl: boolean; // ズームコントロールを表示するかどうか
    mapTypeControl: boolean; // マップタイプコントロールを表示するかどうか
    streetViewControl: boolean; // ストリートビューコントロールを表示するかどうか
    fullscreenControl: boolean; // フルスクリーンコントロールを表示するかどうか
    clickableIcons: boolean; // アイコンをクリック可能にするかどうか
    mapTypeControlOptions?: {
      style: number; // マップタイプコントロールのスタイル
      position: number; // マップタイプコントロールの位置
    };
    styles?: google.maps.MapTypeStyle[]; // マップのスタイル設定
  };
}

// マップのプロパティ型
export interface MapProps extends BaseProps {
  pois: Poi[]; // POIの配列
}

// マップのスタイルを表す型
export interface MapStyle {
  width: string; // 幅
  height: string; // 高さ
}

// マーカーのプロパティ型
export interface MarkerProps extends BaseProps {
  poi: Poi; // POIオブジェクト
  onClick: (poi: Poi) => void; // クリックハンドラー
  map: google.maps.Map | null; // マップオブジェクト
}

// POI（ポイントオブインタレスト）を表す型
export interface Poi {
  id: string; // POIのID
  name: string; // POIの名前
  location: LatLngLiteral; // POIの位置
  area: AreaType; // POIのエリア
  category: string; // POIのカテゴリ
  genre: string; // POIのジャンル
  monday?: string; // 月曜日の営業時間
  tuesday?: string; // 火曜日の営業時間
  wednesday?: string; // 水曜日の営業時間
  thursday?: string; // 木曜日の営業時間
  friday?: string; // 金曜日の営業時間
  saturday?: string; // 土曜日の営業時間
  sunday?: string; // 日曜日の営業時間
  holiday?: string; // 祝日の営業時間
  holidayInfo?: string; // 祝日の情報
  information?: string; // その他の情報
  view?: string; // ビュー情報
  phone?: string; // 電話番号
  address?: string; // 住所
  parking?: string; // 駐車場情報
  payment?: string; // 支払い情報
  [key: string]: string | LatLngLiteral | AreaType | undefined; // その他の任意のプロパティ
}

// サーチバーのプロパティ型
export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void; // 検索ハンドラー
  pois: Poi[]; // POIの配列
}

// マップコンポーネントのプロパティ型
export interface MapComponentProps extends MapProps {
  pois: Poi[];
  selectedPoi: Poi | null;
  setSelectedPoi: (poi: Poi | null) => void;
  areaVisibility: Record<AreaType, boolean>;
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: (location: LatLngLiteral | null) => void;
  showWarning: boolean;
  setShowWarning: (show: boolean) => void;
  onLoad: (map: google.maps.Map | null) => void;
  setIsMapLoaded: (map: google.maps.Map | null) => void;
}

// ロケーション警告のプロパティ型
export interface LocationWarningProps extends BaseProps {
  onClose: () => void; // 閉じるボタンのクリックハンドラー
}

// ハンバーガーメニューのプロパティ型
export interface HamburgerMenuProps extends BaseProps {
  pois: Poi[]; // POIの配列
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // POI選択の状態を設定する関数
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // エリアの可視性を設定する関数
  localAreaVisibility: Record<AreaType, boolean>; // ローカルのエリア可視性
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // ローカルのエリア可視性を設定する関数
  currentLocation: LatLngLiteral | null; // 現在の位置
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>; // 現在の位置を設定する関数
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>; // 警告表示を設定する関数
  search: (query: string) => void; // 検索ハンドラー
  searchResults: Poi[]; // 検索結果のPOI配列
  handleSearchResultClick: (poi: Poi) => void; // 検索結果クリック時のハンドラー
}

// メニューアクションの型
export type MenuActionType = {
  handleAreaClick: () => void; // エリアクリック時のハンドラー
  handleFeedbackClick: () => void; // フィードバッククリック時のハンドラー
  toggleSearchBar: () => void; // サーチバーのトグルハンドラー
};

// メニューアイテムの型
export interface MenuItem {
  label: string; // メニューアイテムのラベル
  title: string; // メニューアイテムのタイトル
  action: keyof MenuActionType; // メニューアクションのキー
}

// フィードバックフォームのプロパティ型
export interface FeedbackFormProps extends BaseProps {
  onClose: () => void; // 閉じるボタンのクリックハンドラー
}

// テンプレートパラメータの型
export interface TemplateParams {
  [key: string]: unknown; // 任意のキーと値
  name: string; // 名前
  email: string; // メールアドレス
  message: string; // メッセージ
}
