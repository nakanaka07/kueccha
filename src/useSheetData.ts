// src/useSheetData.ts

import { useState, useEffect, useRef, useMemo } from "react";
import type { Poi } from "./types";
import { config, transformRowToPoi, SpreadsheetRow } from "./sheetDataHelper";
import { AREAS, AreaType } from "./appConstants";

// URL正規表現
const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

// URLチェック関数
export const isURL = (str: string | null | undefined): boolean =>
	!!str && urlRegex.test(str);

interface UseSheetDataResult {
	pois: Poi[];
	isLoading: boolean;
	error: string | null;
}

export function useSheetData(): UseSheetDataResult {
	// areas引数を削除
	const [pois, setPois] = useState<Poi[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const poiCache = useRef(new Map<AreaType, Poi[]>());
	const areas = Object.keys(AREAS) as AreaType[]; // AREASのキーをAreaType配列に変換
	const areasKey = useMemo(() => JSON.stringify(areas), [areas]); // 常に同じ値なので、useMemoは不要

	useEffect(() => {
		// 設定値がない場合はエラー
		if (!config.spreadsheetId || !config.apiKey) {
			setError("スプレッドシートIDまたはAPIキーが設定されていません。");
			setIsLoading(false);
			return;
		}

		// フェッチが必要なエリアを抽出
		const areasToFetch = areas.filter((area) => !poiCache.current.has(area));

		// 全てキャッシュ済みならキャッシュから取得
		if (!areasToFetch.length) {
			setPois(areas.flatMap((area) => poiCache.current.get(area) ?? []));
			setIsLoading(false);
			return;
		}

		const fetchData = async (area: AreaType) => {
			const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${AREAS[area]}'!A:AY?key=${config.apiKey}`;

			try {
				const response = await fetch(url);

				if (!response.ok) {
					const errorData = await response.json();
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

		const loadData = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const newPoiMap = new Map<string, Poi>(); // 新しいMapを作成

				for (const area of areasToFetch) {
					// areasToFetchをループ
					const rows = await fetchData(area);
					const newPois = rows.map((row) => transformRowToPoi(row, area));

					// 新しいPOIを追加、既存のPOIは上書き
					newPois.forEach((poi) => newPoiMap.set(poi.key, poi));

					poiCache.current.set(area, newPois); // キャッシュを更新
				}
				setPois(Array.from(newPoiMap.values()));
			} catch (error) {
				setError(error instanceof Error ? error.message : String(error));
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [areasKey]); // areasKeyは常に同じなので依存配列から外しても良い

	return { pois, isLoading, error };
}
