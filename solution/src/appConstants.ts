export const AREAS = {
	RYOTSU_AIKAWA: "両津・相川地区",
	KANAI_AREA: "金井・佐和田・新穂・畑野・真野地区",
	AKADOMARI_AREA: "赤泊・羽茂・小木地区",
	SNACK: "スナック",
	PUBLIC_TOILET: "公共トイレ",
	PARKING: "駐車場",
} as const;

export type AreaType = (typeof AREAS)[keyof typeof AREAS];

export const AREA_COLORS = {
	[AREAS.RYOTSU_AIKAWA]: "#ff8000",
	[AREAS.KANAI_AREA]: "#34A853",
	[AREAS.AKADOMARI_AREA]: "#EA4335",
	[AREAS.SNACK]: "#ff80c0",
	[AREAS.PUBLIC_TOILET]: "#00ffff",
	[AREAS.PARKING]: "#999999",
} as const;

export const MAP_CONFIG = {
	defaultCenter: { lat: 38.0, lng: 138.5 },
	defaultZoom: 10,
	mapContainerStyle: {
		width: "100%",
		height: "100%",
	},
	clustererOptions: {
		minClusterSize: 4,
		maxZoom: 16,
		radius: 40,
	},
};

export const isSamePosition = (
	pos1: google.maps.LatLngLiteral,
	pos2: google.maps.LatLngLiteral
): boolean => {
	return pos1.lat === pos2.lat && pos1.lng === pos2.lng;
};
