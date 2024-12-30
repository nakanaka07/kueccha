// hooks/useSheetData.ts
import { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import type { Poi, AreaType } from '../types';
import { AREAS } from '../types';
type LatLngLiteral = google.maps.LatLngLiteral;

console.log('useSheetData.ts: Hook initialization start');

export function useSheetData() {
  console.log('useSheetData.ts: Hook called');
  const [pois, setPois] = useState<Poi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasFetchedData = useRef(false); // データ取得状態を管理するRef

  console.log('useSheetData.ts: Initial state set', { isLoading, error });

  useEffect(() => {
    console.log('useSheetData.ts: Starting data fetch');

    if (hasFetchedData.current) {
      console.log('useSheetData.ts: Data already fetched, skipping.');
      return;
    }

    // 重複するcheckConfig関数を削除し、一度だけ呼び出す
    const checkConfig = () => {
      console.log('useSheetData.ts: Config check', {
        hasSpreadsheetId: !!CONFIG.sheets.spreadsheetId,
        hasApiKey: !!CONFIG.sheets.apiKey,
      });
    };

    checkConfig();

    const fetchData = async () => {
      try {
        console.log('useSheetData.ts: Fetch開始');

        console.group('useSheetData.ts: API Configuration');
        console.log('Spreadsheet ID:', CONFIG.sheets.spreadsheetId);
        console.log('API Key Status:', CONFIG.sheets.apiKey ? 'Present' : 'Missing');
        console.groupEnd();

        if (!CONFIG.sheets.spreadsheetId || !CONFIG.sheets.apiKey) {
          console.error('useSheetData.ts: Missing API configuration');
          const err = new Error('API configuration missing');
          setError(err);
          setIsLoading(false);
          return;
        }

        console.group('useSheetData.ts: Fetching Area Data');
        const areaPromises = Object.keys(AREAS).map(async (area) => {
          const areaName = AREAS[area as AreaType];
          console.log(`Fetching data for area: ${areaName}`);

          const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.sheets.spreadsheetId}/values/${areaName}!A:AY?key=${CONFIG.sheets.apiKey}`;
          console.log(`Request URL for ${area}:`, url);

          try {
            console.log(`Fetch start for ${areaName}`);
            const response = await fetch(url);
            console.log(`Response received for ${areaName}`);
            const data = await response.json();
            console.log(`Data parsed for ${areaName}`);

            // 重複するtry-catchと内部の処理を削除
            const values: string[][] | undefined = data.values;
            const processedPois = (values?.slice(1) || [])
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

            console.log(`Processed ${processedPois.length} POIs for ${area}`);
            return processedPois;
          } catch (err) {
            console.error(`Fetch error for ${areaName}:`, err);
            throw err; // エラーを再スロー
          }
        });

        console.groupEnd();

        console.group('useSheetData.ts: Processing Results');
        const poisArrays = await Promise.all(areaPromises);
        const allPois = poisArrays.flat();
        console.log('Total POIs before deduplication:', allPois.length);

        // 正しい型のPoi[]を返すmap関数を使用
        const uniquePois: Poi[] = Array.from(new Map(allPois.map((poi) => [poi.id, poi])).values());
        console.log('Unique POIs after deduplication:', uniquePois.length);
        setPois(uniquePois);
        console.groupEnd();

        console.log('useSheetData.ts: Fetch成功');
      } catch (err) {
        console.error('useSheetData.ts: Fetchエラー', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        console.log('useSheetData.ts: Fetch完了');
        setIsLoading(false);
      }
    };

    fetchData()
      .then(() => {
        hasFetchedData.current = true; // データ取得完了後にtrueを設定
      })
      .catch((error) => {
        console.error('useSheetData.ts: 未処理のエラー', error);
      });
  }, []);

  return { pois, isLoading, error };
}
