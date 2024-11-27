// appConstants.ts: アプリケーションで使用する定数

export const AREAS = {
    RYOTSU_AIKAWA: "両津・相川地区",
    KANAI_SAWADA_NIIBO_HATANO_MANO: "金井・佐和田・新穂・畑野・真野地区",
    AKADOMARI_HAMOCHI_OGI: "赤泊・羽茂・小木地区",
    SNACK: "スナック",
    PUBLIC_TOILET: "公共トイレ",
    PARKING: "駐車場",
} as const;


export type AreaType = keyof typeof AREAS;


export const AREA_COLORS = {
    [AREAS.RYOTSU_AIKAWA as string]: "#ff8000",
    [AREAS.KANAI_SAWADA_NIIBO_HATANO_MANO as string]: "#34A853",
    [AREAS.AKADOMARI_HAMOCHI_OGI as string]: "#EA4335",
    [AREAS.SNACK as string]: "#ff80c0",
    [AREAS.PUBLIC_TOILET as string]: "#c0c0c0",
    [AREAS.PARKING as string]: "#000000",
} as const;


export const MAP_CONFIG = {
    defaultCenter: { lat: 38.0, lng: 138.5 },
    defaultZoom: 10,
    mapContainerStyle: {
        width: "100%",
        height: "100%",
    },
    clustererOptions: {
        minClusterSize: 0,
        maxZoom: 10,
        radius: 0,
    },
};
