// src/useSheetData.ts

import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

// URL正規表現
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

// URLチェック関数
const isURL = (str: string | null | undefined): boolean => !!str && urlRegex.test(str);

export { isURL };

// useSheetDataの戻り値型
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
        // 設定値がない場合はエラー
        if (!config.spreadsheetId || !config.apiKey) {
            setError("スプレッドシートIDまたはAPIキーが設定されていません。");
            setIsLoading(false);
            return;
        }

        // フェッチが必要なエリアを抽出
        const areasToFetch = areas.filter(area => !poiCache.current.has(area));

        // 全てキャッシュ済みならキャッシュから取得
        if (!areasToFetch.length) {
            setPois(areas.flatMap(area => poiCache.current.get(area) ?? []));
            setIsLoading(false);
            return;
        }

        // データフェッチ関数
        const fetchData = async (area: AreaType) => {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;

            try {
                const response = await fetch(url);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTPエラー: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
                }

                const data = await response.json();
                return (data.values?.slice(1) as SpreadsheetRow[]) ?? []; // ヘッダーを除外

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`エリア ${AREAS[area]} - ${errorMessage}`);
            }
        };

        // データロード関数
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const poiMap = new Map<string, Poi>();

                // "おすすめ"を最後に処理
                const sortedAreasToFetch = [...areasToFetch].sort((a, b) => {
                    if (a === "RECOMMEND") return 1;
                    if (b === "RECOMMEND") return -1;
                    return 0;
                });

                for (const area of sortedAreasToFetch) {
                    const rows = await fetchData(area);
                    const newPois = rows.map(row => transformRowToPoi(row, area));

                    // IDで上書き
                    newPois.forEach(poi => poiMap.set(poi.key, poi));

                    // キャッシュ更新
                    poiCache.current.set(area, Array.from(poiMap.values()).filter(poi => poi.area === area));
                }

                setPois(Array.from(poiMap.values()));

            } catch (error) {
                setError(error instanceof Error ? error.message : String(error));

            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [areasKey]);

    return { pois, isLoading, error };
}
