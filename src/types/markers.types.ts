/**
 * マーカー関連の型定義ファイル
 * 
 * マップ上に表示されるマーカーのプロパティやオプションを定義します。
 * このファイルにはマーカーの表示、イベント処理、スタイリングに関する型が含まれています。
 */

/// <reference types="@types/google.maps" />
import { BaseProps } from './base.types';
import { Poi } from './poi.types';
import { AreaType } from './areas.types';

// ============================================================================
// マーカーコンポーネントとイベント
// ============================================================================

/**
 * マーカーイベントハンドラ
 * マーカーの各種イベントを処理するコールバック関数群
 */
export interface MarkerEvents {
  /** クリック時の処理 */
  onClick: (poi: Poi) => void;
  
  /** マウスオーバー時の処理（オプション） */
  onMouseOver?: (poi: Poi) => void;
  
  /** マウスアウト時の処理（オプション） */
  onMouseOut?: (poi: Poi) => void;
  
  /** ドラッグ終了時の処理（オプション） */
  onDragEnd?: (poi: Poi, position: google.maps.LatLng) => void;
}

/**
 * マーカーコンポーネントのプロパティ型
 * マップ上のPOI位置を表示するマーカーを制御します
 */
export interface MarkerProps extends BaseProps {
  /** 
   * マーカーで表示するPOI（地点情報）
   * マーカーの位置や追加情報として使用されます
   */
  poi: Poi;
  
  /** 
   * マーカーイベントハンドラ
   * 少なくとも onClick ハンドラは必須です
   */
  events: MarkerEvents;
  
  /** 
   * マーカーが配置されるマップインスタンス
   * マーカーが表示されるにはnull以外の値が必要です
   */
  map: google.maps.Map;
  
  /**
   * マーカースタイル
   * 指定しない場合はデフォルトスタイルが適用されます
   */
  style?: MarkerStyleOptions;
}

/**
 * マーカーグループのプロパティ型
 * 複数の関連するマーカーをまとめて管理します
 */
export interface MarkerGroupProps extends BaseProps {
  /** 表示するPOIの配列 */
  pois: Poi[];
  
  /** マーカーイベントハンドラ */
  events: MarkerEvents;
  
  /** マーカーが配置されるマップインスタンス */
  map: google.maps.Map;
  
  /** スタイル生成関数 */
  styleGenerator: MarkerStyleGenerator;
  
  /** POIのフィルタリング関数（オプション） */
  filter?: (poi: Poi) => boolean;
  
  /** クラスタリングオプション（オプション） */
  clusterOptions?: MarkerClusterOptions;
}

// ============================================================================
// マーカースタイリング
// ============================================================================

/**
 * マーカーのサイズ定義
 * ピクセル単位の幅と高さを指定します
 */
export interface MarkerSize {
  /** 幅（ピクセル） */
  width: number;
  
  /** 高さ（ピクセル） */
  height: number;
}

/**
 * マーカーのアニメーション型
 * Google Mapsのアニメーション型と互換性を持たせるための型
 */
export type MarkerAnimation = google.maps.Animation | null;

/**
 * 基本マーカースタイル
 * マーカースタイルとマーカー設定の共通基盤となる型
 */
export interface BaseMarkerStyle {
  /** マーカーのサイズ */
  size: MarkerSize;
  
  /** マーカーの色（16進数カラーコードなど） */
  color: string;
  
  /** マーカーの優先順位（高いほど前面に表示） */
  zIndex?: number;
  
  /** マーカーのアニメーション */
  animation?: MarkerAnimation;
}

/**
 * マーカーのスタイルオプション
 * マーカーの見た目をカスタマイズするための設定
 */
export interface MarkerStyleOptions extends BaseMarkerStyle {
  /** マーカーのアイコンURL */
  iconUrl: string;
  
  /** マーカーの不透明度（0.0〜1.0） */
  opacity?: number;
  
  /** マーカーのラベル */
  label?: string | google.maps.MarkerLabel;
  
  /** マーカーが選択状態かどうか */
  isSelected?: boolean;
}

/**
 * 設定で使用するマーカー属性
 * constants.tsで使用する設定用インターフェース
 */
export interface MarkerConfigAttributes extends BaseMarkerStyle {
  /** マーカーのアイコン画像パス */
  icon: string;
  
  /** スクリーンリーダー用の説明文 */
  accessibilityLabel: string;
  
  /** モバイルデバイス用のサイズ調整 */
  mobileSize?: MarkerSize;
  
  /** マーカー選択時のハイライト色 */
  highlightColor?: string;
}

/**
 * マーカーオプションを生成する関数の型
 * エリアタイプやPOIオブジェクトに基づいてマーカースタイルを決定します
 */
export type MarkerStyleGenerator = (
  areaOrPoi: AreaType | Poi, 
  isSelected?: boolean
) => MarkerStyleOptions;

/**
 * 設定用マーカー属性からスタイルオプションへの変換関数
 * 
 * @param config マーカー設定属性
 * @param isSelected 選択状態かどうか
 * @returns Google Maps APIのマーカースタイルオプション
 */
export function configToStyleOptions(
  config: MarkerConfigAttributes, 
  isSelected: boolean = false
): MarkerStyleOptions {
  return {
    iconUrl: config.icon,
    size: config.size,
    color: isSelected && config.highlightColor ? config.highlightColor : config.color,
    zIndex: config.zIndex,
    animation: config.animation,
    isSelected,
    label: config.accessibilityLabel
  };
}

// ============================================================================
// クラスタリング
// ============================================================================

/**
 * クラスタアイコンのスタイル定義
 */
export interface ClusterIconStyle {
  /** クラスタアイコンの画像URL */
  url: string;
  
  /** アイコンの高さ（ピクセル） */
  height: number;
  
  /** アイコンの幅（ピクセル） */
  width: number;
  
  /** クラスタ内のマーカー数を表示するテキストの色 */
  textColor?: string;
  
  /** テキストサイズ（ピクセル） */
  textSize?: number;
  
  /** 背景画像のアンカー位置（x, y座標） */
  anchor?: [number, number];
}

/**
 * マーカークラスタリングのオプション
 */
export interface MarkerClusterOptions {
  /** クラスタリングを有効にするかどうか */
  enabled: boolean;
  
  /** クラスタ化する最小マーカー数 */
  minimumClusterSize?: number;
  
  /** クラスタアイコンのスタイル配列（ズームレベルに応じた複数のスタイル） */
  styles?: ClusterIconStyle[];
  
  /** クラスタの最大ズームレベル（これ以上ズームするとクラスタが解除される） */
  maxZoom?: number;
  
  /** クラスタの平均中心を計算するかグリッド上に配置するか */
  gridSize?: number;
  
  /** クラスタがクリックされたときのズーム動作 */
  zoomOnClick?: boolean;
}