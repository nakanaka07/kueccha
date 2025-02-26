/**
 * このファイルは、アプリケーション全体で使用される型定義を提供します。
 * マップコンポーネント、POI（ポイントオブインタレスト）、UI要素、
 * 設定などに関連する型が含まれています。
 * これらの型定義により、TypeScriptの型安全性を活用し、
 * コード全体での一貫性を確保します。
 */

// 必要なライブラリと定数のインポート
import { LoadScriptProps } from '@react-google-maps/api'; // Google Maps APIの読み込みに必要なプロパティ型
import { ReactNode } from 'react'; // Reactコンポーネントの子要素の型
import { AREAS, INFO_WINDOW_BUSINESS_HOURS } from './constants'; // エリア情報と営業時間の定数

/**
 * 共通のプロパティを持つ基本的なプロパティ型。
 * アプリケーション全体のコンポーネントで再利用される基本的なプロパティを定義します。
 */
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AREASオブジェクトのキーを表す型。
 * 定数で定義されたエリアの識別子として使用されます。
 */
export type AreaType = keyof typeof AREAS;

/**
 * 各エリアの表示/非表示状態を管理するレコード型。
 * キーはAreaTypeで、値は表示状態（真偽値）を示します。
 */
export type AreaVisibility = Record<AreaType, boolean>;

/**
 * BUSINESS_HOURSの配列内のオブジェクトのキーを表す型。
 * 営業時間の曜日や特定の時間帯を識別するために使用されます。
 */
export type BusinessHourKey = (typeof INFO_WINDOW_BUSINESS_HOURS)[number]['key'];

/**
 * アプリケーションの全体設定を表す型。
 * マップ、Googleスプレッドシート、マーカーの色などの設定が含まれます。
 */
export interface Config {
  maps: MapConfig; // Google Mapsの設定情報
  sheets: {
    apiKey: string; // Google Sheets APIにアクセスするためのキー
    spreadsheetId: string; // データを取得するスプレッドシートのID
  };
  markers: {
    colors: Record<string, string>; // マーカーカテゴリごとの色コード設定
  };
}

/**
 * エラーバウンダリコンポーネントのプロパティ型。
 * コンポーネントツリー内でエラーをキャッチし、フォールバックUIを表示するために使用されます。
 */
export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode; // エラーバウンダリで保護する子コンポーネント
  fallback?: ReactNode; // エラー発生時に表示する代替UI
}

/**
 * エラーバウンダリコンポーネントの内部状態を表す型。
 * エラー情報を保持し、適切なUIレンダリングを判断するために使用されます。
 */
export interface ErrorBoundaryState {
  hasError: boolean; // エラーが発生したかどうかのフラグ
  error: Error | null; // キャッチされたエラーオブジェクト
  errorInfo: {
    componentStack: string; // エラーが発生したコンポーネントのスタックトレース
  } | null;
}

/**
 * フィードバックフォームのプロパティ型。
 * ユーザーからのフィードバックを収集するフォームコンポーネントの設定に使用されます。
 */
export interface FeedbackFormProps extends BaseProps {
  onClose: () => void; // フォームを閉じるときに呼び出される関数
}

/**
 * フィルターパネルのプロパティ型。
 * マップ上のPOIフィルタリングUIを制御するために使用されます。
 */
export interface FilterPanelProps extends BaseProps {
  pois: Poi[]; // フィルター対象のすべてのPOI（ポイントオブインタレスト）
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // 選択されたPOIを設定する関数
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // グローバルなエリア表示状態を設定する関数
  isFilterPanelOpen: boolean; // フィルターパネルの表示/非表示状態
  onCloseClick: () => void; // パネルを閉じるときに呼び出される関数
  localAreaVisibility: Record<AreaType, boolean>; // パネル内のローカルなエリア表示状態
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // ローカルなエリア表示状態を設定する関数
  currentLocation: LatLngLiteral | null; // ユーザーの現在位置
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>; // 現在位置を設定する関数
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>; // 位置情報の警告表示を制御する関数
}

/**
 * ハンバーガーメニューのプロパティ型。
 * モバイルビューでのナビゲーションメニューを制御します。
 */
