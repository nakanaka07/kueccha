/**
 * 基本的な共通型定義ファイル
 * アプリケーション全体で再利用される基本的な型を定義します。
 */

/**
 * UI コンポーネントの基本プロパティ型
 */
export interface BaseProps {
  className?: string;      // CSSクラス名
  style?: React.CSSProperties; // インラインスタイル
  children?: React.ReactNode;  // 子要素
  id?: string;             // 一意識別子
  'data-testid'?: string;  // テスト用属性
}

/**
 * 基本エンティティの型
 */
export interface BaseEntity {
  id: string;              // エンティティの識別子
}

/**
 * 監査情報を含む拡張エンティティ型
 */
export interface ExtendedBaseEntity extends BaseEntity {
  createdAt: string | Date;  // 作成日時
  updatedAt: string | Date;  // 更新日時
  createdBy?: string;      // 作成者ID
  updatedBy?: string;      // 更新者ID
}

/**
 * APIレスポンスのエラー情報
 */
export interface BaseResponseError {
  code: string;            // エラーコード
  message: string;         // エラーメッセージ
  details?: unknown;       // 詳細情報
  path?: string;           // エラー発生場所
  timestamp?: string | Date; // タイムスタンプ
}

/**
 * 操作結果を表す共通型
 */
export type Result<T, E = BaseResponseError> =
  | { success: true; data: T; metadata?: Record<string, unknown> }
  | { success: false; error: E };

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  page: number;            // ページ番号
  pageSize: number;        // 1ページの項目数
  sortBy?: string;         // 並び替えフィールド
  sortDirection?: 'asc' | 'desc'; // 並び順
}

/**
 * ページネーション結果のメタデータ
 */
export interface PaginationMeta {
  currentPage: number;     // 現在のページ
  totalPages: number;      // 総ページ数
  totalItems: number;      // 総項目数
  pageSize: number;        // ページサイズ
  hasNextPage: boolean;    // 次ページ有無
  hasPreviousPage: boolean; // 前ページ有無
}

/**
 * フィルタパラメータ
 */
export interface FilterParams {
  [key: string]: string | number | boolean | null | Array<string | number>;
}

/**
 * ユーティリティ型
 */
export type RequiredProps<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type Nullable<T> = { [P in keyof T]: T[P] | null };