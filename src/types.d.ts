// src/types.d.ts

import { AreaType } from "./appConstants";

// POIデータ構造
export interface Poi {
	key: string;
	location: google.maps.LatLngLiteral;
	name: string;
	category?: string;
	genre?: string;
	information?: string;
	monday?: string;
	tuesday?: string;
	wednesday?: string;
	thursday?: string;
	friday?: string;
	saturday?: string;
	sunday?: string;
	holiday?: string;
	description?: string;
	reservation?: string;
	payment?: string;
	phone?: string;
	address?: string;
	view?: string;
	area: AreaType;
}
