// useSheetData.ts
import { useEffect, useState, useRef } from "react";
import { Poi } from "./types.js";
import { nanoid } from "nanoid";

// Configuration interface
interface Config {
  spreadsheetId: string;
  apiKey: string;
}

// Spreadsheet Configuration
const config: Config = {
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

// POI Data Cache for performance optimization
const poiCache = new Map<string, Poi[]>();

// Transform spreadsheet row to POI object
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

// Fetch data from Google Sheets API
const fetchSheetData = async (area: string): Promise<Poi[]> => {
  console.log(`Fetching data for area: ${area}`); // データ取得開始のログ

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${area}'!A:AY?key=${config.apiKey}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Error fetching data for ${area}:`, errorData); // エラーログ
    throw new Error(
      `HTTP error! status: ${response.status} ${errorData.error.message}`
    );
  }

  const data = await response.json();
  console.log(`Received data for area: ${area}`, data); // データ受信のログ
  if (!data.values) {
    console.error(`No data received for area: ${area}`); // データがない場合のエラーログ
    throw new Error("スプレッドシートのデータが取得できませんでした");
  }

  const transformedData = data.values.slice(1).map((row: any[]) => transformRowToPoi(row, area));
  console.log(`Transformed data for area: ${area}`, transformedData); // 変換後のデータのログ
  return transformedData;
};

interface UseSheetDataResult {
  pois: Poi[];
  isLoading: boolean;
  error: string | null;
}

export function useSheetData(areas: string[]): UseSheetDataResult {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const poiCache = useRef(new Map<string, Poi[]>());


  useEffect(() => {
    console.log("useSheetData useEffect called with areas:", areas); // useEffect実行のログ

    if (!config.spreadsheetId || !config.apiKey) {
      console.error("Spreadsheet ID or API Key is missing"); // 設定ミスログ
      setError("Spreadsheet ID or API Key is missing");
      setIsLoading(false);
      return;
    }

    const areasToFetch = areas.filter((area) => !poiCache.current.has(area));
    console.log(`Areas to fetch:`, areasToFetch); // Fetch対象のエリアログ

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (areasToFetch.length === 0) {
          const cachedPois = areas.flatMap((area) => poiCache.current.get(area) ?? []);
          console.log("Using cached data:", cachedPois); // キャッシュ使用のログ
          setPois(cachedPois);
        } else {
          const results = await Promise.all(areasToFetch.map(fetchSheetData));
          console.log("Fetched data:", results); // 取得データのログ

          results.forEach((poiData, index) => {
            poiCache.current.set(areasToFetch[index], poiData);
          });

          const allPois = areas.flatMap((area) => poiCache.current.get(area) ?? []);
          console.log("All Pois:", allPois); // 全Poiデータのログ
          setPois(allPois);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        console.error("Error loading data:", errorMessage, err); // エラーログ
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

  }, [areas]);

  return { pois, isLoading, error };
}
