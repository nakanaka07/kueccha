// hooks/useSheetData.ts
import { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import type { Poi, AreaType } from '../types';
import { AREAS } from '../types';
type LatLngLiteral = google.maps.LatLngLiteral;

export function useSheetData() {
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('isLoading:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log('Error:', error);
  }, [error]);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Spreadsheet ID:', CONFIG.sheets.spreadsheetId); // 追記
      console.log('API Key:', CONFIG.sheets.apiKey); // 追記

      if (!CONFIG.sheets.spreadsheetId || !CONFIG.sheets.apiKey) {
        const err = new Error('API configuration missing');
        console.error('Error fetching data:', err);
        setError(err);
        setIsLoading(false);
        return;
      }

      try {
        const areaPromises = Object.keys(AREAS).map(async (area) => {
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.sheets.spreadsheetId}/values/${AREAS[area as AreaType]}!A:AY?key=${CONFIG.sheets.apiKey}`;
          console.log('Fetching URL:', url); // この行を追加
          const response = await fetch(url);

          if (!response.ok) {
            const err = new Error(`API error: ${response.status} ${response.statusText}`); // ステータスコードだけでなく、ステータステキストもエラーメッセージに含める
            console.error('Error fetching data:', err, url); // エラーが発生したURLも出力
            throw err;
          }

          const data = await response.json();
          console.log('Fetched Data for', area, ':', data); // エリアごとにデータを確認

          const values: string[][] | undefined = data.values;

          return (values?.slice(1) || [])
            .filter((row) => row[49] && row[43])
            .map(
              (row): Poi => ({
                id: String(row[49]),
                name: String(row[43]),
                area: area as AreaType,
                location: {
                  lat: Number(row[47]),
                  lng: Number(row[46]),
                } as LatLngLiteral,
                category: row[26],
                genre: row[27],
                description: row[36],
                reservation: row[37],
                payment: row[38],
                phone: row[39],
                address: row[40],
                information: row[41],
                view: row[42],
                monday: row[28],
                tuesday: row[29],
                wednesday: row[30],
                thursday: row[31],
                friday: row[32],
                saturday: row[33],
                sunday: row[34],
                holiday: row[35],
              }),
            );
        });

        const poisArrays = await Promise.all(areaPromises);
        const allPois = poisArrays.flat();

        const uniquePois = Array.from(new Map(allPois.map((poi) => [poi.id, poi])).values());
        setPois(uniquePois);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('Unknown error occurred'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log('Pois updated:', pois);
  }, [pois]);

  return { pois, isLoading, error };
}
