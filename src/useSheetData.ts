import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

export const isURL = (str: string | null | undefined): boolean => !!str && urlRegex.test(str);

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

        const areasToFetch = areas.filter((area) => !poiCache.current.has(area));

        if (areasToFetch.length === 0) {
            const cachedPois = areas.flatMap((area) => poiCache.current.get(area) ?? []);
            setPois(cachedPois);
            setIsLoading(false);
            return;
        }

        const fetchData = async (area: AreaType): Promise<SpreadsheetRow[]> => {
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
                const errorMessage = err instanceof Error ? err.message : String(err);
                throw new Error(`エリア ${AREAS[area]} - ${errorMessage}`);
            }
        };

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const newPoiData = (
                    await Promise.all(
                        areasToFetch.map(async (area) => {
                            const rows = await fetchData(area);
                            return rows.map((row) => transformRowToPoi(row, area));
                        })
                    )
                ).flat();

                newPoiData.forEach((poi) => {
                    poiCache.current.set(poi.area, (poiCache.current.get(poi.area) ?? []).concat(poi));
                });

                setPois(areas.flatMap((area) => poiCache.current.get(area) ?? []));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [areasKey]);

    return { pois, isLoading, error };
}
