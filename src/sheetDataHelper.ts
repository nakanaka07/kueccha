// src/sheetDataHelper.ts
import type { Poi } from "./types";
import { AreaType, AREAS } from "./appConstants";

// 設定インターフェース
interface Config {
    spreadsheetId: string | undefined; // スプレッドシートID。undefinedを許容
    apiKey: string | undefined; // APIキー。undefinedを許容
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
    return isNaN(num) ? 0 : num; // 数値でない場合は0を返す
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
    // 緯度と経度を数値に変換。getNumberValue関数を使用
    const lat = getNumberValue(row, "lat");
    const lng = getNumberValue(row, "lng");
    const name = getStringValue(row, "name");

    // データのバリデーション
    if (!name) {
        // 名称が空の場合はエラーをスロー
        throw new Error(
            `名称が欠落しています。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}`
        );
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
        // 緯度が不正な場合はエラーをスロー
        throw new Error(
            `緯度が不正です。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}, 値: ${lat}`
        );
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
        // 経度が不正な場合はエラーをスロー
        throw new Error(
            `経度が不正です。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}, 値: ${lng}`
        );
    }

    // POIオブジェクトを生成
    return {
        key: getStringValue(row, "id"), // キー
        location: { lat, lng }, // 位置情報
        name, // 名称
        category: getStringValue(row, "category"), // カテゴリー
        genre: getStringValue(row, "genre"), // ジャンル
        information: getStringValue(row, "information"), // 情報
        monday: getStringValue(row, "monday"), // 月曜日の営業時間
        tuesday: getStringValue(row, "tuesday"), // 火曜日の営業時間
        wednesday: getStringValue(row, "wednesday"), // 水曜日の営業時間
        thursday: getStringValue(row, "thursday"), // 木曜日の営業時間
        friday: getStringValue(row, "friday"), // 金曜日の営業時間
        saturday: getStringValue(row, "saturday"), // 土曜日の営業時間
        sunday: getStringValue(row, "sunday"), // 日曜日の営業時間
        holiday: getStringValue(row, "holiday"), // 祝日の営業時間
        description: getStringValue(row, "description"), // 説明
        reservation: getStringValue(row, "reservation"), // 予約情報
        payment: getStringValue(row, "payment"), // 支払い情報
        phone: getStringValue(row, "phone"), // 電話番号
        address: getStringValue(row, "address"), // 住所
        view: getStringValue(row, "view"), // GoogleマップのURL
        area, // エリア
    };
};

