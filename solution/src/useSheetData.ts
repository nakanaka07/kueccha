import { useEffect, useState, useRef } from "react";
import type { Poi } from "./types.d.ts";
import { nanoid } from "nanoid";

interface Config {
  spreadsheetId: string;
  apiKey: string;
}

const config: Config = {
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

const poiCache = new Map<string, Poi[]>();

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
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Received raw data for area: ${area}`, JSON.stringify(data));

    if (!data.values || !Array.isArray(data.values)) {
      const errorMessage = `Invalid data format for area: ${area}. Data: ${JSON.stringify(data)}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const transformedData = data.values.slice(1).map((row: any[]) => transformRowToPoi(row, area));
    console.log(`Transformed data for area: ${area}`, transformedData);
    return transformedData;

  } catch (error) {
    console.error(`Error fetching data for ${area}:`, error);
    throw error;
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
      console.error("Spreadsheet ID or API Key is missing");
      setError("Spreadsheet ID or API Key is missing");
      setIsLoading(false);
      return;
    }

    const areasToFetch = areas.filter((area) => !poiCache.current.has(area));
    console.log(`Areas to fetch:`, areasToFetch);

    const loadData = async () => {
      console.log("loadData function started");

      setIsLoading(true);
      try {
        if (areasToFetch.length === 0) {
          const cachedPois = areas.flatMap((area) => poiCache.current.get(area) ?? []);
          console.log("Using cached data:", cachedPois);
          setPois(cachedPois);
        } else {
          const results = await Promise.all(areasToFetch.map(fetchSheetData));
          console.log("Fetched data:", results);

          results.forEach((poiData, index) => {
            poiCache.current.set(areasToFetch[index], poiData);
          });

          const allPois = areas.flatMap((area) => poiCache.current.get(area) ?? []);
          console.log("All Pois:", allPois);
          setPois(allPois);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        console.error("Error loading data:", errorMessage, err);
      } finally {
        setIsLoading(false);
        console.log("loadData function finished. isLoading:", isLoading);
      }
    };

    loadData();

  }, [areas]);

  return { pois, isLoading, error };
}
