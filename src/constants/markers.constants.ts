/**
 * マーカー関連定数ファイル - マップ上のマーカーの設定を定義
 */
import { getMarkerAnimation } from './config.constants';
import { configToStyleOptions } from '../types/markers.types';

// マーカーアイコン画像
import publicToiletIcon from '../images/ano_icon01.png';
import recommendIcon from '../images/ano_icon_recommend.png';
import ryotsuAikawaIcon from '../images/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from '../images/icon_map02.png';
import akadomariHamochiOgiIcon from '../images/icon_map03.png';
import defaultIcon from '../images/row2.png';
import parkingIcon from '../images/shi_icon01.png';
import snackIcon from '../images/shi_icon02.png';
import currentLocationIcon from '../images/shi_icon04.png';

import type { AreaType } from '../types/areas.types';
import type {
  MarkerSize,
  MarkerConfigAttributes,
  MarkerStyleOptions,
  MarkerAnimation,
} from '../types/markers.types';

// マーカーサイズの定義
const DEFAULT_MARKER_SIZE: MarkerSize = { width: 32, height: 32 };
const MEDIUM_MARKER_SIZE: MarkerSize = { width: 36, height: 36 };
const LARGE_MARKER_SIZE: MarkerSize = { width: 40, height: 40 };

// エリア別マーカー設定
export const MARKERS_BY_AREA: Record<AreaType | 'DEFAULT', MarkerConfigAttributes> = {
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

// エリア識別子の検証
function getSafeAreaKey(area: AreaType | keyof typeof MARKERS_BY_AREA): keyof typeof MARKERS_BY_AREA {
  return area in MARKERS_BY_AREA ? area as keyof typeof MARKERS_BY_AREA : 'DEFAULT';
}

// マーカー属性取得の汎用関数
export function getMarkerAttribute<K extends keyof MarkerConfigAttributes>(
  area: AreaType | keyof typeof MARKERS_BY_AREA,
  attribute: K,
): MarkerConfigAttributes[K] {
  const safeArea = getSafeAreaKey(area);
  return MARKERS_BY_AREA[safeArea][attribute];
}

// マーカー色の取得
export function getMarkerColor(area: AreaType | keyof typeof MARKERS_BY_AREA): string {
  return getMarkerAttribute(area, 'color');
}

// マーカーアイコンの取得
export function getMarkerIcon(area: AreaType | keyof typeof MARKERS_BY_AREA): string {
  return getMarkerAttribute(area, 'icon');
}

// マーカーサイズの取得
export function getMarkerSize(
  area: AreaType | keyof typeof MARKERS_BY_AREA,
  isMobile: boolean = false,
): MarkerSize {
  const safeArea = getSafeAreaKey(area);
  const config = MARKERS_BY_AREA[safeArea];
  return isMobile && config.mobileSize ? config.mobileSize : config.size;
}

// マーカーアニメーションの取得
export function getMarkerAnimationForArea(
  area: AreaType | keyof typeof MARKERS_BY_AREA,
): MarkerAnimation {
  return getMarkerAttribute(area, 'animation');
}

// マーカーのスタイルオプション取得
export function getMarkerStyleOptions(
  area: AreaType | keyof typeof MARKERS_BY_AREA,
  isSelected: boolean = false,
): MarkerStyleOptions {
  const safeArea = getSafeAreaKey(area);
  return configToStyleOptions(MARKERS_BY_AREA[safeArea], isSelected);
}

// マーカー設定のエクスポート
export const MARKER_CONFIG = {
  byArea: MARKERS_BY_AREA,
  getColor: getMarkerColor,
  getIcon: getMarkerIcon,
  getSize: getMarkerSize,
  getAttribute: getMarkerAttribute,
  getStyleOptions: getMarkerStyleOptions,
  getAnimation: getMarkerAnimationForArea,
};