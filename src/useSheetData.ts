import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

// URLが有効かどうかをチェックする正規表現
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

// URL妥当性チェック関数
export const isURL = (str: string | null | undefined): boolean => {
    return !!str && urlRegex.test(str);
};

// useSheetDataフックの戻り値の型
interface UseSheetDataResult {
    pois: Poi[];              // 取得したPOIの配列
    isLoading: boolean;       // ロード中かどうか
    error: string | null;     // エラーメッセージ
}

// スプレッドシートからPOIデータを取得するカスタムフック
export function useSheetData(areas: AreaType[]): UseSheetDataResult {
    const [pois, setPois] = useState<Poi[]>([]);        // POIデータ
    const [isLoading, setIsLoading] = useState(true);    // ロード状態
    const [error, setError] = useState<string | null>(null); // エラー状態

    // 各エリアのPOIをキャッシュするRefオブジェクト
    const poiCache = useRef(new Map<AreaType, Poi[]>());

    // areas配列の文字列表現。依存配列として使用することで、areasが変更された場合のみuseEffectが再実行される
    const areasKey = useMemo(() => JSON.stringify(areas), [areas]);

    useEffect(() => {
        // 設定チェック：スプレッドシートIDとAPIキーが設定されているか確認
        if (!config.spreadsheetId || !config.apiKey) {
            setError("スプレッドシートIDまたはAPIキーが設定されていません。");
            setIsLoading(false);
            return;
        }

        // 取得対象のエリアを決定：キャッシュに存在しないエリアのみ取得
        const areasToFetch = areas.filter(area => !poiCache.current.has(area));

        // 全てのエリアがキャッシュ済みの場合：キャッシュからデータを取得し早期リターン
        if (areasToFetch.length === 0) {
            const cachedPois = areas.flatMap(area => poiCache.current.get(area) ?? []);
            setPois(cachedPois);
            setIsLoading(false);
            return;
        }

        // 指定されたエリアのデータを取得する非同期関数
        const fetchData = async (area: AreaType): Promise<SpreadsheetRow[]> => {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.json();
                    // エラーレスポンスを詳細に表示
                    throw new Error(`HTTPエラー: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
                }
                const data = await response.json();
                // データが存在しない場合の処理を追加
                return (data.values?.slice(1) as SpreadsheetRow[]) ?? [];
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                // エラーメッセージにエリア名を追加
                throw new Error(`エリア ${AREAS[area]} - ${errorMessage}`);
            }
        };

        // データをロードし、状態を更新する非同期関数
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 並列処理でデータを取得
                const newPoiData = (
                    await Promise.all(
                        areasToFetch.map(async (area) => {
                            const rows = await fetchData(area);
                            return rows.map((row) => transformRowToPoi(row, area));
                        })
                    )
                ).flat();

                // 取得したデータをキャッシュに追加
                newPoiData.forEach(poi => {
                    poiCache.current.set(poi.area, (poiCache.current.get(poi.area) ?? []).concat(poi));
                });

                // キャッシュから全エリアのPOIデータを取得して状態を更新
                setPois(areas.flatMap(area => poiCache.current.get(area) ?? []));

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        loadData(); // データロードを実行
    }, [areasKey]); // areasKeyが変更された場合のみ再実行

    return { pois, isLoading, error };
}
