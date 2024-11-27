// sheetDataHelper.ts: スプレッドシート関連の処理
import type { Poi } from "./types.d.ts";

interface Config {
    spreadsheetId: string;
    apiKey: string;
}

export const config: Config = {
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

export const idColumnIndex = 49;

export const transformRowToPoi = (row: any[], area: string): Poi => ({
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

export const fetchSheetData = async (area: string): Promise<Poi[]> => {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${area}'!A:AY?key=${config.apiKey}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = `HTTPエラー: ${area} の取得に失敗しました。ステータス: ${response.status} ${JSON.stringify(errorData)}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.values || !Array.isArray(data.values)) {
            const errorMessage = `データ形式が不正です: ${area}。データ: ${JSON.stringify(data)}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        const transformedData = data.values.slice(1).map((row: any) => transformRowToPoi(row, area));

        const keyCount = new Map<string, number>();
        for (const poi of transformedData as Poi[]) {
            const count = keyCount.get(poi.key) ?? 0;
            keyCount.set(poi.key, count + 1);
        }

        for (const [key, count] of keyCount.entries()) {
            if (count > 1) {
                console.error(`キー "${key}" は ${count} 回重複しています。`);
                const duplicatedPois = transformedData.filter((poi: Poi) => poi.key === key);
                console.error("重複しているPOI:", duplicatedPois);
            }
        }

        return transformedData;
    } catch (error) {
        console.error(`エラー: ${area} のデータ取得に失敗しました。`, error);
        throw error;
    }
};
