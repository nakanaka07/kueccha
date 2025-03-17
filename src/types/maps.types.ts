/**
 * マップ関連の型定義ファイル
 * 
 * Google Maps APIに関連するコンポーネントや設定の型を定義します。
 * ここには設定、プロパティ、イベントハンドラなどの型が含まれています。
 */

/// <reference types="@types/google.maps" />
import { LoadScriptProps, MapOptions } from '@react-google-maps/api';
import { BaseProps } from './base.types';
import { Poi } from './poi.types';
import { 
  LatLngLiteral, 
  ControlPosition, 
  ControlPositionString,
  MapTypeControlStyle,
  MapStyleOptions, 
  MapTypeId 
} from './geo.types';

// ============================================================================
// マップ表示モード関連の型定義
// ============================================================================

/**
 * マップ表示モードの種類
 * アプリケーションで使用可能なマップ表示モード
 */
export enum MapDisplayMode {
  STANDARD = 'standard',
  SATELLITE = 'satellite',
  ACCESSIBLE = 'accessible', // 高コントラスト、シンプル表示など
  NIGHT = 'night'           // 夜間モード
}

/**
 * マップ表示モード設定の型
 */
export interface MapDisplayModeOptions {
  /** マップタイプID */
  mapTypeId: MapTypeId;
  
  /** マップスタイル配列 */
  styles: google.maps.MapTypeStyle[];
}

/**
 * マップ表示モードマッピングの型
 */
export type MapDisplayModes = Record<MapDisplayMode, MapDisplayModeOptions>;

// ============================================================================
// マップ設定関連の型定義
// ============================================================================

/**
 * 標準のMapOptions型を拡張してカスタムコントロールをサポート
 */
export interface ExtendedMapOptions extends MapOptions {
  /** カメラコントロールの表示/非表示 */
  cameraControl?: boolean;
  
  /** カメラコントロールの設定オプション */
  cameraControlOptions?: {
    position: ControlPosition | ControlPositionString;
  };
}

/**
 * マップのスタイルを表す型。
 * マップコンテナのサイズや表示方法を定義します。
 */
export interface MapStyle {
  /** マップの幅 (CSSの値: '100%', '500px'など) */
  width: string;
  
  /** マップの高さ (CSSの値: '100%', '500px'など) */
  height: string;
}

/**
 * マップの設定情報を表す型。
 * Google Maps APIの設定と表示オプションを定義します。
 */
export interface MapConfig {
  /** Google Maps API キー */
  apiKey: string;
  
  /** Google Maps Map ID (クラウドベースのマップスタイルに必要) */
  mapId: string;
  
  /** マップの初期中心座標 */
  defaultCenter: LatLngLiteral;
  
  /** マップの初期ズームレベル (1-20) */
  defaultZoom: number;
  
  /** 使用するGoogle Maps APIのライブラリ */
  libraries: LoadScriptProps['libraries'];
  
  /** マップの表示言語 */
  language: string;
  
  /** Google Maps API バージョン (例: 'weekly', 'quarterly', 'beta') */
  version: string;
  
  /** マップのコンテナスタイル設定 */
  style: MapStyle;
  
  /** Google Maps の詳細なオプション設定 */
  options: ExtendedMapOptions;
  
  /** モバイルデバイス用の追加マップオプション */
  mobileOptions?: Partial<ExtendedMapOptions>;
  
  /** マーカーの周囲の余白（ピクセル） */
  boundsPadding?: number;
  
  /** マーカーのクラスタリングしきい値 */
  clusteringThreshold?: number;
  
  /** 情報ウィンドウのデフォルト最大幅 */
  defaultInfoWindowMaxWidth?: number;
}

// ============================================================================
// エラーと結果の型定義
// ============================================================================

/**
 * マップ読み込みエラー情報を表す型
 * エラーの種類や詳細を定義します
 */
export interface MapLoadError {
  /** エラーコード */
  code: 'API_KEY_INVALID' | 'NETWORK_ERROR' | 'SCRIPT_LOAD_ERROR' | 'UNKNOWN';
  
  /** エラーメッセージ */
  message: string;
  
  /** 追加の詳細情報（オプション） */
  details?: unknown;
}

/**
 * マップ読み込み結果を表す型
 * 成功時はマップオブジェクト、失敗時はエラー情報を含みます
 */
export type MapLoadResult = 
  | { success: true; map: google.maps.Map }
  | { success: false; error: MapLoadError };

// ============================================================================
// マップイベント関連の型定義
// ============================================================================

/**
 * マップイベントハンドラを表す型
 * マップ上で発生する各種イベントの処理関数を定義します
 */
export interface MapEventHandlers {
  /** マップクリック時の処理 */
  onClick?: (event: google.maps.MapMouseEvent) => void;
  
  /** マップドラッグ終了時の処理 */
  onDragEnd?: () => void;
  
  /** ズーム変更時の処理 */
  onZoomChanged?: (newZoom: number) => void;
  
  /** 表示範囲変更時の処理 */
  onBoundsChanged?: (newBounds: google.maps.LatLngBounds) => void;
  
  /** アイドル状態（操作完了後）になった時の処理 */
  onIdle?: () => void;
}

// ============================================================================
// マップコンポーネント関連の型定義
// ============================================================================

/**
 * マップコンポーネントのプロパティ型。
 * 基本的なマップ表示に必要なプロパティを定義します。
 */
export interface MapProps extends BaseProps {
  /** マップ上に表示するPOI(Point of Interest)の配列 */
  pois: Poi[];
  
  /** マップイベントハンドラ */
  eventHandlers?: MapEventHandlers;
}

/**
 * メインマップコンポーネントのプロパティ型。
 * 基本的なマップ表示に必要な最小限のプロパティを定義します。
 */
export interface MapComponentProps {
  /**
   * マップがロードされたときに呼び出されるコールバック関数
   * @param result マップロード結果（成功時はマップオブジェクト、失敗時はエラー情報）
   */
  onMapLoad: (result: MapLoadResult) => void;
  
  /** マップイベントハンドラ */
  eventHandlers?: MapEventHandlers;
}

// ============================================================================
// マップUI関連の型定義
// ============================================================================

/**
 * マップエラーコンポーネントのプロパティ型。
 * マップ読み込みや表示中のエラーを処理するために使用されます。
 */
export interface MapErrorProps {
  /** エラー情報 */
  error: MapLoadError;
  
  /**
   * マップの再読み込みを試みる関数
   */
  onRetry: () => void;
}

/**
 * マップコントロールコンポーネントのプロパティ型。
 * マップ上に表示されるコントロールボタンの機能を定義します。
 */
export interface MapControlsProps {
  /** マップインスタンス */
  map: google.maps.Map;
  
  /**
   * マップを北向きにリセットする関数
   */
  onResetNorth: () => void;
  
  /**
   * ユーザーの現在位置を取得してマップを中心に表示する関数
   */
  onGetCurrentLocation: () => void;
  
  /**
   * おすすめエリアの表示/非表示を切り替える関数
   */
  onToggleRecommendations: () => void;
}