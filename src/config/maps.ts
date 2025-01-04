import type { MapConfig } from '../types';
import { MARKER_COLORS } from '../constants';
import { LoadScriptProps } from '@react-google-maps/api';

// Google Maps APIで使用するライブラリを指定
const libraries: LoadScriptProps['libraries'] = ['places', 'geometry', 'drawing', 'marker'];

// Google Mapsの設定を定義
export const mapsConfig: MapConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // Google Maps APIキー
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // Google MapsのマップID
  defaultCenter: { lat: 38.0, lng: 138.5 }, // マップのデフォルトの中心座標
  defaultZoom: 10, // マップのデフォルトのズームレベル
  libraries, // 使用するライブラリ
  language: 'ja', // マップの言語設定
  version: 'weekly', // Google Maps APIのバージョン
  style: {
    width: '100%', // マップの幅
    height: '100%', // マップの高さ
    disableDefaultUI: false, // デフォルトのUIを無効にするかどうか
    clickableIcons: true, // アイコンをクリック可能にするかどうか
  },
  options: {
    zoomControl: true, // ズームコントロールを表示するかどうか
    mapTypeControl: true, // マップタイプコントロールを表示するかどうか
    streetViewControl: true, // ストリートビューコントロールを表示するかどうか
    fullscreenControl: true, // フルスクリーンコントロールを表示するかどうか
  },
};

// マーカーの設定を定義
export const markerConfig = {
  colors: MARKER_COLORS, // マーカーの色設定
};
