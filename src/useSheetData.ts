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

    // データ取得処理をuseCallbackでメモ化。依存配列が空なので初回レンダリング時に1回だけ生成される
    const loadData = useCallback(async () => {
        setIsLoading(true); // ローディング状態をtrueに設定
        setError(null); // エラー状態をnullに設定

        try {
            // スプレッドシートIDとAPIキーの存在を確認
            if (!config.spreadsheetId || !config.apiKey) {
                throw new Error(
                    "設定エラー: スプレッドシートIDまたはAPIキーが不足しています。環境変数を確認してください。" +
                    `\nSpreadsheet ID: ${config.spreadsheetId}\nAPI Key: ${config.apiKey ? "********" : "未設定"}`
                );
            }

            const newPoiMap = new Map<string, Poi>(); // 新しいPOIを格納するMap
            const areaKeys = Object.keys(AREAS) as AreaType[]; // エリアキーの配列

            // 各エリアのデータを取得
            await Promise.all(
                areaKeys
                    .filter((area) => !poiCache.current.has(area)) // キャッシュに存在しないエリアのみ取得
                    .map(async (area) => {
                        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;
                        const response = await fetch(url);

                        if (!response.ok) {
                            const errorData = await response.json(); // エラーレスポンスをJSON形式で取得
                            throw new Error(
                                `HTTPエラー: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}` // 詳細なエラーメッセージを生成
                            );
                        }

                        const data = await response.json();
                        // ヘッダー行を除外したデータを取得
                        const rows = (data.values?.slice(1) as SpreadsheetRow[]) ?? [];

                        rows.forEach((row) => {
                            try {
                                const poi = transformRowToPoi(row, area); // スプレッドシートの行をPOIオブジェクトに変換
                                newPoiMap.set(poi.key, poi); // POIをMapに追加

                                // キャッシュにエリアが存在しない場合は初期化
                                if (!poiCache.current.has(area)) {
                                    poiCache.current.set(area, []);
                                }
                                poiCache.current.get(area)!.push(poi); // POIをキャッシュに追加
                            } catch (transformError) {
                                // 変換エラーが発生した場合、エラーメッセージをコンソールに出力し、エラー状態を更新
                                console.error("Error transforming row:", transformError);
                                setError(transformError instanceof Error ? transformError : new Error(String(transformError)));
                            }
                        });
                    })
            );

            // stateを更新
            setPois(Array.from(newPoiMap.values())); // 新しいPOIデータでstateを更新

        } catch (err) {
            // エラーが発生した場合、エラー状態を更新
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            // ローディング状態をfalseに設定
            setIsLoading(false);
        }
    }, []);


    // useEffectを使って、コンポーネントがマウントされたときにデータを取得
    useEffect(() => {
        loadData(); // データ取得関数を呼び出す
    }, [loadData]); // loadDataが変更された場合のみuseEffectが再実行される


    return { pois, isLoading, error, retry: loadData };
}

