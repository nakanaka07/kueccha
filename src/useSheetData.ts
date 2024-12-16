// src/useSheetData.ts
import { useState, useEffect, useRef, useCallback } from "react";
import type { Poi } from "./types";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";


// URL Validation (If this isn't used elsewhere, consider removing it)
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
export const isURL = (str: string | null | undefined): boolean =>
    !!str && urlRegex.test(str);


interface UseSheetDataResult {
    pois: Poi[];
    isLoading: boolean;
    error: Error | null;
    retry: () => void;
}

export function useSheetData(): UseSheetDataResult {
    const [pois, setPois] = useState<Poi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const poiCache = useRef(new Map<AreaType, Poi[]>());

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!config.spreadsheetId || !config.apiKey) {
                throw new Error(
                    "設定エラー: スプレッドシートIDまたはAPIキーが不足しています。環境変数を確認してください。" +
                    `\nSpreadsheet ID: ${config.spreadsheetId}\nAPI Key: ${config.apiKey ? "********" : "未設定"}`
                );
            }

            const newPoiMap = new Map<string, Poi>();
            const areaKeys = Object.keys(AREAS) as AreaType[];

            await Promise.all(
                areaKeys
                    .filter(area => !poiCache.current.has(area))
                    .map(async (area) => {
                        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;
                        const response = await fetch(url);

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(
                                `HTTPエラー: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
                            );
                        }

                        const data = await response.json();
                        const rows = (data.values?.slice(1) as SpreadsheetRow[]) ?? [];

                        rows.forEach(row => {
                            try {
                                const poi = transformRowToPoi(row, area);
                                newPoiMap.set(poi.key, poi);
                                if (!poiCache.current.has(area)) {
                                    poiCache.current.set(area, []);
                                }
                                poiCache.current.get(area)!.push(poi);
                            } catch (transformError) {
                                console.error("Error transforming row:", transformError); //Keep the console logs for debugging production errors if necessary. Remove if you don't need them.
                                setError(transformError instanceof Error ? transformError : new Error(String(transformError))); // Set the state with any caught errors instead of just logging.

                            }
                        });
                    })
            );

            setPois(Array.from(newPoiMap.values()));

        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { pois, isLoading, error, retry: loadData };
}
