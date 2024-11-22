// useSheetData.ts: スプレッドシートからデータを取得するためのカスタムフック
import { useState, useEffect } from "react";
import type { Poi } from "./types.d.ts";

// データ取得用の関数
export const useSheetData = (areas: string[]) => {
  const [pois, setPois] = useState<Poi[]>([]); // POI データ
  const [isLoading, setIsLoading] = useState(true); // 読み込み状態
  const [error, setError] = useState<string | null>(null); // エラー状態


  useEffect(() => {
    // データ取得処理を実行
		const loadData = async () => {
			console.log("loadData 関数開始");
			setIsLoading(true); // 読み込み開始
			try {
					const allPois = [];

					// 各エリアのデータを取得
					for (const area of areas) {
							console.log(`エリア ${area} のデータを取得中`);
							const range = `'${area}'!A1:ZZ`; // 取得する範囲を設定

							const response = await fetch(
									`your_gas_api_endpoint?sheetName=${area}&range=${range}` //APIエンドポイントを適宜変更してください。
							);

							if (!response.ok) {
									throw new Error(`スプレッドシートデータの取得エラー（${response.status}）`);
							}

							const data = await response.json();
							console.log(`エリア ${area} のrawデータを取得:`, data);
							const transformedData = transformData(data, area); // データを変換

							console.log(`エリア ${area} の変換済みデータ:`, transformedData);
							allPois.push(...transformedData);
					}

					// 全てのPOIデータを設定
					setPois(allPois);
			} catch (err) {
					console.error("データ取得エラー:", err);
					setError(err instanceof Error ? err.message : "エラーが発生しました");
			} finally {
					setIsLoading(false); // 読み込み終了
					console.log("loadData 関数終了。isLoading:", isLoading);
			}
		};

		// データ取得関数を呼び出し
		loadData();

}, [areas]);



  // スプレッドシートのレスポンスデータを変換する関数
  const transformData = (data: any, area: string): Poi[] => {
    // データの形式に合わせて適切な変換処理を実装
    // ...

		if (!data || !data.values || !Array.isArray(data.values)) {
			console.warn(`エリア ${area} のデータ形式が不正です`, data);
			return [];
		}

    // ヘッダー行を抽出
    const headers = data.values[0];

    // データ行をPOIオブジェクトの配列に変換
    return data.values.slice(1).map((row: any[]) => {
        const poi: Partial<Poi> = { area: area }; // 初期値としてエリアを設定
        row.forEach((cell, index) => {
					const header = headers[index];
					if (header) {
							(poi as any)[header.toLowerCase().trim().replace(/\s+/g, "")] = cell; // ヘッダーをキーとして値を設定
							if (header.toLowerCase() === 'google マップで見る') {
									poi.id = cell; // google マップで見る列の値をIDとして使用
									console.log("google マップで見る列の値:", poi.id)
							}
					}
				});
        return poi as Poi;
    }).filter((poi) => poi.name !== null && poi.name !== undefined) // nameがnullまたはundefinedのPOIを除外
		.map((poi) => ({...poi, location: {lat: parseFloat(poi.y), lng: parseFloat(poi.x)}})); // xとyをlocationに変換

  };


  return { pois, isLoading, error };
};
