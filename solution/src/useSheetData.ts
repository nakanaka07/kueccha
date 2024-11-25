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

    // キャッシュ機構（再レンダリングでクリアされないように useRef を使用）
    const poiCache = useRef(new Map<string, Poi[]>());

    useEffect(() => {
        // 設定値の確認
        if (!config.spreadsheetId || !config.apiKey) {
            const errorMessage = "スプレッドシートIDまたはAPIキーが設定されていません。";
            console.error(errorMessage);
            setError(errorMessage);
            setIsLoading(false);
            return;
        }

        // キャッシュされていないエリアを抽出
        const areasToFetch = areas.filter(area => !poiCache.current.has(area));

        // データ取得処理
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (areasToFetch.length === 0) {
                    // 全てキャッシュ済みであればキャッシュから取得
                    setPois(areas.flatMap(area => poiCache.current.get(area) ?? []));
                } else {
                    // キャッシュされていないエリアのデータを取得
                    const newPoiData = await Promise.all(areasToFetch.map(fetchSheetData));

                    // 取得したデータをキャッシュに保存
                    newPoiData.forEach((data, index) => {
                        poiCache.current.set(areasToFetch[index], data);
                    });

                    // キャッシュと合わせて全てのPOIデータをセット
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
