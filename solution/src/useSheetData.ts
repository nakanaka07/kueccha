// useSheetData.ts
import { useEffect, useState, useRef } from "react";
import type { Poi } from "./types.d.ts";
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
  console.log(`Fetching data for area: ${area}`);

  try {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${area}'!A:AY?key=${config.apiKey}`
  );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = `HTTP error fetching ${area}: ${response.status} ${JSON.stringify(errorData)}`;
      console.error(errorMessage);
      throw new Error(errorMessage); // Re-throw error for outer catch block
    }

  const data = await response.json();
  console.log(`Received raw data for area: ${area}`, JSON.stringify(data)); // Log the entire data object

    if (!data.values || !Array.isArray(data.values)) {
      const errorMessage = `Invalid data format for area: ${area}. Data: ${JSON.stringify(data)}`;
      console.error(errorMessage);
      throw new Error(errorMessage); // Re-throw error
    }

  const transformedData = data.values.slice(1).map((row: any[]) => transformRowToPoi(row, area));
  console.log(`Transformed data for area: ${area}`, transformedData);
  return transformedData;

} catch (error) {
  console.error(`Error fetching data for ${area}:`, error); // More specific error logging
  throw error; // Re-throw to handle in the useEffect
}
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
    console.log("useSheetData useEffect called with areas:", areas);

    if (!config.spreadsheetId || !config.apiKey) {
      console.error("Spreadsheet ID or API Key is missing"); // 設定ミスログ
      setError("Spreadsheet ID or API Key is missing");
      setIsLoading(false);
      return;
    }

    const areasToFetch = areas.filter((area) => !poiCache.current.has(area));
    console.log(`Areas to fetch:`, areasToFetch); // Fetch対象のエリアログ

    const loadData = async () => {
      console.log("loadData function started"); // Log when loadData begins

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
        console.log("loadData function finished. isLoading:", isLoading); // Log when loadData finishes, including isLoading status
      }
    };

    loadData();

  }, [areas]);

  return { pois, isLoading, error };
}
