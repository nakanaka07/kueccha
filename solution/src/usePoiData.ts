import { useEffect, useState, useRef } from "react";
import { Poi } from "./types.js";
import { nanoid } from "nanoid";

const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

export const usePoiData = (areas: string[]) => {
	const [pois, setPois] = useState<Poi[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const cachedData = useRef<Map<string, Poi[]>>(new Map());

	useEffect(() => {
		if (!spreadsheetId || !apiKey) {
			setError("Spreadsheet ID or API Key is missing.");
			setLoading(false);
			return;
		}

		const areasToFetch = areas.filter((area) => !cachedData.current.has(area));

		if (areasToFetch.length === 0) {
			const allPois = areas.flatMap(
				(area) => cachedData.current.get(area) ?? []
			);
			setPois(allPois);
			setLoading(false);
			return;
		}

		const loadData = async () => {
			try {
				const promises = areasToFetch.map(async (area) => {
					const response = await fetch(
						`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${area}'!A:AY?key=${apiKey}`
					);

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(
							`HTTP error! status: ${response.status} ${errorData.error.message}`
						);
					}

					const data = await response.json();

					if (!data.values) {
						throw new Error("スプレッドシートのデータが取得できませんでした");
					}

					const poiData: Poi[] = data.values.slice(1).map((row: any[]) => {
						const lat = parseFloat(row[47]); // 北緯
						const lng = parseFloat(row[46]); // 東経

						return {
							key: nanoid(),
							location: {
								lat: isNaN(lat) ? 0 : lat,
								lng: isNaN(lng) ? 0 : lng,
							},
							name: row[43] ?? "", // 名称
							category: row[0] ?? "", // カテゴリ
							genre: row[1] ?? "", // ジャンル
							information: row[2] ?? "", // 情報
							monday: row[4] ?? "", // 月曜日
							tuesday: row[5] ?? "", // 火曜日
							wednesday: row[30] ?? "", // 水曜日
							thursday: row[31] ?? "", // 木曜日
							friday: row[32] ?? "", // 金曜日
							saturday: row[33] ?? "", // 土曜日
							sunday: row[34] ?? "", // 日曜日
							holiday: row[11] ?? "", // 祝日
							description: row[27] ?? "", // 説明
							reservation: row[28] ?? "", // 予約
							payment: row[29] ?? "", // 支払い
							phone: row[30] ?? "", // 電話番号
							address: row[45] ?? "", // 住所
							view: row[48] ?? "", // GoogleマップURL
							area: area, // 地域情報を追加
						};
					});

					return poiData;
				});

				const results = await Promise.all(promises);

				results.forEach((poiData, index) => {
					cachedData.current.set(areasToFetch[index], poiData);
				});

				const allPois = areas.flatMap(
					(area) => cachedData.current.get(area) ?? []
				);
				setPois(allPois);
			} catch (error) {
				if (error instanceof Error) {
					setError(error.message);
				} else {
					setError("An unknown error occurred");
				}
				console.error(
					"スプレッドシートデータの取得中にエラーが発生しました:",
					error
				);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [areas]);

	return { pois, loading, error };
};
