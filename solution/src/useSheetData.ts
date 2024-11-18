import { useEffect, useState, useMemo } from "react";
import { Poi } from "./types.js";
import { nanoid } from "nanoid";

// 環境変数の型定義を追加
// type EnvConfig = {
//   VITE_GOOGLE_SPREADSHEET_ID: string;
//   VITE_GOOGLE_SHEETS_API_KEY: string;
// };

// スプレッドシートの設定を外部化
const config = {
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID as string,
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string,
};

// POIデータのキャッシュは変更なし
const poiCache = new Map<string, Poi[]>();

// POIデータの変換関数を独立
const transformRowToPoi = (row: any[], area: string): Poi => ({
  key: nanoid(),
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

// APIからデータを取得する関数を独立
const fetchSheetData = async (area: string) => {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${area}'!A:AY?key=${config.apiKey}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HTTP error! status: ${response.status} ${errorData.error.message}`);
  }

  const data = await response.json();
  if (!data.values) {
    throw new Error("スプレッドシートのデータが取得できませんでした");
  }

  return data.values.slice(1).map((row: any[]) => transformRowToPoi(row, area));
};


// カスタムフックの戻り値の型定義を追加
interface UseSheetDataResult {
  pois: Poi[];
  loading: boolean;
  error: string | null;
}

export const useSheetData = (areas: string[]): UseSheetDataResult => {
  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // スプレッドシートIDとAPIキーをconfigから取得するように変更
    if (!config.spreadsheetId || !config.apiKey) {
      setError("Spreadsheet ID or API Key is missing.");
      setLoading(false);
      return;
    }

    const areasToFetch = areas.filter(area => !poiCache.has(area));

    // loadData関数をasync化
    const loadData = async () => {
      try {
        if (areasToFetch.length === 0) {
          const cachedPois = areas.flatMap(area => poiCache.get(area) ?? []);
          setPois(cachedPois);
          setLoading(false);
          return;
        }

        // fetchSheetDataを用いてデータ取得
        const results = await Promise.all(areasToFetch.map(fetchSheetData));

        results.forEach((poiData, index) => {
          poiCache.set(areasToFetch[index], poiData);
        });

        const allPois = areas.flatMap(area => poiCache.get(area) ?? []);
        setPois(allPois);

      } catch (err) {
        // エラーメッセージの取得方法を変更
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        console.error("スプレッドシートデータの取得中にエラーが発生しました:", err);
      } finally {
        setLoading(false);
      }
    };

    if (areasToFetch.length > 0) {
        loadData();
    } else {
      // キャッシュからデータを取得する処理を簡略化
      const cachedPois = areas.flatMap(area => poiCache.get(area) ?? []);
      setPois(cachedPois);
      setLoading(false);
    }

    // 依存配列からspreadsheetId, apiKeyを除去。configに変更がある場合は再ビルドされるため不要
  }, [areas]);

    // useMemoを使用して、poisの値が変化したときだけ再計算するように変更
  return {
    pois: useMemo(() => pois, [pois]),
    loading,
    error,
  };
};
