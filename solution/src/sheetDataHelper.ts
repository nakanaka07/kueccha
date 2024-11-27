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
export const latColumnIndex = 47; // 緯度
export const lngColumnIndex = 46; // 経度
export const nameColumnIndex = 43;
export const categoryColumnIndex = 26;
export const genreColumnIndex = 27;
export const informationColumnIndex = 41;
export const mondayColumnIndex = 28;
export const tuesdayColumnIndex = 29;
export const wednesdayColumnIndex = 30;
export const thursdayColumnIndex = 31;
export const fridayColumnIndex = 32;
export const saturdayColumnIndex = 33;
export const sundayColumnIndex = 34;
export const holidayColumnIndex = 35;
export const descriptionColumnIndex = 36;
export const reservationColumnIndex = 37;
export const paymentColumnIndex = 38;
export const phoneColumnIndex = 39;
export const addressColumnIndex = 40;
export const viewColumnIndex = 42;


export const transformRowToPoi = (row: any[], area: AreaType): Poi => ({
	key: String(row[idColumnIndex]) ?? "",
	location: {
        lat: parseFloat(row[latColumnIndex]) || 0, // <- 定数を使用
        lng: parseFloat(row[lngColumnIndex]) || 0, // <- 定数を使用
    },
    name: row[nameColumnIndex] ?? "", // <- 定数を使用
	category: row[categoryColumnIndex] ?? "",
	genre: row[genreColumnIndex] ?? "",
	information: row[informationColumnIndex] ?? "",
	monday: row[mondayColumnIndex] ?? "",
	tuesday: row[tuesdayColumnIndex] ?? "",
	wednesday: row[wednesdayColumnIndex] ?? "",
	thursday: row[thursdayColumnIndex] ?? "",
	friday: row[fridayColumnIndex] ?? "",
	saturday: row[saturdayColumnIndex] ?? "",
	sunday: row[sundayColumnIndex] ?? "",
	holiday: row[holidayColumnIndex] ?? "",
	description: row[descriptionColumnIndex] ?? "",
	reservation: row[reservationColumnIndex] ?? "",
	payment: row[paymentColumnIndex] ?? "",
	phone: row[phoneColumnIndex] ?? "",
	address: row[addressColumnIndex] ?? "",
	view: row[viewColumnIndex] ?? "",
	area,
});
