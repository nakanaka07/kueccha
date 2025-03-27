import { POIType } from '@/types/poi';
import { ENV, logger } from '@/utils/env';

import { parseCSVtoPOIs } from './csvProcessor';

/**
 * シートデータの型定義
 */
interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * Google Sheets APIレスポンスの型定義
 */
interface SheetsResponse {
  spreadsheetId: string;
  valueRanges: SheetData[];
}

/**
 * Google Sheets APIからデータを取得する
 * @param sheetRanges 取得するシート範囲の配列
 * @returns シートデータの配列
 */
export async function fetchFromGoogleSheets(sheetRanges: string[]): Promise<SheetData[]> {
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

    // 明示的な型アサーションでany型の使用を回避
    const data = (await response.json()) as SheetsResponse;
    return data.valueRanges;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Google Sheets APIエラー: ${errorMessage}`);
    throw error;
  }
}

/**
 * スプレッドシート値から2次元配列をCSV文字列に変換
 * @param values 変換する2次元配列
 * @returns CSV形式の文字列
 */
export function convertValuesToCSV(values: string[][]): string {
  if (values.length === 0) return '';

  return values
    .map(row =>
      row
        .map(cell => {
          // カンマを含むセルは引用符で囲む
          // nullとundefinedを処理し、空文字列にフォールバック
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
 * @returns POIデータの配列
 */
export async function fetchPOIsFromSheet(poiType: POIType, sheetRange: string) {
  try {
    const sheetData = await fetchFromGoogleSheets([sheetRange]);

    // values が存在しない、または空の配列の場合にエラー
    if (!sheetData[0]?.values?.length) {
      throw new Error('シートにデータがありません');
    }

    const csvString = convertValuesToCSV(sheetData[0].values);
    return parseCSVtoPOIs(csvString, poiType);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`${poiType}データの取得に失敗: ${errorMessage}`);
    return [];
  }
}
