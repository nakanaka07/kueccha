import { useEffect, useState } from "react";
import { Poi } from "./types.js";
import { nanoid } from "nanoid";


// スプレッドシートID、APIキーは環境変数から取得
const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

export const usePoiData = (sheetName: string) => {
  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
        // 環境変数のチェック
        if (!spreadsheetId || !apiKey) {
            setError("Spreadsheet ID or API Key is missing.");
            setLoading(false);
            return;
        }

    const loadData = async () => {
      try {
                const response = await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A:AY?key=${apiKey}`
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

                const poiData = data.values.slice(1).map((row: any[]) => {
                    const lat = parseFloat(row[47]);
                    const lng = parseFloat(row[46]);

                    return {
                        key: nanoid(),
                        location: { lat: isNaN(lat) ? 0 : lat, lng: isNaN(lng) ? 0 : lng },
                        name: row[43] ?? "",
                        category: row[26] ?? "",
                        genre: row[27] ?? "",
                        monday: row[28] ?? "",
                        tuesday: row[29] ?? "",
                        wednesday: row[30] ?? "",
                        thursday: row[31] ?? "",
                        friday: row[32] ?? "",
                        saturday: row[33] ?? "",
                        sunday: row[34] ?? "",
                        holiday: row[35] ?? "",
                        description: row[36] ?? "",
                        reservation: row[37] ?? "",
                        payment: row[38] ?? "",
                        phone: row[39] ?? "",
                        address: row[40] ?? "",
                        information: row[41] ?? "",
                        view: row[42] ?? "",
                    };
                });

                setPois(poiData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
        console.error("スプレッドシートデータの取得中にエラーが発生しました:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sheetName]);

  return { pois, loading, error };
};
