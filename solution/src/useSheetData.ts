import React from "react"; // Reactをインポート
import { useEffect, useState, useRef } from "react";
import type { Poi } from "./types.d.ts";

// 設定インターフェース
interface Config {
	spreadsheetId: string;
	apiKey: string;
}

// 設定オブジェクト
const config: Config = {
	spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
	apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
};

// POIデータのキャッシュ
const poiCache = new Map<string, Poi[]>();

// ID列のインデックス
const idColumnIndex = 49;


// 文字列がURLかどうかをチェックする簡易関数
export const isURL = (str: string | null | undefined): boolean => { // exportを追加
  if (!str) return false; // nullまたはundefinedの場合はfalseを返す
  try {
        new URL(str);
        return true;
    } catch (error) {
        return false;
    }
};


// スプレッドシートの行データをPoiオブジェクトに変換する関数
const transformRowToPoi = (row: any[], area: string): Poi => ({
	key: String(row[idColumnIndex]) ?? "", // キーとして使用、空のセルも対応
	location: {
		lat: parseFloat(row[47]) || 0, // 緯度
		lng: parseFloat(row[46]) || 0, // 経度
	},
	name: row[43] ?? "", // 名称
	category: row[26] ?? "", // カテゴリ
	genre: row[27] ?? "", // ジャンル
  information: row[41] ?? "", // 情報（URL文字列のまま格納）
	monday: row[28] ?? "", // 月曜日の営業時間
	tuesday: row[29] ?? "", // 火曜日の営業時間
	wednesday: row[30] ?? "", // 水曜日の営業時間
	thursday: row[31] ?? "", // 木曜日の営業時間
	friday: row[32] ?? "", // 金曜日の営業時間
	saturday: row[33] ?? "", // 土曜日の営業時間
	sunday: row[34] ?? "", // 日曜日の営業時間
	holiday: row[35] ?? "", // 祝日の営業時間
	description: row[36] ?? "", // 説明
	reservation: row[37] ?? "", // 予約情報
	payment: row[38] ?? "", // 支払い情報
	phone: row[39] ?? "", // 電話番号
	address: row[40] ?? "", // 住所
  view: row[42] ?? "", // Googleマップで見る（URL文字列のまま格納）
	area, // エリア
});


// スプレッドシートデータを取得する関数
const fetchSheetData = async (area: string): Promise<Poi[]> => {
	console.log(`エリア ${area} のデータを取得中...`);

	try {
		const response = await fetch(
			`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/'${area}'!A:AY?key=${config.apiKey}`
		);

		if (!response.ok) {
			const errorData = await response.json();
			const errorMessage = `HTTPエラー: ${area} の取得に失敗しました。ステータス: ${response.status} ${JSON.stringify(
				errorData
			)}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		const data = await response.json();
		console.log(`エリア ${area} の生データを受信:`, JSON.stringify(data));

		// データのバリデーション
		if (!data.values || !Array.isArray(data.values)) {
			const errorMessage = `データ形式が不正です: ${area}。データ: ${JSON.stringify(data)}`;
			console.error(errorMessage);
			throw new Error(errorMessage);
		}

		// データの変換と重複チェック
		const transformedData = data.values.slice(1).map((row: any) => transformRowToPoi(row, area));

		const keyCount = new Map<string, number>();
		for (const poi of transformedData as Poi[]) {
			const count = keyCount.get(poi.key) ?? 0;
			keyCount.set(poi.key, count + 1);
		}

		for (const [key, count] of keyCount.entries()) {
			if (count > 1) {
				console.error(`キー "${key}" は ${count} 回重複しています。`);
				// 必要に応じてエラー処理を追加 (例: 重複したPOIを除外する、エラーメッセージを表示するなど)
				// 重複しているPOIデータを出力
        const duplicatedPois = transformedData.filter((poi: Poi) => poi.key === key); // Poi型を指定
				console.error("重複しているPOI:", duplicatedPois);
			}
		}

		console.log(`エリア ${area} の変換済みデータ:`, transformedData);
		return transformedData;
	} catch (error) {
		console.error(`エラー: ${area} のデータ取得に失敗しました。`, error);
		throw error;
	}
};

// useSheetDataフックの戻り値の型
interface UseSheetDataResult {
	pois: Poi[];
	isLoading: boolean;
	error: string | null;
}

// スプレッドシートデータを取得するためのカスタムフック
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
