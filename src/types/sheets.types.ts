/**
 * Google Sheets関連の型定義ファイル
 * 
 * Google Sheetsからデータを取得するために必要な型を定義します。
 * シートの設定、リクエスト、レスポンス形式に関する型が含まれています。
 */

import { BaseResponseError } from './base.types';

// ============================================================================
// 基本型定義
// ============================================================================

/**
 * シート内のデータ型
 */
export type SheetCellValue = string | number | boolean | null | undefined;

/**
 * スプレッドシート行データの型定義
 */
export type SheetRow = readonly SheetCellValue[];

/**
 * シート列定義タイプ
 * 数値: 実際の列インデックス（1始まり）
 * 文字列: 特殊処理が必要な列の識別子
 */
export type SheetColumnIdentifier = number | string;

/**
 * データ処理タイプ
 */
export type DataProcessingType = 'string' | 'number' | 'boolean' | 'date' | 'json';

// ============================================================================
// 設定と認証
// ============================================================================

/**
 * シート設定オブジェクト
 * 個別のシートとその取得範囲の設定を定義します
 */
export interface SheetConfig {
  /** シート名 */
  name: string;
  
  /** データ範囲（A1表記） */
  range: string;
  
  /** データの主キーとなる列名（オプション） */
  primaryKey?: string;
  
  /** キー・バリュー形式のデータとして処理するか（オプション） */
  isKeyValue?: boolean;
}

/**
 * Google Sheets APIの設定パラメータ
 */
export interface SheetsConfig {
  /** API アクセスキー */
  apiKey: string;
  
  /** データ取得元のスプレッドシートID */
  spreadsheetId: string;
  
  /** API エンドポイントのベースURL (オプション) */
  apiBaseUrl?: string;
  
  /**
   * キャッシュの有効期間（秒）
   * データをローカルにキャッシュする期間を指定します
   */
  cacheDuration: number;
  
  /** 取得対象のシート設定配列 */
  sheets?: SheetConfig[];
  
  /** リクエスト失敗時の最大再試行回数 */
  maxRetries?: number;
  
  /** 再試行間の待機時間（ミリ秒） */
  retryDelay?: number;
}

// ============================================================================
// リクエストと範囲指定
// ============================================================================

/**
 * シートのデータ範囲を指定する型
 */
export interface SheetRange {
  /** シート名 */
  sheetName: string;
  
  /** 取得する範囲（A1表記） */
  range: string;
  
  /** ヘッダー行を含むかどうか */
  includeHeaders?: boolean;
}

/**
 * データ取得リクエストのオプション
 */
export interface SheetsRequestOptions {
  /** キャッシュを使用するか */
  useCache?: boolean;
  
  /** リクエストタイムアウト（ミリ秒） */
  timeout?: number;
  
  /** リクエスト失敗時のリトライ回数 */
  retries?: number;
  
  /** 値の形式（フォーマット済み/未加工） */
  valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
}

// ============================================================================
// レスポンス型
// ============================================================================

/**
 * Sheets APIのエラー情報
 */
export interface SheetsError extends BaseResponseError {
  /** エラーコード */
  code: string;
  
  /** エラーメッセージ */
  message: string;
  
  /** 詳細情報 */
  details?: unknown;
}

/**
 * Sheetsからのレスポンス型
 */
export interface SheetsResponse<T> {
  /** 取得したデータ配列 */
  data: T[];
  
  /** データ取得時のステータス */
  status: 'success' | 'error';
  
  /** エラー情報（エラー時のみ） */
  error?: SheetsError;
  
  /** メタデータ */
  meta?: {
    /** 取得日時 */
    timestamp: Date;
    
    /** 行数 */
    rowCount: number;
    
    /** ソース情報 */
    source: SheetRange;
  };
}

/**
 * ページネーション対応のレスポンス型
 */
export interface SheetsPaginatedResponse<T> extends SheetsResponse<T> {
  /** 次ページが存在するか */
  hasNextPage: boolean;
  
  /** ページング情報 */
  pagination: {
    /** 現在のページ番号 */
    page: number;
    
    /** ページあたりのアイテム数 */
    pageSize: number;
    
    /** 総ページ数 */
    totalPages: number;
    
    /** 総アイテム数 */
    totalItems: number;
  };
}