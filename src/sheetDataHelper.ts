import type { Poi } from "./types";
import { AreaType, AREAS } from "./appConstants";

interface Config {
	spreadsheetId: string;
	apiKey: string;
}

export const config: Config = {
	spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
	apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

export const ColumnIndices = {
	id: 49,
	lat: 47,
	lng: 46,
	name: 43,
	category: 26,
	genre: 27,
	information: 41,
	monday: 28,
	tuesday: 29,
	wednesday: 30,
	thursday: 31,
	friday: 32,
	saturday: 33,
	sunday: 34,
	holiday: 35,
	description: 36,
	reservation: 37,
	payment: 38,
	phone: 39,
	address: 40,
	view: 42,
} as const;

type ColumnIndex = keyof typeof ColumnIndices;

const getStringValue = (row: SpreadsheetRow, index: ColumnIndex): string =>
	String(row[ColumnIndices[index]] ?? "");

const getNumberValue = (row: SpreadsheetRow, index: ColumnIndex): number => {
	const value = row[ColumnIndices[index]];
	const num = parseFloat(String(value));
	return isNaN(num) ? 0 : num;
};

export interface SpreadsheetRow {
	[ColumnIndices.id]: string;
	[ColumnIndices.lat]: string;
	[ColumnIndices.lng]: string;
	[ColumnIndices.name]: string;
	[ColumnIndices.category]: string;
	[ColumnIndices.genre]: string;
	[ColumnIndices.information]: string;
	[ColumnIndices.monday]: string;
	[ColumnIndices.tuesday]: string;
	[ColumnIndices.wednesday]: string;
	[ColumnIndices.thursday]: string;
	[ColumnIndices.friday]: string;
	[ColumnIndices.saturday]: string;
	[ColumnIndices.sunday]: string;
	[ColumnIndices.holiday]: string;
	[ColumnIndices.description]: string;
	[ColumnIndices.reservation]: string;
	[ColumnIndices.payment]: string;
	[ColumnIndices.phone]: string;
	[ColumnIndices.address]: string;
	[ColumnIndices.view]: string;
}

export const transformRowToPoi = (row: SpreadsheetRow, area: AreaType): Poi => {
	const lat = getNumberValue(row, "lat");
	const lng = getNumberValue(row, "lng");
	const name = getStringValue(row, "name");

	if (!name) {
		throw new Error(
			`名称が欠落しています。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}`
		);
	}
	if (isNaN(lat) || lat < -90 || lat > 90) {
		throw new Error(
			`緯度が不正です。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}, 値: ${lat}`
		);
	}
	if (isNaN(lng) || lng < -180 || lng > 180) {
		throw new Error(
			`経度が不正です。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}, 値: ${lng}`
		);
	}

	return {
		key: getStringValue(row, "id"),
		location: { lat, lng },
		name,
		category: getStringValue(row, "category"),
		genre: getStringValue(row, "genre"),
		information: getStringValue(row, "information"),
		monday: getStringValue(row, "monday"),
		tuesday: getStringValue(row, "tuesday"),
		wednesday: getStringValue(row, "wednesday"),
		thursday: getStringValue(row, "thursday"),
		friday: getStringValue(row, "friday"),
		saturday: getStringValue(row, "saturday"),
		sunday: getStringValue(row, "sunday"),
		holiday: getStringValue(row, "holiday"),
		description: getStringValue(row, "description"),
		reservation: getStringValue(row, "reservation"),
		payment: getStringValue(row, "payment"),
		phone: getStringValue(row, "phone"),
		address: getStringValue(row, "address"),
		view: getStringValue(row, "view"),
		area,
	};
};
