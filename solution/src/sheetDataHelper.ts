// sheetDataHelper.ts: スプレッドシート関連の処理
import type { Poi } from "./types.d.ts";
import { AreaType } from "./appConstants";

interface Config {
	spreadsheetId: string;
	apiKey: string;
}

export const config: Config = {
	spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
	apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

export const idColumnIndex = 49;

export const transformRowToPoi = (row: any[], area: AreaType): Poi => ({
	key: String(row[idColumnIndex]) ?? "",
	location: {
		lat: parseFloat(row[47]) || 0,
		lng: parseFloat(row[46]) || 0,
	},
	name: row[43] ?? "",
	category: row[26] ?? "",
	genre: row[27] ?? "",
	information: row[41] ?? "",
	monday: row[28] ?? "",
	tuesday: row[29] ?? "",
	wednesday: row[30] ?? "",
	thursday: row[31] ?? "",
	friday: row[32] ?? "",
	saturday: row[33] ?? "",
	sunday: row[34] ?? "",
	holiday: row[35] ?? "",
	description: row[36] ?? "",
	reservation: row[37] ?? "",
	payment: row[38] ?? "",
	phone: row[39] ?? "",
	address: row[40] ?? "",
	view: row[42] ?? "",
	area,
});
