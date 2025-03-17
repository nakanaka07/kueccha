/**
 * 基本的な共通型定義ファイル
 * 
 * アプリケーション全体で再利用される基本的な型を定義します。
 * このファイルは他の型定義ファイルに依存しないようにします。
 */

// ============================================================================
// UI コンポーネント関連の基本型
// ============================================================================

/**
 * UI コンポーネントの基本となるプロパティ型
 * 多くのコンポーネントで共通して使用されるプロパティを定義します。
 */
export interface BaseProps {
  /** コンポーネントに適用するCSSクラス名 */
  className?: string;
  
  /** コンポーネントに適用するインラインスタイル */
  style?: React.CSSProperties;
  
  /** コンポーネントの子要素 */
  children?: React.ReactNode;
  
  /** コンポーネントの一意識別子 */
  id?: string;
  
  /** データテスト属性（テスト用） */
  'data-testid'?: string;
}

// ============================================================================
// データモデル関連の基本型
// ============================================================================

/**
 * 基本エンティティの型
 * データモデルの基礎となる共通プロパティを定義します。
 */
export interface BaseEntity {
  /** エンティティの一意識別子 */
  id: string;
}

/**
 * 拡張基本エンティティの型
 * 監査情報を含む拡張されたエンティティを定義します。
 */
export interface ExtendedBaseEntity extends BaseEntity {
  /** 作成日時 */
  createdAt: string | Date;
  
  /** 最終更新日時 */
  updatedAt: string | Date;
  
  /** 作成者ID */
  createdBy?: string;
  
  /** 最終更新者ID */
  updatedBy?: string;
}

// ============================================================================
// API通信関連の基本型
// ============================================================================

/**
 * APIレスポンスのエラー情報
 * API呼び出しで発生したエラーの標準構造を定義します。
 */
export interface BaseResponseError {
  /** エラーコード */
  code: string;
  
  /** エラーメッセージ */
  message: string;
  
  /** エラーの詳細情報（オプション） */
  details?: unknown;
  
  /** エラーの発生場所（オプション） */
  path?: string;
  
  /** エラーのタイムスタンプ */
  timestamp?: string | Date;
}

/**
 * 操作結果を表す共通型
 * API呼び出しや処理の成功/失敗を型安全に表現します。
 */
export type Result<T, E = BaseResponseError> = 
  | { success: true; data: T; metadata?: Record<string, unknown> }
  | { success: false; error: E };

// ============================================================================
// データ取得・操作関連の基本型
// ============================================================================

/**
 * ページネーションパラメータ
 * リスト取得APIなどで使用するページング情報を定義します。
 */
export interface PaginationParams {
  /** ページ番号（0または1から開始） */
  page: number;
  
  /** 1ページあたりの項目数 */
  pageSize: number;
  
  /** 並び替えフィールド */
  sortBy?: string;
  
  /** 昇順/降順の指定 */
  sortDirection?: 'asc' | 'desc';
}

/**
 * ページネーション結果のメタデータ
 * ページング処理の結果情報を定義します。
 */
export interface PaginationMeta {
  /** 現在のページ番号 */
  currentPage: number;
  
  /** 総ページ数 */
  totalPages: number;
  
  /** 総項目数 */
  totalItems: number;
  
  /** 1ページあたりの項目数 */
  pageSize: number;
  
  /** 次のページがあるかどうか */
  hasNextPage: boolean;
  
  /** 前のページがあるかどうか */
  hasPreviousPage: boolean;
}

/**
 * テンプレートパラメータ
 * 動的なテンプレート処理に使用するキー/値ペアを定義します。
 */
export interface TemplateParams {
  /** 任意のキーと値のペア */
  [key: string]: unknown;
}

/**
 * フィルタパラメータ
 * データ検索・フィルタリング時の条件を定義します。
 */
export interface FilterParams {
  /** フィルタ条件（キーとその値） */
  [key: string]: string | number | boolean | null | Array<string | number>;
}

// ============================================================================
// ユーティリティ型
// ============================================================================

/**
 * 特定のプロパティを必須にする型ヘルパー
 */
export type RequiredProps<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

/**
 * 特定のプロパティをnullableにする型ヘルパー
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};