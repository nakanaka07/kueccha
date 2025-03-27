import { POIType } from '@/types/poi';
import { ENV } from '@/utils/env';


import { parseCSVtoPOIs } from './csvProcessor';

interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

interface SheetsResponse {
  spreadsheetId: string;
  valueRanges: SheetData[];
}

/**
 * Google Sheets APIからデータを取得する
 * @param sheetRanges 取得するシート範囲の配列
 * @returns
 */
export async function fetchFromGoogleSheets(sheetRanges: string[]) {
  const API_KEY = ENV.google.API_KEY;
  const SPREADSHEET_ID = ENV.google.SPREADSHEET_ID;

  if (!API_KEY || !SPREADSHEET_ID) {
    throw new Error('Google Sheets APIキーまたはスプレッドシートIDが設定されていません');
  }

  // 複数のシート範囲をURLパラメータに変換
  const ranges = sheetRanges.map(range => `ranges=${encodeURIComponent(range)}`).join('&');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${ranges}&key=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API応答エラー: ${response.statusText}`);
    }

    const data: SheetsResponse = await response.json();
    return data.valueRanges;
  } catch (error) {
    console.error('Google Sheets APIエラー:', error);
    throw error;
  }
}

/**
 * スプレッドシート値から2次元配列をCSV文字列に変換
 */
export function convertValuesToCSV(values: string[][]): string {
  if (!values || values.length === 0) return '';

  return values
    .map(row =>
      row
        .map(cell => {
          // カンマを含むセルは引用符で囲む
          if (cell && cell.includes(',')) {
            return `"${cell}"`;
          }
          return cell || '';
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Google SheetsからPOIデータを取得する
 * @param poiType POIの種類
 * @param sheetRange シート範囲（例: 'レストラン!A1:Z1000'）
 */
export async function fetchPOIsFromSheet(poiType: POIType, sheetRange: string) {
  try {
    const sheetData = await fetchFromGoogleSheets([sheetRange]);

    if (!sheetData[0].values || sheetData[0].values.length === 0) {
      throw new Error('シートにデータがありません');
    }

    const csvString = convertValuesToCSV(sheetData[0].values);
    return parseCSVtoPOIs(csvString, poiType);
  } catch (error) {
    console.error(`${poiType}データの取得に失敗:`, error);
    return [];
  }
}
