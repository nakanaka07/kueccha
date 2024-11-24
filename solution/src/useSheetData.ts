import { useState, useEffect } from "react";
import type { Poi } from "./types.d.ts";

export const useSheetData = (areas: string[]) => {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const allPois: Poi[] = [];

        for (const area of areas) {
          const range = `'${area}'!A1:ZZ`;
          const response = await fetch(
            `your_gas_api_endpoint?sheetName=${area}&range=${range}` // APIエンドポイントを適宜変更してください。
          );

          if (!response.ok) {
            throw new Error(`スプレッドシートデータの取得エラー（${response.status} ${response.statusText}）`);
          }

          const data = await response.json();
          const transformedData = transformData(data, area);
          allPois.push(...transformedData);
        }

        setPois(allPois);
      } catch (error) {
        console.error("データ取得エラー:", error);
        setError(error instanceof Error ? error.message : "予期しないエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [areas]);

  interface PoiWithCoordinates extends Partial<Poi> {
    x?: string;
    y?: string;
  }

  const isPoiWithCoordinates = (poi: any): poi is PoiWithCoordinates => {
		return poi.area !== undefined && poi.x !== undefined && poi.y !== undefined;
	};

  const isPoi = (poi: any): poi is Poi => {
    return poi.id && poi.name && poi.area && typeof poi.location?.lat === 'number' && typeof poi.location?.lng === 'number' && poi.address;
  };


  const transformData = (data: { values: any[][] }, area: string): Poi[] => {
    if (!data?.values || !Array.isArray(data.values) || data.values.length < 2) {
      return [];
    }

    const headers = data.values[0].map(header => String(header).toLowerCase().trim().replace(/\s+/g, ""));

    return data.values.slice(1)
      .map(row =>
        headers.reduce<PoiWithCoordinates>((poi, header, index) => {
          const cell = row[index];
          (poi as any)[header] = cell;
          if (header === 'googleマップで見る') {
            poi.id = String(cell);
          }
          if (header === 'x') {
            poi.x = String(cell);
          }
          if (header === 'y') {
            poi.y = String(cell);
          }
          return poi;
				}, { area } as PoiWithCoordinates) // 初期値の型を PoiWithCoordinates に変更
      )
      .filter(isPoiWithCoordinates) // PoiWithCoordinates 型ガードを追加
      .map((poi: PoiWithCoordinates): Poi => ({ // PoiWithCoordinates から Poi への変換
        ...poi,
        location: { lat: parseFloat(poi.y ?? "0"), lng: parseFloat(poi.x ?? "0") },
      })) as Poi[]; // as Poi[] でキャスト
  };

  return { pois, isLoading, error };
};

