/**
 * Google Sheets関連の型定義ファイル
 */

import type { BaseResponseError } from './base.types';

/**
 * シート内のデータ型
 */
export type SheetCellValue = string | number | boolean | null | undefined;

/**
 * スプレッドシート行データの型定義
 */
export type SheetRow = readonly SheetCellValue[];

/**
 * シート列定義タイプ (数値: 列インデックス、文字列: 特殊列識別子)
 */
export type SheetColumnIdentifier = number | string;

/**
 * データ処理タイプ
 */
export type DataProcessingType = 'string' | 'number' | 'boolean' | 'date' | 'json';

/**
 * シート設定オブジェクト
 */
export interface SheetConfig {
  name: string; // シート名
  range: string; // データ範囲（A1表記）
  primaryKey?: string; // データの主キーとなる列名
  isKeyValue?: boolean; // キー・バリュー形式のデータとして処理するか
}

/**
 * Google Sheets APIの設定パラメータ
 */
export interface SheetsConfig {
  apiKey: string; // API アクセスキー
  spreadsheetId: string; // データ取得元のスプレッドシートID
  apiBaseUrl?: string; // API エンドポイントのベースURL
  cacheDuration: number; // キャッシュの有効期間（秒）
  sheets?: SheetConfig[]; // 取得対象のシート設定配列
  maxRetries?: number; // リクエスト失敗時の最大再試行回数
  retryDelay?: number; // 再試行間の待機時間（ミリ秒）
}

/**
 * シートのデータ範囲を指定する型
 */
export interface SheetRange {
  sheetName: string; // シート名
  range: string; // 取得する範囲（A1表記）
  includeHeaders?: boolean; // ヘッダー行を含むかどうか
}

/**
 * データ取得リクエストのオプション
 */
export interface SheetsRequestOptions {
  useCache?: boolean; // キャッシュを使用するか
  timeout?: number; // リクエストタイムアウト（ミリ秒）
  retries?: number; // リクエスト失敗時のリトライ回数
  valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA'; // 値の形式
}

/**
 * Sheets APIのエラー情報
 */
export interface SheetsError extends BaseResponseError {
  code: string; // エラーコード
  message: string; // エラーメッセージ
  details?: unknown; // 詳細情報
}

/**
 * Sheetsからのレスポンス型
 */
export interface SheetsResponse<T> {
  data: T[]; // 取得したデータ配列
  status: 'success' | 'error'; // データ取得時のステータス
  error?: SheetsError; // エラー情報（エラー時のみ）
  meta?: {
    timestamp: Date; // 取得日時
    rowCount: number; // 行数
    source: SheetRange; // ソース情報
  };
}

/**
 * ページネーション対応のレスポンス型
 */
export interface SheetsPaginatedResponse<T> extends SheetsResponse<T> {
  hasNextPage: boolean; // 次ページが存在するか
  pagination: {
    page: number; // 現在のページ番号
    pageSize: number; // ページあたりのアイテム数
    totalPages: number; // 総ページ数
    totalItems: number; // 総アイテム数
  };
}