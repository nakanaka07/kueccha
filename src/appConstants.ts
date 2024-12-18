// src/appConstants.ts

// エリアの定義
export const AREAS = {
    RYOTSU_AIKAWA: "両津・相川地区",
    KANAI_SAWADA_NIIBO_HATANO_MANO: "金井・佐和田・新穂・畑野・真野地区",
    AKADOMARI_HAMOCHI_OGI: "赤泊・羽茂・小木地区",
    SNACK: "スナック",
    PUBLIC_TOILET: "公共トイレ",
    PARKING: "駐車場",
    RECOMMEND: "おすすめ",
} as const;

// エリアタイプの型定義
export type AreaType = keyof typeof AREAS;

// デフォルトのマーカーの色
export const defaultMarkerColor = "#000000"; // 黒

// エリアごとのマーカーの色
export const AREA_COLORS: Record<AreaType, string> = {
    RYOTSU_AIKAWA: "#ff8000", // オレンジ
    KANAI_SAWADA_NIIBO_HATANO_MANO: "#ff8000", // オレンジ
    AKADOMARI_HAMOCHI_OGI: "#ff8000", // オレンジ
    SNACK: "#ff80c0", // ピンク
    PUBLIC_TOILET: "#00ffff", // シアン
    PARKING: "#000000", // 黒
    RECOMMEND: "#ff0000", // 赤
};


// マップの設定
export const MAP_CONFIG = {
    defaultCenter: { lat: 38.0, lng: 138.5 }, // デフォルトの中心座標（佐渡島）
    defaultZoom: 10, // デフォルトのズームレベル
    mapContainerStyle: {
        width: "100%", // マップコンテナの幅
        height: "100%", // マップコンテナの高さ
    },
} as const;
