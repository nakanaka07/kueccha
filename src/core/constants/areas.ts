import { Poi } from '../types/poi';
import type { AreaType } from '../types/common';

// エリア定義
export const AREAS = {
  RYOTSU_AIKAWA: '両津・相川地区',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
  SNACK: 'スナック',
  PUBLIC_TOILET: '公共トイレ',
  PARKING: '駐車場',
  RECOMMEND: 'おすすめ',
  CURRENT_LOCATION: '現在地',
} as const;

// エリアの初期表示状態
export const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING' && area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
);

// 現在地マーカー用のPOIデータ
export const CURRENT_LOCATION_POI: Poi = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION' as AreaType,
  category: '現在地',
  genre: '現在地',
  location: { lat: 0, lng: 0 }, // デフォルト値を設定（実際には useCurrentLocationPoi で上書きされる）
};
