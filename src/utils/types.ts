import { LoadScriptProps } from '@react-google-maps/api'; // Google Maps APIのロードスクリプトプロパティをインポート
import { AREAS, BUSINESS_HOURS } from './constants'; // 定数をインポート

// 緯度経度を表す型
export type LatLngLiteral = {
  lat: number; // 緯度
  lng: number; // 経度
};

// 位置情報を表す型
export type Location = LatLngLiteral; // 緯度経度型を位置情報型としてエイリアス

// 地図のスタイルを表すインターフェース
export interface MapStyle {
  width: string; // 幅
  height: string; // 高さ
  disableDefaultUI: boolean; // デフォルトUIを無効にするかどうか
  clickableIcons: boolean; // アイコンをクリック可能にするかどうか
}

// 地図の設定を表すインターフェース
export interface MapConfig {
  apiKey: string; // APIキー
  mapId: string; // マップID
  defaultCenter: Location; // デフォルトの中心位置
  defaultZoom: number; // デフォルトのズームレベル
  libraries: LoadScriptProps['libraries']; // 使用するライブラリ
  language: string; // 言語
  version: string; // バージョン
  style: MapStyle; // 地図のスタイル
  options: {
    zoomControl: boolean; // ズームコントロールを表示するかどうか
    mapTypeControl: boolean; // マップタイプコントロールを表示するかどうか
    streetViewControl: boolean; // ストリートビューコントロールを表示するかどうか
    fullscreenControl: boolean; // フルスクリーンコントロールを表示するかどうか
    styles?: google.maps.MapTypeStyle[]; // 地図のカスタムスタイル（オプショナル）
  };
}

// 全体の設定を表すインターフェース
export interface Config {
  maps: MapConfig; // 地図の設定
  sheets: {
    apiKey: string; // APIキー
    spreadsheetId: string; // スプレッドシートID
  };
  markers: {
    colors: Record<string, string>; // マーカーの色
  };
}

// エリアの種類を表す型
export type AreaType = keyof typeof AREAS; // AREAS定数のキーを型として使用

// 営業時間のキーを表す型
export type BusinessHourKey = (typeof BUSINESS_HOURS)[number]['key']; // BUSINESS_HOURS定数のキーを型として使用

// POI（ポイント・オブ・インタレスト）を表すインターフェース
export interface Poi {
  id: string; // ID
  name: string; // 名前
  location: Location; // 位置情報
  area: AreaType; // エリアの種類
  category: string; // カテゴリ
  description?: string; // 説明（オプショナル）
  businessHours?: string[]; // 営業時間（オプショナル）
  genre?: string; // ジャンル（オプショナル）
  phone?: string; // 電話番号（オプショナル）
  address?: string; // 住所（オプショナル）
  information?: string; // 情報（オプショナル）
  view?: string; // ビュー（オプショナル）
  reservation?: string; // 予約（オプショナル）
  payment?: string; // 支払い方法（オプショナル）
  monday?: string; // 月曜日の営業時間（オプショナル）
  tuesday?: string; // 火曜日の営業時間（オプショナル）
  wednesday?: string; // 水曜日の営業時間（オプショナル）
  thursday?: string; // 木曜日の営業時間（オプショナル）
  friday?: string; // 金曜日の営業時間（オプショナル）
  saturday?: string; // 土曜日の営業時間（オプショナル）
  sunday?: string; // 日曜日の営業時間（オプショナル）
  holiday?: string; // 祝日の営業時間（オプショナル）
}

// APIレスポンスアイテムを表すインターフェース
export interface ApiResponseItem {
  id: string; // ID
  name: string; // 名前
  lat: number; // 緯度
  lng: number; // 経度
  area: string; // エリア
  category: string; // カテゴリ
  description?: string; // 説明（オプショナル）
  businessHours?: string[]; // 営業時間（オプショナル）
  genre?: string; // ジャンル（オプショナル）
  phone?: string; // 電話番号（オプショナル）
  address?: string; // 住所（オプショナル）
  information?: string; // 情報（オプショナル）
  view?: string; // ビュー（オプショナル）
  reservation?: string; // 予約（オプショナル）
}

// 基本的なプロパティを表すインターフェース
export interface BaseProps {
  className?: string; // クラス名（オプショナル）
  style?: React.CSSProperties; // スタイル（オプショナル）
}

// 地図のプロパティを表すインターフェース
export interface MapProps extends BaseProps {
  pois: Poi[]; // POIの配列
}

// インフォウィンドウのプロパティを表すインターフェース
export interface InfoWindowProps extends BaseProps {
  poi: Poi; // POI
  onCloseClick: () => void; // 閉じるクリック時のハンドラ
}

// マーカーのプロパティを表すインターフェース
export interface MarkerProps extends BaseProps {
  poi: Poi; // POI
  onClick: (poi: Poi) => void; // クリック時のハンドラ
  map: google.maps.Map | null; // 地図オブジェクト
}

// フィルターパネルのプロパティを表すインターフェース
export interface FilterPanelProps extends BaseProps {
  pois: Poi[]; // POIの配列
  setSelectedPoi: (poi: Poi | null) => void; // 選択されたPOIを設定する関数
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void; // エリアの表示状態を設定する関数
  isFilterPanelOpen: boolean; // フィルターパネルが開いているかどうか
  onCloseClick: () => void; // 閉じるクリック時のハンドラ
  localAreaVisibility: Record<AreaType, boolean>; // ローカルエリアの表示状態
  setLocalAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >; // ローカルエリアの表示状態を設定する関数
  currentLocation: LatLngLiteral | null; // 現在の位置
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >; // 現在の位置を設定する関数
}

// ローディングフォールバックのプロパティを表すインターフェース
export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean; // ロード中かどうか
  message?: string; // メッセージ（オプショナル）
  spinnerClassName?: string; // スピナークラス名（オプショナル）
  isLoaded: boolean; // ロードが完了したかどうか
}

// エラーバウンダリのプロパティを表すインターフェース
export interface ErrorBoundaryProps extends BaseProps {
  children: React.ReactNode; // 子要素
  fallback?: React.ReactNode; // フォールバック要素（オプショナル）
}
