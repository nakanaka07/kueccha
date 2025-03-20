/**
 * マーカー関連の型定義ファイル
 */

/// <reference types="@types/google.maps" />
import type { AreaType } from './areas.types';
import type { BaseProps } from './base.types';
import type { Poi } from './poi.types';

/**
 * マーカーイベントハンドラ
 */
export interface MarkerEvents {
  onClick: (poi: Poi) => void; // クリック時の処理
  onMouseOver?: (poi: Poi) => void; // マウスオーバー時の処理
  onMouseOut?: (poi: Poi) => void; // マウスアウト時の処理
  onDragEnd?: (poi: Poi, position: google.maps.LatLng) => void; // ドラッグ終了時の処理
}

/**
 * マーカーコンポーネントのプロパティ型
 */
export interface MarkerProps extends BaseProps {
  poi: Poi; // マーカーで表示するPOI（地点情報）
  events: MarkerEvents; // マーカーイベントハンドラ
  map: google.maps.Map; // マーカーが配置されるマップインスタンス
  style?: MarkerStyleOptions; // マーカースタイル
}

/**
 * マーカーグループのプロパティ型
 */
export interface MarkerGroupProps extends BaseProps {
  pois: Poi[]; // 表示するPOIの配列
  events: MarkerEvents; // マーカーイベントハンドラ
  map: google.maps.Map; // マーカーが配置されるマップインスタンス
  styleGenerator: MarkerStyleGenerator; // スタイル生成関数
  filter?: (poi: Poi) => boolean; // POIのフィルタリング関数
  clusterOptions?: MarkerClusterOptions; // クラスタリングオプション
}

/**
 * マーカーのサイズ定義
 */
export interface MarkerSize {
  width: number; // 幅（ピクセル）
  height: number; // 高さ（ピクセル）
}

/**
 * マーカーのアニメーション型
 */
export type MarkerAnimation = google.maps.Animation | null;

/**
 * 基本マーカースタイル
 */
export interface BaseMarkerStyle {
  size: MarkerSize; // マーカーのサイズ
  color: string; // マーカーの色
  zIndex?: number; // マーカーの優先順位
  animation?: MarkerAnimation; // マーカーのアニメーション
}

/**
 * マーカーのスタイルオプション
 */
export interface MarkerStyleOptions extends BaseMarkerStyle {
  iconUrl: string; // マーカーのアイコンURL
  opacity?: number; // マーカーの不透明度
  label?: string | google.maps.MarkerLabel; // マーカーのラベル
  isSelected?: boolean; // マーカーが選択状態かどうか
}

/**
 * 設定で使用するマーカー属性
 */
export interface MarkerConfigAttributes extends BaseMarkerStyle {
  icon: string; // マーカーのアイコン画像パス
  accessibilityLabel: string; // スクリーンリーダー用の説明文
  mobileSize?: MarkerSize; // モバイルデバイス用のサイズ調整
  highlightColor?: string; // マーカー選択時のハイライト色
}

/**
 * マーカーオプションを生成する関数の型
 */
export type MarkerStyleGenerator = (
  areaOrPoi: AreaType | Poi,
  isSelected?: boolean,
) => MarkerStyleOptions;

/**
 * 設定用マーカー属性からスタイルオプションへの変換関数
 */
export function configToStyleOptions(
  config: MarkerConfigAttributes,
  isSelected: boolean = false,
): MarkerStyleOptions {
  return {
    iconUrl: config.icon,
    size: config.size,
    color: isSelected && config.highlightColor ? config.highlightColor : config.color,
    zIndex: config.zIndex,
    animation: config.animation,
    isSelected,
    label: config.accessibilityLabel,
  };
}

/**
 * クラスタアイコンのスタイル定義
 */
export interface ClusterIconStyle {
  url: string; // クラスタアイコンの画像URL
  height: number; // アイコンの高さ
  width: number; // アイコンの幅
  textColor?: string; // クラスタ内のマーカー数を表示するテキストの色
  textSize?: number; // テキストサイズ
  anchor?: [number, number]; // 背景画像のアンカー位置
}

/**
 * マーカークラスタリングのオプション
 */
export interface MarkerClusterOptions {
  enabled: boolean; // クラスタリングを有効にするかどうか
  minimumClusterSize?: number; // クラスタ化する最小マーカー数
  styles?: ClusterIconStyle[]; // クラスタアイコンのスタイル配列
  maxZoom?: number; // クラスタの最大ズームレベル
  gridSize?: number; // クラスタの平均中心を計算するかグリッド上に配置するか
  zoomOnClick?: boolean; // クラスタがクリックされたときのズーム動作
}