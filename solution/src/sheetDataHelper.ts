// sheetDataHelper.ts: スプレッドシート関連の処理
import type { Poi } from "./types.d.ts";
import { AreaType } from "./appConstants";

// スプレッドシートの設定interface
interface Config {
    spreadsheetId: string;
    apiKey: string;
}

// スプレッドシートIDとAPIキー
export const config: Config = {
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

// スプレッドシートの各列のインデックスをオブジェクトで定義
export const ColumnIndices = {
    id: 49,
    lat: 47, // 緯度
    lng: 46, // 経度
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

// ColumnIndices のキーの型を定義
type ColumnIndex = keyof typeof ColumnIndices;

// スプレッドシートのセル値を取得し、文字列に変換するヘルパー関数
const getStringValue = (row: SpreadsheetRow, index: ColumnIndex): string => {
    const value = row[ColumnIndices[index]];
    return String(value ?? "");
};

// スプレッドシートのセル値を取得し、数値に変換するヘルパー関数
const getNumberValue = (row: SpreadsheetRow, index: ColumnIndex): number => {
    const value = row[ColumnIndices[index]];
    const num = parseFloat(String(value)); // parseFloatの前にStringに変換
    return isNaN(num) ? 0 : num;
};

// スプレッドシートの行データの型を定義
export interface SpreadsheetRow {
    [ColumnIndices.id]: string;
    [ColumnIndices.lat]: string;
    [ColumnIndices.lng]: string;
    [ColumnIndices.name]: string;
    [ColumnIndices.category]: string | undefined;
    [ColumnIndices.genre]: string | undefined;
    [ColumnIndices.information]: string | undefined;
    [ColumnIndices.monday]: string | undefined;
    [ColumnIndices.tuesday]: string | undefined;
    [ColumnIndices.wednesday]: string | undefined;
    [ColumnIndices.thursday]: string | undefined;
    [ColumnIndices.friday]: string | undefined;
    [ColumnIndices.saturday]: string | undefined;
    [ColumnIndices.sunday]: string | undefined;
    [ColumnIndices.holiday]: string | undefined;
    [ColumnIndices.description]: string | undefined;
    [ColumnIndices.reservation]: string | undefined;
    [ColumnIndices.payment]: string | undefined;
    [ColumnIndices.phone]: string | undefined;
    [ColumnIndices.address]: string | undefined;
    [ColumnIndices.view]: string | undefined;
}

// スプレッドシートの行データからPoiオブジェクトを生成する関数
export const transformRowToPoi = (row: SpreadsheetRow, area: AreaType): Poi => {
    // 緯度経度を数値に変換 - getNumberValueを使用
    const lat = getNumberValue(row, "lat");
    const lng = getNumberValue(row, "lng");


    // 必須項目が欠けている場合、または緯度経度が無効な値の場合はエラーをスロー
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error(`スプレッドシートのデータが不正です: ${JSON.stringify(row)}`);
    }


    // データを変換してPoiオブジェクトを返す
    return {
        key: getStringValue(row, "id"),
        location: {
            lat,
            lng,
        },
        name: getStringValue(row, "name"),
        category: getStringValue(row, "category"),
        genre: getStringValue(row,"genre"),
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
