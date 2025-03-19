/**
 * マーカー関連定数ファイル
 *
 * マップ上に表示されるマーカーのアイコン、色、設定を定義します。
 */

import { isGoogleMapsAvailable, getMarkerAnimation } from './config.constants';

// マーカーとして使用する各種アイコン画像をインポート
import publicToiletIcon from '../images/ano_icon01.png';
import recommendIcon from '../images/ano_icon_recommend.png';
import ryotsuAikawaIcon from '../images/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from '../images/icon_map02.png';
import akadomariHamochiOgiIcon from '../images/icon_map03.png';
import defaultIcon from '../images/row2.png';
import parkingIcon from '../images/shi_icon01.png';
import snackIcon from '../images/shi_icon02.png';
import currentLocationIcon from '../images/shi_icon04.png';
import { AreaType } from '../types/areas.types';
import {
  MarkerSize,
  MarkerConfigAttributes,
  MarkerStyleOptions,
  configToStyleOptions,
  MarkerAnimation,
} from '../types/markers.types';

// ============================================================================
// 画像モジュール型定義
// ============================================================================

/**
 * 画像モジュールの型定義
 * TypeScriptがインポートした画像の型を認識するための定義
 */
declare module '*.png' {
  const content: string;
  export default content;
}

// ============================================================================
// マーカー基本設定
// ============================================================================

/**
 * 基本マーカーサイズの定義
 * 共通で使用する標準サイズを定義して重複を削減
 */
const DEFAULT_MARKER_SIZE: MarkerSize = { width: 32, height: 32 };
const MEDIUM_MARKER_SIZE: MarkerSize = { width: 36, height: 36 };
const LARGE_MARKER_SIZE: MarkerSize = { width: 40, height: 40 };

// ============================================================================
// エリア別マーカー設定
// ============================================================================

/**
 * エリアタイプごとのマーカー設定を取得する
 * Google Maps APIの状態に依存しない安全な初期化を行う
 */
function createMarkersConfig(): Record<AreaType | 'DEFAULT', MarkerConfigAttributes> {
  return {
    DEFAULT: {
      color: '#000000',
      icon: defaultIcon,
      size: DEFAULT_MARKER_SIZE,
      zIndex: 1,
      accessibilityLabel: 'デフォルトマーカー',
      animation: null,
    },
    RYOTSU_AIKAWA: {
      color: '#d9a62e',
      icon: ryotsuAikawaIcon,
      size: DEFAULT_MARKER_SIZE,
      zIndex: 2,
      accessibilityLabel: '両津・相川エリアのスポット',
      highlightColor: '#ffcc33',
    },
    KANAI_SAWADA_NIIBO_HATANO_MANO: {
      color: '#ec6800',
      icon: kanaiSawadaNiiboHatanoManoIcon,
      size: DEFAULT_MARKER_SIZE,
      zIndex: 2,
      accessibilityLabel: '金井・沢田・新穂・畑野・真野エリアのスポット',
      highlightColor: '#ff8826',
    },
    AKADOMARI_HAMOCHI_OGI: {
      color: '#007b43',
      icon: akadomariHamochiOgiIcon,
      size: DEFAULT_MARKER_SIZE,
      zIndex: 2,
      accessibilityLabel: '赤泊・羽茂・小木エリアのスポット',
      highlightColor: '#009957',
    },
    SNACK: {
      color: '#65318e',
      icon: snackIcon,
      size: DEFAULT_MARKER_SIZE,
      zIndex: 3,
      accessibilityLabel: '飲食店',
      highlightColor: '#8144b3',
      mobileSize: { width: 36, height: 36 },
    },
    PUBLIC_TOILET: {
      color: '#2792c3',
      icon: publicToiletIcon,
      size: DEFAULT_MARKER_SIZE,
      zIndex: 3,
      accessibilityLabel: '公共トイレ',
      highlightColor: '#33b8f4',
    },
    PARKING: {
      color: '#333333',
      icon: parkingIcon,
      size: DEFAULT_MARKER_SIZE,
      zIndex: 3,
      accessibilityLabel: '駐車場',
      highlightColor: '#555555',
    },
    RECOMMEND: {
      color: '#d7003a',
      icon: recommendIcon,
      size: MEDIUM_MARKER_SIZE,
      zIndex: 10,
      accessibilityLabel: 'おすすめスポット',
      highlightColor: '#ff1a53',
      animation: getMarkerAnimation('DROP'),
      mobileSize: { width: 42, height: 42 },
    },
    CURRENT_LOCATION: {
      color: '#42a30f',
      icon: currentLocationIcon,
      size: LARGE_MARKER_SIZE,
      zIndex: 20,
      accessibilityLabel: '現在地',
      highlightColor: '#55cc14',
      animation: getMarkerAnimation('BOUNCE'),
      mobileSize: { width: 48, height: 48 },
    },
  };
}

