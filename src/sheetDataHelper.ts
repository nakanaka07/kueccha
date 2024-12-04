import type { Poi } from "./types";
import { AreaType, AREAS } from "./appConstants";

// スプレッドシートの設定を格納するインターフェース
interface Config {
    spreadsheetId: string; // スプレッドシートID
    apiKey: string;        // APIキー
}

// スプレッドシートの設定。環境変数から値を取得
export const config: Config = {
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

// スプレッドシートの列インデックスを定数として定義
export const ColumnIndices = {
    id: 49,              // ID
    lat: 47,             // 緯度
    lng: 46,             // 経度
    name: 43,            // 名称
    category: 26,        // カテゴリ
    genre: 27,           // ジャンル
    information: 41,     // 情報
    monday: 28,          // 月曜日の営業時間
    tuesday: 29,         // 火曜日の営業時間
    wednesday: 30,       // 水曜日の営業時間
    thursday: 31,        // 木曜日の営業時間
    friday: 32,          // 金曜日の営業時間
    saturday: 33,        // 土曜日の営業時間
    sunday: 34,          // 日曜日の営業時間
    holiday: 35,         // 祝日の営業時間
    description: 36,     // 補足
    reservation: 37,    // 予約
    payment: 38,        // 支払い
    phone: 39,          // 電話番号
    address: 40,         // 住所
    view: 42,           // GoogleマップURL
} as const;

// 列インデックスの型を定義
type ColumnIndex = keyof typeof ColumnIndices;

// スプレッドシートの行から文字列値を取得するヘルパー関数
const getStringValue = (row: SpreadsheetRow, index: ColumnIndex): string => String(row[ColumnIndices[index]] ?? "");

// スプレッドシートの行から数値を取得するヘルパー関数
const getNumberValue = (row: SpreadsheetRow, index: ColumnIndex): number => {
    const value = row[ColumnIndices[index]];
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num; // 数値に変換できない場合は0を返す
};


// スプレッドシートの行データの型を定義
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


// スプレッドシートの行データをPoiオブジェクトに変換する関数
export const transformRowToPoi = (row: SpreadsheetRow, area: AreaType): Poi => {
    const lat = getNumberValue(row, "lat");
    const lng = getNumberValue(row, "lng");
    const name = getStringValue(row, "name");

    // データのバリデーションチェック。不正なデータがあればエラーをスロー
    if (!name) {
        throw new Error(`名称が欠落しています。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}`);
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error(`緯度が不正です。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}, 値: ${lat}`);
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new Error(`経度が不正です。シート名: ${AREAS[area]}, id: ${getStringValue(row, "id")}, 値: ${lng}`);
    }

    // Poiオブジェクトを生成して返す
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
