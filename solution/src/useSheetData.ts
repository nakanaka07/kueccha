// useSheetData.ts: スプレッドシートデータを取得・変換するカスタムフック
import { useState, useEffect, useRef } from "react";
import type { Poi } from "./types.d.ts";
import { Config, config, idColumnIndex, transformRowToPoi, fetchSheetData } from './sheetDataHelper'; // スプレッドシート関連の処理を別ファイルに移動


// 文字列がURLかどうかをチェックする簡易関数
export const isURL = (str: string | null | undefined): boolean => {
    if (!str) return false;
    try {
        new URL(str);
        return true;
    } catch (error) {
        return false;
    }
};


// useSheetDataフックの戻り値の型
interface UseSheetDataResult {
	pois: Poi[];
	isLoading: boolean;
	error: string | null;
}


export function useSheetData(areas: string[]): UseSheetDataResult {
	const [pois, setPois] = useState<Poi[]>([]); // POIデータの状態
	const [isLoading, setIsLoading] = useState(true); // ロード状態
	const [error, setError] = useState<string | null>(null); // エラー状態

	// useRefを使ってキャッシュを保持。これにより再レンダリング時にキャッシュがクリアされるのを防ぐ。
	const poiCache = useRef(new Map<string, Poi[]>());

	useEffect(() => {
		console.log("useSheetData useEffect called with areas:", areas);

		// 設定のバリデーション
		if (!config.spreadsheetId || !config.apiKey) {
			console.error("Spreadsheet IDまたはAPIキーがありません。");
			setError("Spreadsheet IDまたはAPIキーがありません。");
			setIsLoading(false);
			return;
		}

		// まだキャッシュされていないエリアをフィルタリング
		const areasToFetch = areas.filter((area) => !poiCache.current.get(area));
		console.log(`取得が必要なエリア:`, areasToFetch);

		// データをロードする非同期関数
		const loadData = async () => {
			console.log("データのロードを開始...");

			setIsLoading(true);
			try {
				// 取得が必要なエリアがない場合は、キャッシュからデータを取得
				if (areasToFetch.length === 0) {
					const cachedPois = areas.flatMap((area) => poiCache.current.get(area) ?? []);
					console.log("キャッシュデータを使用:", cachedPois);
					setPois(cachedPois);
				} else {
					// fetchSheetDataを並列で実行
					const results = await Promise.all(areasToFetch.map(fetchSheetData));
					console.log("取得済みデータ:", results);

					// 取得したデータをキャッシュに保存
					results.forEach((poiData, index) => {
						poiCache.current.set(areasToFetch[index], poiData);
					});

					// 全てのエリアのPOIデータを結合
					const allPois = areas.flatMap((area) => poiCache.current.get(area) ?? []);
					console.log("全てのPOI:", allPois);
					setPois(allPois);
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
				setError(errorMessage);
				console.error("データのロード中にエラーが発生しました:", errorMessage, err);
			} finally {
				setIsLoading(false);
				console.log("データのロードが完了しました。isLoading:", isLoading);
			}
		};

		loadData();
	}, [areas]);

	return { pois, isLoading, error };
}

