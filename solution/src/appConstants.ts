// appConstants.ts: アプリケーションで使用する定数を定義
import { LatLngLiteral } from "@react-google-maps/api";

export const MAP_CONFIG = {
  // マップの初期設定
  defaultCenter: { lat: 38.0, lng: 138.3 } as LatLngLiteral, // 佐渡島の中心座標をデフォルト値に設定
  defaultZoom: 10, // 初期ズームレベル
  mapContainerStyle: { width: "100%", height: "100%" }, // マップコンテナのスタイル
};


export const AREAS = {
    // 佐渡島のエリアを定義
    RYOTSU_AIKAWA: '両津・相川地区',
    KANAI_SAWATA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
    AKADOMARI_HAMO_OGI: '赤泊・羽茂・小木地区',
    SNACK: 'スナック',
    PUBLIC_TOILET: '公共トイレ',
    PARKING: '駐車場',
} as const;



export const AREA_COLORS = {
  // エリアごとのマーカーの色
  [AREAS.RYOTSU_AIKAWA]: "#FF0000", // 赤
  [AREAS.KANAI_SAWATA_NIIBO_HATANO_MANO]: "#0000FF", // 青
  [AREAS.AKADOMARI_HAMO_OGI]: "#00FF00", // 緑
  [AREAS.SNACK]: "#FFFF00", // 黄
  [AREAS.PUBLIC_TOILET]: "#00FFFF", // シアン
  [AREAS.PARKING]: "#FF00FF", // マゼンタ
};
