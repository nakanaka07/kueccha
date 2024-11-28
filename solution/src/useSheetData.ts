// useSheetData.ts: スプレッドシートデータを取得・変換するカスタムフック
import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types.d.ts";
import {
	config,
	transformRowToPoi,
	SpreadsheetRow,
	ColumnIndices,
} from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

// URL文字列かどうかをチェックするヘルパー関数 (おそらく未使用)
export const isURL = (str: string | null | undefined): boolean => {
	if (!str) return false;
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
};

// useSheetDataフックの戻り値の型定義
interface UseSheetDataResult {
	pois: Poi[];
	isLoading: boolean;
	error: string | null;
}

export function useSheetData(areas: AreaType[]): UseSheetDataResult {
	// POIデータの状態を管理するstate
	const [pois, setPois] = useState<Poi[]>([]);
	// データ読み込み状態を管理するstate
	const [isLoading, setIsLoading] = useState(true);
	// エラー状態を管理するstate
	const [error, setError] = useState<string | null>(null);

	// 取得済みPOIデータをキャッシュするRef
	const poiCache = useRef(new Map<string, Poi[]>());

	// areas配列の変更を検知するためのメモ化されたキー
    const areasKey = useMemo(() => JSON.stringify(areas), [areas, AREAS]);

	// areasKeyが変更されるたびに実行されるuseEffect

	useEffect(() => {
		// configが正しく設定されているかチェック
		if (!config.spreadsheetId || !config.apiKey) {
			const errorMessage =
				"スプレッドシートIDまたはAPIキーが設定されていません。";
			console.error(errorMessage);
			setError(errorMessage);
			setIsLoading(false);
			return;
		}

		// まだフェッチされていないエリアを特定
        const areasToFetch = areas.filter((area) => !poiCache.current.has(area)); // JSON.stringifyを削除

        // フェッチが必要なエリアがない場合の処理
            if (areasToFetch.length === 0) {
                // reduceを使ってキャッシュからデータを取得
                const cachedPois = areas.reduce<Poi[]>((acc, area) => {
                      return acc.concat(poiCache.current.get(area) ?? []);
                  }, []);

                  setPois(cachedPois);
                  setIsLoading(false);
                  return;
              }

		// スプレッドシートからデータを取得する関数
        const fetchData = async (area: AreaType): Promise<SpreadsheetRow[]> => {
            try {
			const response = await fetch(
				`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`
            );

                if (!response.ok) {
                                    // fetch API エラー
                const errorData = await response.json();
                const httpErrorMessage = `HTTPエラー: ${response.status} ${response.statusText} ${errorData?.error?.message}`;
                throw new Error(`エリア ${AREAS[area]} のデータ取得に失敗しました: ${httpErrorMessage}`); // エラーメッセージにエリア名を追加

            }

			const data = await response.json();

            if (!data.values || !Array.isArray(data.values)) {
                // JSON パースエラー
                throw new Error(`データ形式が不正です: ${AREAS[area]}。データ: ${JSON.stringify(data)}`);
            }

            return data.values.slice(1) as unknown as SpreadsheetRow[];
        } catch (error) {
            // fetchData 関数内のエラーをキャッチして、エリア名を追加したエラーメッセージをスロー
            if (error instanceof Error) {
                throw new Error(`エリア ${AREAS[area]} - ${error.message}`);
            } else {
                throw new Error(`エリア ${AREAS[area]} - 不明なエラー`);
            }
        }
        };

		// データをフェッチして処理する非同期関数
		const loadData = async () => {
            setIsLoading(true);
            try {
				const newPoiData: Poi[] = (
					await Promise.all(
						areasToFetch.map(async (area) => {
							const rows = await fetchData(area); // fetchData関数でデータを取得
                            // fetchDataが失敗した場合は空配列を返す
                            return (rows ?? []).map((row) => transformRowToPoi(row, area)).flat();
                        })
					)
				).flat();

            // 取得したデータをキャッシュに保存 - JSON.stringifyを削除
            newPoiData.forEach((poi) => {
                const area = poi.area;
                const cachedPois = poiCache.current.get(area) ?? [];
                poiCache.current.set(area, [...cachedPois, poi]);
            });


            // 全てのPOIデータを結合 - reduceを使って書き直し
            const allPois = areas.reduce<Poi[]>((acc, area) => {
                return acc.concat(poiCache.current.get(area) ?? []);
            }, []);

            setPois(allPois); // 取得したデータで状態を更新
        } catch (error) {
            // エラーメッセージを表示
            console.error("エラーが発生しました:", error);
            if (error instanceof Error) {
                setError(error.message); // エラーメッセージを state に設定
            } else {
                setError("不明なエラーが発生しました。");
            }

        } finally {
            setIsLoading(false);
        }
    };

    // ... (データの読み込み)
}, [areasKey]);

    
	// 戻り値
	return { pois, isLoading, error };
}
