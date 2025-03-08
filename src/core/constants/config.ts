/**
 * 機能: アプリケーション全体の設定を定義（Google MapsとGoogle Sheetsの設定を含む）
 * 依存関係:
 *   - @react-google-maps/api ライブラリ（LoadScriptProps型を使用）
 *   - ./markersからMARKERS定数をインポート
 *   - 環境変数: VITE_GOOGLE_MAPS_API_KEY, VITE_GOOGLE_MAPS_MAP_ID, VITE_GOOGLE_SHEETS_API_KEY, VITE_GOOGLE_SPREADSHEET_ID
 * 注意点:
 *   - 環境変数が正しく設定されていることを確認
 *   - Google Maps APIの使用にはAPIキーとMapIDが必要
 *   - CONFIGはconst assertionで型安全性を確保
 *   - APP_CONFIG, MAPS_CONFIG, SHEETS_CONFIGは後方互換性のために維持
 */
import { LoadScriptProps } from '@react-google-maps/api';
import { MARKERS } from './markers';

export const CONFIG = {
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    libraries: ['places', 'geometry', 'drawing', 'marker'] as LoadScriptProps['libraries'],
    version: 'weekly',
    language: 'ja',
    defaultCenter: { lat: 38.1, lng: 138.4 },
    defaultZoom: 10,
    geolocation: {
      timeout: 10000,
      maxAge: 0,
      highAccuracy: true,
    },
    style: {
      width: '100%',
      height: '100%',
    },
    options: {
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      disableDoubleClickZoom: false,
      scrollwheel: true,
      clickableIcons: true,
      gestureHandling: 'cooperative',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: 2,
        position: 1,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: 3,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: 7,
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: 7,
      },
      cameraControl: true,
      cameraControlOptions: {
        position: 7,
      },
    },
  },
  sheets: {
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
  },
} as const;

export const APP_CONFIG = {
  maps: CONFIG.maps,
  sheets: CONFIG.sheets,
  markers: MARKERS,
};

export const MAPS_CONFIG = APP_CONFIG.maps;
export const SHEETS_CONFIG = APP_CONFIG.sheets;
