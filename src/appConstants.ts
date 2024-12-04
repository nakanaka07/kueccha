export const AREAS = {
    RYOTSU_AIKAWA: "両津・相川地区",
    KANAI_SAWADA_NIIBO_HATANO_MANO: "金井・佐和田・新穂・畑野・真野地区",
    AKADOMARI_HAMOCHI_OGI: "赤泊・羽茂・小木地区",
    SNACK: "スナック",
    PUBLIC_TOILET: "公共トイレ",
    PARKING: "駐車場",
} as const; // 各エリアのキーと表示名を定義。as constで定数として型付け

export type AreaType = keyof typeof AREAS; // エリアのキーの型を定義
export type AreaName = typeof AREAS[AreaType]; // エリアの表示名の型を定義


export const AREA_COLORS = {
    [AREAS.RYOTSU_AIKAWA]: "#ff8000", // 両津・相川地区の色
    [AREAS.KANAI_SAWADA_NIIBO_HATANO_MANO]: "#34A853", // 金井・佐和田・新穂・畑野・真野地区の色
    [AREAS.AKADOMARI_HAMOCHI_OGI]: "#EA4335", // 赤泊・羽茂・小木地区の色
    [AREAS.SNACK]: "#ff80c0", // スナックの色
    [AREAS.PUBLIC_TOILET]: "#c0c0c0", // 公共トイレの色
    [AREAS.PARKING]: "#400080", // 駐車場の色
} as const; // 各エリアの色を定義。as constで定数として型付け

export const MAP_CONFIG = {
    defaultCenter: { lat: 38.0, lng: 138.5 }, // マップの初期中心座標（佐渡島）
    defaultZoom: 10, // マップの初期ズームレベル
    mapContainerStyle: {
        width: "100%", // マップコンテナの幅
        height: "100%", // マップコンテナの高さ
    },
} as const; // マップの設定を定義。as constで定数として型付け