export interface HamburgerMenuProps extends BaseProps {
  pois: Poi[]; // メニューで表示/検索対象となるすべてのPOI
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // 選択されたPOIを設定する関数
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // エリア表示状態を設定する関数
  localAreaVisibility: Record<AreaType, boolean>; // メニュー内のローカルなエリア表示状態
  setLocalAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>; // ローカルエリア表示状態を設定する関数
  currentLocation: LatLngLiteral | null; // ユーザーの現在位置
  setCurrentLocation: React.Dispatch<React.SetStateAction<LatLngLiteral | null>>; // 現在位置を更新する関数
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>; // 位置情報の警告表示を制御する関数
  search: (query: string) => void; // 検索クエリを処理する関数
  searchResults: Poi[]; // 現在の検索結果
  handleSearchResultClick: (poi: Poi) => void; // 検索結果をクリックしたときの処理関数
}

/**
 * 情報ウィンドウのプロパティ型。
 * マップ上のPOIをクリックした際に表示される詳細情報ウィンドウを制御します。
 */
export interface InfoWindowProps extends BaseProps {
  poi: Poi; // 表示する詳細情報のPOIオブジェクト
  onCloseClick: () => void; // 情報ウィンドウを閉じるときに呼び出される関数
}

/**
 * 緯度経度を表す型。
 * Google Mapsで位置を表現するために使用されます。
 */
export interface LatLngLiteral {
  lat: number;
  lng: number;
}

/**
 * 位置情報の警告コンポーネントのプロパティ型。
 * 位置情報の使用に関する警告を表示する際に使用されます。
 */
export interface LocationWarningProps extends BaseProps {
  onClose: () => void; // 警告を閉じるときに呼び出される関数
}

/**
 * ローディング中のフォールバックコンポーネントのプロパティ型。
 * データ読み込み中やAPI呼び出し中の表示を制御します。
 */
export interface LoadingFallbackProps extends BaseProps {
  isLoading: boolean; // 現在ローディング中かどうかを示すフラグ
  message?: string; // ローディング中に表示するオプションのメッセージ
  spinnerClassName?: string; // ローディングスピナーに適用する追加のクラス名
  isLoaded: boolean; // ロードが完了したかどうかを示すフラグ
  fadeDuration?: number; // フェードアウトの時間（ミリ秒）
}

/**
 * ロケーション型（LatLngLiteralの別名）。
 * 地図上の場所を表現するために使用されます。
 */
export type Location = LatLngLiteral;

/**
 * マップの設定情報を表す型。
 * Google Maps APIの設定と表示オプションを定義します。
 */
export interface MapConfig {
  apiKey: string;
  mapId: string;
  defaultCenter: LatLngLiteral;
  defaultZoom: number;
  libraries: LoadScriptProps['libraries'];
  language: string;
  version: string;
  style: MapStyle;
  // google.maps.MapOptions から独自の型定義に変更
  options: {
    mapId?: string;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    clickableIcons?: boolean;
    gestureHandling?: string;
    mapTypeControlOptions?: {
      style?: number;
      position?: number;
      mapTypeIds?: string[];
    };
    // anyからunknownに変更し、型安全性を向上
    [key: string]: unknown;
  };
}

/**
 * マップコンポーネントのプロパティ型。
 * 基本的なマップ表示に必要なプロパティを定義します。
 */
export interface MapProps extends BaseProps {
  pois: Poi[]; // マップ上に表示するPOIの配列
}

/**
 * メインマップコンポーネントのプロパティ型。
 * 基本的なマップ表示に必要な最小限のプロパティを定義。
 */
export interface MapComponentProps {
  /**
   * マップがロードされたときに呼び出されるコールバック関数
   */
  onLoad: (map: google.maps.Map | null) => void;

  /**
   * マップのロード状態を親コンポーネントに通知するための関数
   */
  setIsMapLoaded: (map: google.maps.Map | null) => void;
}

/**
 * マップエラーコンポーネントのプロパティ型。
 * マップ読み込みや表示中のエラーを処理するために使用されます。
 */
