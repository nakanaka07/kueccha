import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types";
import {
	config,
	transformRowToPoi,
	SpreadsheetRow,
} from "./sheetDataHelper.ts";
import { AREAS, AreaType } from "./appConstants.ts";

// URL妥当性チェック関数
export const isURL = (str: string | null | undefined): boolean => {
	// isURL をエクスポート
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
		// 設定値の確認: スプレッドシートIDとAPIキーが設定されていることを確認
		if (!config.spreadsheetId || !config.apiKey) {
			setError("スプレッドシートIDまたはAPIキーが設定されていません。");
			setIsLoading(false);
			return;
		}

		// 取得対象のエリアを決定: キャッシュに存在しないエリアのみ取得
		const areasToFetch = areas.filter((area) => !poiCache.current.has(area));

		// 全てのエリアがキャッシュ済みの場合: キャッシュからデータを取得し早期リターン
		if (areasToFetch.length === 0) {
			const cachedPois = areas.flatMap(
				(area) => poiCache.current.get(area) ?? []
			);
			setPois(cachedPois); // キャッシュデータを設定
			setIsLoading(false);
			return;
		}

		// 指定されたエリアのデータを取得する非同期関数
		const fetchData = async (area: AreaType) => {
			const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;

			try {
				const response = await fetch(url);
				if (!response.ok) {
					const errorData = await response.json();
					// HTTPエラー発生時は、レスポンスの全情報を含める
					throw new Error(
						`HTTPエラー: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
					);
				}
				const data = await response.json();
				return (data.values?.slice(1) as SpreadsheetRow[]) ?? [];
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
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

				newPoiData.forEach((poi) => {
					// キャッシュを更新(既存データがあれば追加、なければ新規作成)
					poiCache.current.set(
						poi.area,
						(poiCache.current.get(poi.area) ?? []).concat(poi)
					);
				});

				setPois(areas.flatMap((area) => poiCache.current.get(area) ?? []));
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [areasKey]);

	return { pois, isLoading, error };
}
