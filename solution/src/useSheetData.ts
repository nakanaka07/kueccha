// useSheetData.ts: スプレッドシートデータを取得・変換するカスタムフック
import { useState, useEffect, useRef } from "react";
import type { Poi } from "./types.d.ts";
import { config, transformRowToPoi } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

export const isURL = (str: string | null | undefined): boolean => {
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

	useEffect(() => {
		if (!config.spreadsheetId || !config.apiKey) {
			const errorMessage =
				"スプレッドシートIDまたはAPIキーが設定されていません。";
			console.error(errorMessage);
			setError(errorMessage);
			setIsLoading(false);
			return;
		}

		const areasToFetch = areas.filter((area) => !poiCache.current.has(area));

		const loadData = async () => {
			setIsLoading(true);
			try {
				if (areasToFetch.length > 0) {
					const newPoiData = await Promise.all(
						areasToFetch.map(async (area) => {
							const response = await fetch(
								`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`
							);
							if (!response.ok) {
								const errorData = await response.json();
								const errorMessage = `HTTPエラー: ${AREAS[area]} の取得に失敗しました。ステータス: ${response.status} ${JSON.stringify(errorData)}`;
								console.error(errorMessage);
								throw new Error(errorMessage);
							}
							const data = await response.json();
							if (!data.values || !Array.isArray(data.values)) {
								const errorMessage = `データ形式が不正です: ${AREAS[area]}。データ: ${JSON.stringify(data)}`;
								console.error(errorMessage);
								throw new Error(errorMessage);
							}

                                return data.values.slice(1).map((row: any) => transformRowToPoi(row, area));
                            })
					);
					newPoiData.forEach((data, index) => {
						poiCache.current.set(areasToFetch[index], data);
					});
				}

				const allPois = areas.flatMap(
					(area) => poiCache.current.get(area) ?? []
				);
				setPois(allPois);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "データの取得に失敗しました。";
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
