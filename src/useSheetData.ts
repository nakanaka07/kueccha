// src/useSheetData.ts
import { useState, useEffect, useRef, useCallback } from "react";
import type { Poi } from "./types";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

// URL Validation
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
export const isURL = (str: string | null | undefined): boolean => !!str && urlRegex.test(str);

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
    const areas = Object.keys(AREAS) as AreaType[];

    const loadData = useCallback(async () => {
        if (!config.spreadsheetId || !config.apiKey) {
            const configError = new Error(
                "設定エラー: スプレッドシートIDまたはAPIキーが不足しています。" +
                "\n環境変数を確認してください。" +
                `\nSpreadsheet ID: ${config.spreadsheetId}` +
                `\nAPI Key: ${config.apiKey ? '********' : '未設定'}`
            );
            setError(configError);
            setIsLoading(false);
            return;
        }

        const areasToFetch = areas.filter(area => !poiCache.current.has(area));

        if (!areasToFetch.length) {
            const cachedPois = areas.flatMap(area => poiCache.current.get(area) ?? []);
            setPois(cachedPois);
            setIsLoading(false);
            return;
        }

        const fetchData = async (area: AreaType) => {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTPエラー: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
                }
                const data = await response.json();
                return (data.values?.slice(1) as SpreadsheetRow[]) ?? [];
            } catch (err) {
                throw new Error(`エリア ${AREAS[area]} - ${err instanceof Error ? err.message : String(err)}`);
            }
        };

        setIsLoading(true);
        setError(null);

        try {
            const newPoiMap = new Map<string, Poi>();

            await Promise.all(areasToFetch.map(async (area) => {
                const rows = await fetchData(area);
                const newPois = rows.map(row => transformRowToPoi(row, area));
                newPois.forEach(poi => newPoiMap.set(poi.key, poi));
                poiCache.current.set(area, newPois);
            }));

            setPois(Array.from(newPoiMap.values()));

        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, [areas]);


    useEffect(() => {
        loadData();
    }, [loadData]);

    return { pois, isLoading, error, retry: loadData };
}

