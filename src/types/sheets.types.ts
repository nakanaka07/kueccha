/**
 * Google Sheets関連の型定義ファイル
 *
 * このファイルでは、Google Sheets APIとの連携に必要な型定義を提供します。
 * スプレッドシートからのデータ取得、データの構造化、エラー処理に
 * 関連する型を含みます。
 *
 * @see base.types.ts - 基本的なレスポンス型の定義
 * @see config.types.ts - アプリケーション設定に関連する型定義
 */

import type { BaseResponseError, Result } from './base.types';
import type { PaginationMeta } from './base.types';

// ============================================================================
// 基本データ型
// ============================================================================

/**
 * シート内のセルの値を表す型
 * スプレッドシートのセルに格納できる値の型
 */
export type SheetCellValue = string | number | boolean | null | undefined;

/**
 * スプレッドシート行データの型定義
 * 行全体（複数のセル）を表す配列
 */
export type SheetRow = readonly SheetCellValue[];

/**
 * シート列定義タイプ
 * 列を指定する方法として数値インデックスまたは特殊識別子を使用
 */
export type SheetColumnIdentifier = number | string;

/**
 * データ処理タイプ
 * セルの値をどのようなデータ型として解釈するかを指定
 */
export type SheetDataProcessingType = 'string' | 'number' | 'boolean' | 'date' | 'json';

// ============================================================================
// 設定関連型
// ============================================================================

/**
 * 個別のシート設定オブジェクト
 * スプレッドシート内の特定のシートにアクセスするための設定
 */
export interface SheetConfig {
  name: string; // シート名
  range: string; // データ範囲（A1表記、例: 'A1:Z100'）
  primaryKey?: string; // データの主キーとなる列名（一意性が保証される列）
  isKeyValue?: boolean; // キー・バリュー形式のデータとして処理するか
  columnDefinitions?: Record<string, SheetColumnIdentifier>; // 列名と列インデックスのマッピング
}

/**
 * Google Sheets APIの設定パラメータ
 * アプリケーションからGoogle Sheets APIにアクセスするための設定
 */
export interface SheetsConfig {
  apiKey: string; // Google Sheets API アクセスキー
  spreadsheetId: string; // データ取得元のスプレッドシートID
  apiBaseUrl?: string; // API エンドポイントのベースURL (デフォルト: https://sheets.googleapis.com)
  cacheDuration: number; // キャッシュの有効期間（秒）
  sheets?: SheetConfig[]; // 取得対象のシート設定配列
  maxRetries?: number; // リクエスト失敗時の最大再試行回数
  retryDelay?: number; // 再試行間の待機時間（ミリ秒）
  timeout?: number; // リクエストタイムアウト（ミリ秒）
}

// ============================================================================
// リクエスト関連型
// ============================================================================

/**
 * シートのデータ範囲を指定する型
 * シート内の特定のデータ範囲を取得するためのパラメータ
 */
export interface SheetRange {
  sheetName: string; // シート名
  range: string; // 取得する範囲（A1表記、例: 'A1:D10'）
  includeHeaders?: boolean; // ヘッダー行を含むかどうか
}

/**
 * データ取得リクエストのオプション
 * API呼び出し時のカスタム動作を指定するオプション
 */
export interface SheetsRequestOptions {
  useCache?: boolean; // キャッシュを使用するか
  timeout?: number; // リクエストタイムアウト（ミリ秒）
  retries?: number; // リクエスト失敗時のリトライ回数
  valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA'; // 値の形式
  dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING'; // 日付と時刻の形式
}

// ============================================================================
// レスポンスとエラー処理関連型
// ============================================================================

/**
 * Sheets APIのエラー情報
 * API呼び出し時に発生したエラーの詳細情報
 */
export interface SheetsError extends BaseResponseError {
  code: string; // エラーコード（例: 'NOT_FOUND', 'PERMISSION_DENIED'）
  message: string; // 人間が読めるエラーメッセージ
  details?: unknown; // エラーの詳細情報（APIによって異なる形式）
  sheetId?: string; // エラーが発生したシートID（該当する場合）
  range?: string; // エラーが発生したセル範囲（該当する場合）
}

/**
 * Sheetsからのレスポンス型
 * スプレッドシートから取得したデータと関連メタデータを含む
 *
 * @template T 取得したデータの型
 */
export interface SheetsResponse<T> {
  data: T[]; // 取得したデータ配列
  status: 'success' | 'error'; // データ取得時のステータス
  error?: SheetsError; // エラー情報（エラー時のみ）
  meta?: {
    timestamp: Date; // 取得日時
    rowCount: number; // 行数
    source: SheetRange; // ソース情報
    cachedResult?: boolean; // キャッシュから取得されたかどうか
  };
}

/**
 * ページネーション対応のレスポンス型
 * SheetsResponseを拡張し、ページネーション情報を追加
 *
 * @template T 取得したデータの型
 *
 * @see base.types.ts の PaginationMeta 型と整合
 */
export interface SheetsPaginatedResponse<T> extends SheetsResponse<T> {
  hasNextPage: boolean; // 次ページが存在するか
  pagination: PaginationMeta; // ページネーション情報
}

// ============================================================================
// ユーティリティ型
// ============================================================================

/**
 * シート行から構造化データを作成するトランスフォーマー関数の型
 *
 * @template T 変換後のデータ型
 */
export type SheetRowTransformer<T> = (row: SheetRow, headers?: string[]) => T;

/**
 * シートデータのデータソースインターフェース
 * データソース抽象化パターンに従ったデータ取得インターフェース
 *
 * @template T 取得するデータの型
 */
export interface SheetDataSource<T> {
  getAll(): Promise<Result<T[]>>;
  getByKey(key: string, value: string | number): Promise<Result<T | null>>;
  query(criteria: Record<string, any>): Promise<Result<T[]>>;
  getWithPagination(
    page: number,
    pageSize: number,
  ): Promise<Result<{ data: T[]; meta: PaginationMeta }>>;
}
