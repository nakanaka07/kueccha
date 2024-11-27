// useSheetData.ts: スプレッドシートデータを取得・変換するカスタムフック
import { useState, useEffect, useRef } from "react";
import type { Poi } from "./types.d.ts";
import { config, fetchSheetData } from './sheetDataHelper';

// URL文字列かどうかを確認
export const isURL = (str: string | null | undefined): boolean => {
    if (!str) return false;
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};

// useSheetData フックの戻り値の型
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
        if (!config.spreadsheetId || !config.apiKey) {
            const errorMessage = "スプレッドシートIDまたはAPIキーが設定されていません。";
            console.error(errorMessage);
            setError(errorMessage);
            setIsLoading(false);
            return;
        }

        const areasToFetch = areas.filter(area => !poiCache.current.has(area));

        const loadData = async () => {
            setIsLoading(true);
            try {
                if (areasToFetch.length === 0) {
                    setPois(areas.flatMap(area => poiCache.current.get(area) ?? []));
                } else {
                    const newPoiData = await Promise.all(areasToFetch.map(fetchSheetData));

                    newPoiData.forEach((data, index) => {
                        poiCache.current.set(areasToFetch[index], data);
                    });

                    setPois(areas.flatMap(area => poiCache.current.get(area) ?? []));
                }

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "データの取得に失敗しました。";
                console.error(errorMessage, err);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [areas]);

    return { pois, isLoading, error };
}
