// src/sheetDataHelper.ts
import type { Poi } from "./types";
import { AreaType, AREAS } from "./appConstants";

// 設定インターフェース
interface Config {
    spreadsheetId: string | undefined;
    apiKey: string | undefined;
}

// 設定
export const config: Config = {
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

// 列インデックス
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

// 列インデックスの型
type ColumnIndex = keyof typeof ColumnIndices;

// スプレッドシートの行データから文字列値を取得するヘルパー関数
const getStringValue = (row: SpreadsheetRow, index: ColumnIndex): string =>
    String(row[ColumnIndices[index]] ?? "");

// スプレッドシートの行データから数値を取得するヘルパー関数
const getNumberValue = (row: SpreadsheetRow, index: ColumnIndex): number => {
    const value = row[ColumnIndices[index]];
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
};

// スプレッドシートの行データのインターフェース
export interface SpreadsheetRow {
    [key: number]: any;
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
    const id = getStringValue(row, "id");
    const lat = getNumberValue(row, "lat");
    const lng = getNumberValue(row, "lng");
    const name = getStringValue(row, "name");


    // データのバリデーション。エラーメッセージにシート名とIDを含める
    if (!name) {
        throw new Error(`名称が欠落しています。シート名: ${AREAS[area]}, ID: ${id}`);
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error(`緯度が不正です。シート名: ${AREAS[area]}, ID: ${id}, 値: ${lat}`);
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error(`経度が不正です。シート名: ${AREAS[area]}, ID: ${id}, 値: ${lng}`);
    }

    // POIオブジェクトを生成
    return {
        key: id,
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
