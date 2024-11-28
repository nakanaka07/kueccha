// useSheetData.ts: スプレッドシートデータを取得・変換するカスタムフック
import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types.d.ts";
import {
	config,
	transformRowToPoi,
	SpreadsheetRow,
} from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

// URL文字列かどうかをチェックするヘルパー関数
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
	const [pois, setPois] = useState<Poi[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const poiCache = useRef(new Map<AreaType, Poi[]>());

	const areasKey = useMemo(() => JSON.stringify(areas), [areas]);

	useEffect(() => {
		if (!config.spreadsheetId || !config.apiKey) {
			setError("スプレッドシートIDまたはAPIキーが設定されていません。");
			setIsLoading(false);
			return;
		}

		const areasToFetch = areas.filter((area) => !poiCache.current.has(area));

		if (areasToFetch.length === 0) {
			const cachedPois = areas.reduce<Poi[]>((acc, area) => {
				return acc.concat(poiCache.current.get(area) ?? []);
			}, []);
			setPois(cachedPois);
			setIsLoading(false);
			return;
		}

		const fetchData = async (area: AreaType): Promise<SpreadsheetRow[]> => {
			try {
				const response = await fetch(
					`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`
				);

				if (!response.ok) {
					const errorData = await response.json();
					const httpErrorMessage = `HTTPエラー: ${response.status} ${response.statusText} ${errorData?.error?.message}`;
					throw new Error(`エリア ${AREAS[area]} のデータ取得に失敗しました: ${httpErrorMessage}`);
				}

				const data = await response.json();

				if (!data.values || !Array.isArray(data.values)) {
					throw new Error(
						`データ形式が不正です: ${AREAS[area]}`
					);
				}

				return data.values.slice(1) as unknown as SpreadsheetRow[];
			} catch (error) {
				if (error instanceof Error) {
					throw new Error(`エリア ${AREAS[area]} - ${error.message}`);
				} else {
					throw new Error(`エリア ${AREAS[area]} - 不明なエラー`);
				}
			}
		};

		const loadData = async () => {
			setIsLoading(true);
			try {
				const newPoiData: Poi[] = (
					await Promise.all(
						areasToFetch.map(async (area) => {
							const rows = await fetchData(area);
							return rows.map((row) => transformRowToPoi(row, area));
						})
					)
				).flat();

				newPoiData.forEach((poi) => {
					const area = poi.area;
					const cachedPois = poiCache.current.get(area) ?? [];
					poiCache.current.set(area, [...cachedPois, poi]);
				});

				const allPois = areas.reduce<Poi[]>((acc, area) => {
					return acc.concat(poiCache.current.get(area) ?? []);
				}, []);

				setPois(allPois);
			} catch (error) {
				if (error instanceof Error) {
					setError(error.message);
				} else {
					setError("不明なエラーが発生しました。");
				}
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [areasKey]);

	return { pois, isLoading, error };
}
