// src/useSheetData.ts
import { useState, useEffect, useRef, useCallback } from "react";
import type { Poi } from "./types";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

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

    // キャッシュを保持するためのRef。再レンダリング時にも値が保持される
    const poiCache = useRef<Map<AreaType, Poi[]>>(new Map());

    // データ取得処理をuseCallbackでメモ化
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // スプレッドシートIDとAPIキーの存在を確認
            if (!config.spreadsheetId || !config.apiKey) {
                throw new Error(
                    "設定エラー: スプレッドシートIDまたはAPIキーが不足しています。環境変数を確認してください。" +
                    `\nSpreadsheet ID: ${config.spreadsheetId}\nAPI Key: ${config.apiKey ? "********" : "未設定"}`
                );
            }

            const areaKeys = Object.keys(AREAS) as AreaType[];
            const results = await Promise.allSettled(
                areaKeys.map(async (area) => {
                    // キャッシュに存在する場合はキャッシュから返す
                    if (poiCache.current.has(area)) {
                        return poiCache.current.get(area)!;
                    }

                    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;
                    const response = await fetch(url);

                    if (!response.ok) {
                        const errorData = await response.json();
                        // エラーレスポンスの内容を詳細に表示
                        throw new Error(`HTTPエラー: ${response.status} ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`);
                    }

                    const data = await response.json();
                    const rows = (data.values?.slice(1) as SpreadsheetRow[]) ?? [];
                    const areaPois: Poi[] = [];

                    rows.forEach((row) => {
                        try {
                            const poi = transformRowToPoi(row, area);
                            areaPois.push(poi);
                        } catch (transformError) {
                            console.error("Error transforming row:", transformError);
                            // エラーメッセージを詳細に表示
                            throw transformError; // Promise.allSettled で catch するために throw
                        }
                    });

                    // キャッシュを更新
                    poiCache.current.set(area, areaPois);
                    return areaPois;
                })
            );

            const newPois = results.reduce<Poi[]>((acc, result) => {
                if (result.status === "fulfilled") {
                    return acc.concat(result.value);
                } else {
                    // エラーが発生した場合は、エラーメッセージを表示
                    console.error("Error loading data for area:", result.reason);
                    // setError(result.reason); // 必要に応じて setError を呼び出す
                    return acc; // エラーが発生したエリアのデータは無視
                }
            }, []);

            // 重複排除 & 更新
            const uniquePoisMap = new Map<string, Poi>();
            newPois.forEach(poi => uniquePoisMap.set(poi.key, poi));
            setPois(Array.from(uniquePoisMap.values()));

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
