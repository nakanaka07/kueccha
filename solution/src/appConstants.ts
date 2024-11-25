// appConstants.ts: アプリケーションで使用する定数
import type { Poi } from "./types.d.ts";

// エリアの定義
export const AREAS = {
    RYOTSU_AIKAWA: "両津・相川地区",
    KANAI_AREA: "金井・佐和田・新穂・畑野・真野地区",
    AKADOMARI_AREA: "赤泊・羽茂・小木地区",
    SNACK: "スナック",
    PUBLIC_TOILET: "公共トイレ",
    PARKING: "駐車場",
} as const;

// エリアの型定義
export type AreaType = typeof AREAS[keyof typeof AREAS];

// エリアごとの色定義
export const AREA_COLORS = {
    [AREAS.RYOTSU_AIKAWA]: "#ff8000",
    [AREAS.KANAI_AREA]: "#34A853",
    [AREAS.AKADOMARI_AREA]: "#EA4335",
    [AREAS.SNACK]: "#ff80c0",
    [AREAS.PUBLIC_TOILET]: "#00ffff",
    [AREAS.PARKING]: "#999999",
} as const;

// マップの設定
export const MAP_CONFIG = {
    defaultCenter: { lat: 38.0, lng: 138.5 }, // デフォルトの中心座標
    defaultZoom: 10, // デフォルトのズームレベル
    mapContainerStyle: {
        width: "100%",
        height: "100%",
    },
    clustererOptions: {
        minClusterSize: 4,  // クラスタリングの最小サイズ
        maxZoom: 16,       // クラスタリングの最大ズームレベル
        radius: 40,          // クラスタの半径
    },
};

// 位置情報が同じかどうかを判定する関数
export const isSamePosition = (pos1: google.maps.LatLngLiteral, pos2: google.maps.LatLngLiteral): boolean => {
    return pos1.lat === pos2.lat && pos1.lng === pos2.lng;
};