/**
 * エリアタイプごとのマーカー設定
 * すべてのマーカー属性を一元管理することで保守性を向上
 */
export const MARKERS_BY_AREA = createMarkersConfig();

// ============================================================================
// マーカー属性取得関数
// ============================================================================

/**
 * エリアキーの安全な検証と変換を行うヘルパー関数
 *
 * @param area - 検証するエリア識別子
 * @returns 有効なエリアキーまたはDEFAULT
 */
function getSafeAreaKey(area: AreaType | keyof typeof MARKERS_BY_AREA): keyof typeof MARKERS_BY_AREA {
  return area in MARKERS_BY_AREA ? (area as keyof typeof MARKERS_BY_AREA) : 'DEFAULT';
}

/**
 * エリアタイプから特定のマーカー属性を取得する汎用関数
 *
 * @param area - エリアタイプ
 * @param attribute - 取得する属性名
 * @returns 指定された属性の値
 */
export function getMarkerAttribute<K extends keyof MarkerConfigAttributes>(
  area: AreaType | keyof typeof MARKERS_BY_AREA,
  attribute: K,
): MarkerConfigAttributes[K] {
  const safeArea = getSafeAreaKey(area);
  return MARKERS_BY_AREA[safeArea][attribute];
}

/**
 * エリアタイプからマーカーの色を取得する関数
 *
 * @param area エリアタイプ
 * @returns 対応するマーカーの色コード
 */
export function getMarkerColor(area: AreaType | keyof typeof MARKERS_BY_AREA): string {
  return getMarkerAttribute(area, 'color');
}

/**
 * エリアタイプからマーカーのアイコンURLを取得する関数
 *
 * @param area エリアタイプ
 * @returns 対応するマーカーのアイコンURL
 */
export function getMarkerIcon(area: AreaType | keyof typeof MARKERS_BY_AREA): string {
  return getMarkerAttribute(area, 'icon');
}

/**
 * エリアタイプからマーカーのサイズを取得する関数
 *
 * @param area エリアタイプ
 * @param isMobile モバイルデバイス用サイズを返すかどうか
 * @returns 対応するマーカーのサイズ（幅と高さ）
 */
export function getMarkerSize(area: AreaType | keyof typeof MARKERS_BY_AREA, isMobile: boolean = false): MarkerSize {
  const safeArea = getSafeAreaKey(area);
  const config = MARKERS_BY_AREA[safeArea];

  return isMobile && config.mobileSize ? config.mobileSize : config.size;
}

/**
 * マーカーのアニメーションを取得する関数
 * Google Maps APIが利用可能かどうかを安全に確認します
 *
 * @param area エリアタイプ
 * @returns 対応するマーカーのアニメーション
 */
export function getMarkerAnimationForArea(area: AreaType | keyof typeof MARKERS_BY_AREA): MarkerAnimation {
  const animation = getMarkerAttribute(area, 'animation');

  // アニメーションがnullの場合はそのまま返す
  if (animation === null) {
    return null;
  }

  // Google Maps APIが利用可能な場合、アニメーションを返す
  return animation;
}

/**
 * エリアタイプからGoogle Maps用のマーカースタイルオプションを取得
 *
 * @param area エリアタイプ
 * @param isSelected 選択状態かどうか
 * @returns Google Maps APIのマーカースタイルオプション
 */
export function getMarkerStyleOptions(
  area: AreaType | keyof typeof MARKERS_BY_AREA,
  isSelected: boolean = false,
): MarkerStyleOptions {
  const safeArea = getSafeAreaKey(area);
  return configToStyleOptions(MARKERS_BY_AREA[safeArea], isSelected);
}

/**
 * マーカー設定をまとめたオブジェクト
 */
export const MARKER_CONFIG = {
  byArea: MARKERS_BY_AREA,
  getColor: getMarkerColor,
  getIcon: getMarkerIcon,
  getSize: getMarkerSize,
  getAttribute: getMarkerAttribute,
  getStyleOptions: getMarkerStyleOptions,
  getAnimation: getMarkerAnimationForArea,
};
