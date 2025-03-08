/**
 * 機能: 佐渡島のエリア区分、表示設定、位置情報に関する定数を定義
 * 依存関係:
 *   - ../types/poi からのPoi型
 *   - ../types/common からのAreaType型
 * 注意点:
 *   - CURRENT_LOCATION_POIのlocation座標はデフォルト値(0,0)で、実際の使用時にはuseCurrentLocationPoiフックで上書きされる
 *   - INITIAL_VISIBILITYはSNACK、PUBLIC_TOILET、PARKING、CURRENT_LOCATIONを除き初期表示が有効
 *   - エリア名は定数として定義され、型安全性のためにconst assertionを使用
 */
import { Poi } from '../types/poi';
import type { AreaType } from '../types/common';

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

export const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING' && area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
);

export const CURRENT_LOCATION_POI: Poi = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION' as AreaType,
  category: '現在地',
  genre: '現在地',
  location: { lat: 0, lng: 0 },
};
