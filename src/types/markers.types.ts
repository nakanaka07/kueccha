/**
 * マーカー関連の型定義ファイル
 *
 * Google Maps上のマーカー表示に関する型定義を提供します。
 * マーカーのスタイル、イベント、クラスタリング関連の処理は
 * utils/markers.utils.ts に実装されています。
 *
 * @see ../utils/markers.utils.ts - マーカー操作ユーティリティ関数
 */

/// <reference types="@types/google.maps" />
import type { AreaType } from './areas.types';
import type { BaseProps } from './base.types';
import type { Poi } from './poi.types';

// ============================================================================
// マーカーイベント関連
// ============================================================================

/**
 * マーカーイベントハンドラ
 * マーカーに関連するユーザー操作イベントの処理関数を定義
 */
export interface MarkerEvents {
  onClick: (poi: Poi) => void; // クリック時の処理
  onMouseOver?: (poi: Poi) => void; // マウスオーバー時の処理
  onMouseOut?: (poi: Poi) => void; // マウスアウト時の処理
  onDragEnd?: (poi: Poi, position: google.maps.LatLng) => void; // ドラッグ終了時の処理
}

// ============================================================================
// マーカーコンポーネント関連
// ============================================================================

/**
 * マーカーコンポーネントのプロパティ型
 * 個別のマーカーを表示するコンポーネントに渡すプロパティ
 */
export interface MarkerProps extends BaseProps {
  poi: Poi; // マーカーで表示するPOI（地点情報）
  events: MarkerEvents; // マーカーイベントハンドラ
  map: google.maps.Map; // マーカーが配置されるマップインスタンス
  style?: MarkerStyleOptions; // マーカースタイル
}

/**
 * マーカーグループのプロパティ型
 * 複数のマーカーをまとめて管理するコンポーネントに渡すプロパティ
 */
export interface MarkerGroupProps extends BaseProps {
  pois: Poi[]; // 表示するPOIの配列
  events: MarkerEvents; // マーカーイベントハンドラ
  map: google.maps.Map; // マーカーが配置されるマップインスタンス
  styleGenerator: MarkerStyleGenerator; // スタイル生成関数
  filter?: (poi: Poi) => boolean; // POIのフィルタリング関数
  clusterOptions?: MarkerClusterOptions; // クラスタリングオプション
}

// ============================================================================
// マーカースタイル関連
// ============================================================================

/**
 * マーカーのサイズ定義
 * マーカーアイコンの表示サイズを指定
 */
export interface MarkerSize {
  width: number; // 幅（ピクセル）
  height: number; // 高さ（ピクセル）
}

/**
 * マーカーのアニメーション型
 * Google Maps標準のアニメーションタイプまたはnull
 */
export type MarkerAnimation = google.maps.Animation | null;

/**
 * 基本マーカースタイル
 * マーカーの視覚的表現に必要な基本属性を定義
 */
export interface BaseMarkerStyle {
  size: MarkerSize; // マーカーのサイズ
  color: string; // マーカーの色（CSSカラー値）
  zIndex?: number; // マーカーの重なり順序（大きいほど前面）
  animation?: MarkerAnimation; // マーカーのアニメーション
}

/**
 * マーカーのスタイルオプション
 * 実際のマーカー表示に使用される詳細なスタイル設定
 */
export interface MarkerStyleOptions extends BaseMarkerStyle {
  iconUrl: string; // マーカーのアイコンURL
  opacity?: number; // マーカーの不透明度（0.0〜1.0）
  label?: string | google.maps.MarkerLabel; // マーカーのラベル
  isSelected?: boolean; // マーカーが選択状態かどうか
}

/**
 * 設定で使用するマーカー属性
 * 設定ファイルから読み込まれる拡張マーカー設定
 */
export interface MarkerConfigAttributes extends BaseMarkerStyle {
  icon: string; // マーカーのアイコン画像パス
  accessibilityLabel: string; // スクリーンリーダー用の説明文
  mobileSize?: MarkerSize; // モバイルデバイス用のサイズ調整
  highlightColor?: string; // マーカー選択時のハイライト色
}

/**
 * マーカーオプションを生成する関数の型
 * エリアまたはPOIからマーカースタイルを動的に生成
 */
export type MarkerStyleGenerator = (
  areaOrPoi: AreaType | Poi,
  isSelected?: boolean,
) => MarkerStyleOptions;

// ============================================================================
// マーカークラスタリング関連
// ============================================================================

/**
 * クラスタアイコンのスタイル定義
 * 複数のマーカーをグループ化した際のクラスタアイコンのスタイル
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
 * 多数のマーカーを効率的に表示するためのクラスタリング設定
 */
export interface MarkerClusterOptions {
  enabled: boolean; // クラスタリングを有効にするかどうか
  minimumClusterSize?: number; // クラスタ化する最小マーカー数
  styles?: ClusterIconStyle[]; // クラスタアイコンのスタイル配列
  maxZoom?: number; // クラスタの最大ズームレベル
  gridSize?: number; // クラスタの平均中心を計算するグリッドサイズ
  zoomOnClick?: boolean; // クラスタがクリックされたときのズーム動作
}
