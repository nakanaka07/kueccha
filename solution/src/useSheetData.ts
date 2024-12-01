import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types.d.ts";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

export const isURL = (str: string | null | undefined): boolean => {
    if (!str) return false;
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};

interface UseSheetDataResult {
    pois: Poi[];
    isLoading: boolean;
    error: string | null;
}

export function useSheetData(areas: AreaType[]): UseSheetDataResult {
    const [pois, setPois] = useState<Poi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const poiCache = useRef(new Map<AreaType, Poi[]>());
    const areasKey = useMemo(() => JSON.stringify(areas), [areas]);

    useEffect(() => {
        if (!config.spreadsheetId || !config.apiKey) {
            setError("スプレッドシートIDまたはAPIキーが設定されていません。");
            setIsLoading(false);
            return;
        }

        const areasToFetch = areas.filter(area => !poiCache.current.has(area));

        if (areasToFetch.length === 0) {
            setPois(areas.flatMap(area => poiCache.current.get(area) ?? []));
            setIsLoading(false);
            return;
        }

        const fetchData = async (area: AreaType) => {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTPエラー: ${response.status} ${response.statusText} ${errorData?.error?.message}`);
                }
                const data = await response.json();
                if (!data.values || !Array.isArray(data.values)) {
                    throw new Error(`データ形式が不正です: ${AREAS[area]}`);
                }
                return data.values.slice(1) as unknown as SpreadsheetRow[];
            } catch (error) {
                if (error instanceof Error) {
                    throw new Error(`エリア ${AREAS[area]} - ${error.message}`);
                } else {
                    throw new Error(`エリア ${AREAS[area]} - 不明なエラー`);
                }
            }
        };


        const loadData = async () => {
            setIsLoading(true);
            try {
                const newPoiData = (await Promise.all(
                    areasToFetch.map(async area => {
                        const rows = await fetchData(area);
                        return rows.map(row => transformRowToPoi(row, area));
                    })
                )).flat();

                newPoiData.forEach(poi => poiCache.current.set(poi.area, [...(poiCache.current.get(poi.area) ?? []), poi]));

                setPois(areas.flatMap(area => poiCache.current.get(area) ?? []));

            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("不明なエラーが発生しました。");
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [areasKey]);

    return { pois, isLoading, error };
}