export type MapErrorProps = {
  message: string;
  onRetry: () => void;
};

/**
 * マップコントロールコンポーネントのプロパティ型。
 * マップ上に表示されるコントロールボタンの機能を定義します。
 */
export type MapControlsProps = {
  onResetNorth: () => void; // マップを北向きにリセットする関数
  onGetCurrentLocation: () => void; // ユーザーの現在位置を取得する関数
  onToggleRecommendations: () => void; // おすすめエリアの表示/非表示を切り替える関数
};

/**
 * マップのスタイルを表す型。
 */
export interface MapStyle {
  width: string;
  height: string;
}

/**
 * マーカーコンポーネントのプロパティ型。
 * マップ上のPOI位置を表示するマーカーを制御します。
 */
export interface MarkerProps extends BaseProps {
  poi: Poi; // マーカーで表示するPOI
  onClick: (poi: Poi) => void; // マーカークリック時に呼び出される関数
  map: google.maps.Map | null; // マーカーが配置されるマップインスタンス
}

/**
 * メニューアクション型。
 * メニュー内の各アクションを定義します。
 */
export type MenuActionType = {
  handleAreaClick: () => void; // エリア選択メニューを表示する関数
  handleFeedbackClick: () => void; // フィードバックフォームを表示する関数
  toggleSearchBar: () => void; // 検索バーの表示/非表示を切り替える関数
};

/**
 * メニューアイテムの型。
 * メニュー内の各項目の構造を定義します。
 */
export interface MenuItem {
  label: string; // メニュー項目の表示ラベル
  title: string; // メニュー項目のアクセシビリティ用タイトル
  action: keyof MenuActionType; // 実行するアクションのキー
}

/**
 * POI（ポイントオブインタレスト）を表す型。
 * マップ上に表示される各地点の情報を定義します。
 */
export interface Poi {
  id: string; // POIの一意識別子
  name: string; // POIの名称
  location: LatLngLiteral; // POIの位置（緯度・経度）
  area: AreaType; // POIが属するエリア
  genre: string; // POIのジャンル（例：レストラン、カフェ）
  category: string; // POIのカテゴリ（より詳細な分類）
  parking?: string; // 駐車場の有無や情報
  payment?: string; // 利用可能な決済方法
  monday?: string; // 月曜日の営業時間
  tuesday?: string; // 火曜日の営業時間
  wednesday?: string; // 水曜日の営業時間
  thursday?: string; // 木曜日の営業時間
  friday?: string; // 金曜日の営業時間
  saturday?: string; // 土曜日の営業時間
  sunday?: string; // 日曜日の営業時間
  holiday?: string; // 祝日の営業時間
  holidayInfo?: string; // 定休日や特別営業日の情報
  information?: string; // その他の追加情報
  view?: string; // Google Mapsでの外観表示用URL
  phone?: string; // 連絡先電話番号
  address?: string; // 物理的な住所
  [key: string]: string | LatLngLiteral | AreaType | undefined; // その他の動的プロパティ
}

/**
 * 検索バーコンポーネントのプロパティ型。
 * POI検索機能を提供するUIコンポーネントを制御します。
 */
export interface SearchBarProps extends BaseProps {
  onSearch: (query: string) => void; // 検索クエリが送信されたときに呼び出される関数
  pois: Poi[]; // 検索対象となるPOIの配列
}

/**
 * 検索結果コンポーネントのプロパティ型。
 * 検索結果のPOIリストを表示し、クリックイベントを処理するコンポーネント用。
 */
export interface SearchResultsProps extends BaseProps {
  // 表示する検索結果のPOIデータ配列
  results: Poi[];

  // 検索結果の項目がクリックされたときに呼び出されるコールバック関数
  onResultClick: (poi: Poi) => void;
}

/**
 * メール送信用テンプレートパラメータの型。
 * フィードバックフォームなどからのメール送信に使用されます。
 */
export interface TemplateParams {
  [key: string]: unknown; // 追加の動的パラメータ
  name: string; // 送信者の名前
  email: string; // 送信者のメールアドレス
  message: string; // 送信するメッセージ内容
}
