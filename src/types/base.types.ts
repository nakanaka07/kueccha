/**
 * 基本的な共通型定義ファイル
 *
 * このファイルはアプリケーション全体で再利用される基本的な型を定義します。
 * 状態管理、UIコンポーネント、エンティティモデル、API応答、ページネーション、検索などの
 * 共通型が含まれています。
 *
 * 注意: このファイルは他のファイルへの依存を持たないように設計されています。
 * 他の型定義ファイルからはインポートされますが、自身は他の型定義をインポートしません。
 */

// ============================================================================
// 状態管理関連の型
// ============================================================================

/**
 * 状態更新関数の共通型
 */
export type StateUpdater<T> = T | ((prev: T) => T);

// ============================================================================
// UI関連の基本型
// ============================================================================

/**
 * UI コンポーネントの基本プロパティ型
 */
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

/**
 * 寸法を持つUI要素の基本型
 * マップ、コンテナ、画像など様々な要素で再利用可能
 */
export interface Dimensions {
  width: string | number;
  height: string | number;
}

/**
 * スタイル付きUIコンポーネントの基本プロパティ
 * Dimensionsを継承し、追加のスタイル定義を許可
 */
export interface StyledComponentProps extends Dimensions {
  additionalStyles?: React.CSSProperties;
}

/**
 * 位置情報を持つUI要素の基本型
 */
export interface PositionedElementProps {
  position:
    | {
        x: number;
        y: number;
      }
    | {
        top?: number | string;
        left?: number | string;
        bottom?: number | string;
        right?: number | string;
      };
  zIndex?: number;
}

/**
 * アニメーション設定の基本型
 */
export interface AnimationOptions {
  /** アニメーション時間（ミリ秒） */
  duration?: number;

  /** 開始遅延（ミリ秒） */
  delay?: number;

  /** イージング関数 */
  easing?: string;

  /** フェードイン効果を適用 */
  fadeIn?: boolean;

  /** フェードアウト効果を適用 */
  fadeOut?: boolean;

  /** スライドイン方向 */
  slideIn?: 'top' | 'bottom' | 'left' | 'right';

  /** スライドアウト方向 */
  slideOut?: 'top' | 'bottom' | 'left' | 'right';
}

// ============================================================================
// エンティティとデータモデル基本型
// ============================================================================

/**
 * 基本エンティティの型
 */
export interface BaseEntity {
  id: string;
}

/**
 * 監査情報を含む拡張エンティティ型
 */
export interface ExtendedBaseEntity extends BaseEntity {
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// API応答と結果ハンドリング型
// ============================================================================

/**
 * APIレスポンスのエラー情報
 */
export interface BaseResponseError {
  code: string;
  message: string;
  details?: unknown;
  path?: string;
  timestamp?: string | Date;
}

/**
 * 地図関連のエラー型
 * ベースエラーを拡張し、地図固有のプロパティを追加
 */
export interface MapError extends BaseResponseError {
  mapInstance?: unknown;
  errorType: 'LOAD' | 'RENDER' | 'PERMISSION' | 'API' | 'OTHER';
}

/**
 * API通信関連のエラー型
 */
export interface ApiError extends BaseResponseError {
  statusCode?: number;
  endpoint?: string;
  requestId?: string;
}

/**
 * 操作結果を表す共通型
 */
export type Result<T, E = BaseResponseError> =
  | { success: true; data: T; metadata?: Record<string, unknown> }
  | { success: false; error: E };

// ============================================================================
// ページネーションと検索関連型
// ============================================================================

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * ページネーション結果のメタデータ
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * フィルタパラメータ
 */
export interface FilterParams {
  [key: string]: string | number | boolean | null | Array<string | number>;
}

/**
 * 検索パラメータの共通インターフェース
 */
export interface SearchParams {
  query?: string; // 検索クエリ文字列
  limit?: number; // 結果の最大数
  offset?: number; // 結果の開始オフセット
  minRelevance?: number; // 最小関連性スコア (0-100)
  sortBy?: string; // 並び替えフィールド
  sortDirection?: 'asc' | 'desc'; // 並び順
}

/**
 * 検索結果アイテムの基本構造
 */
export interface SearchResult<T> {
  item: T; // 検索結果のアイテム
  relevance: number; // 関連性スコア (0-100)
  matchedFields: string[]; // マッチしたフィールド名
}

/**
 * 基本的なフィルタパラメータの拡張（エリア用）
 *
 * 注: AreaTypeは文字列型として扱い、実際の型はimportするファイルで指定
 */
export interface AreaFilterParams extends FilterParams {
  areas?: string[]; // エリアでフィルタリング
}

// ============================================================================
// 型ユーティリティ
// ============================================================================

/**
 * オブジェクト型の指定プロパティを必須にする型
 */
export type RequiredProps<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * オブジェクト型のすべてのプロパティにnullを許容する型
 */
export type Nullable<T> = { [P in keyof T]: T[P] | null };

/**
 * 寸法プロパティを必須にする型
 */
export type WithDimensions<T> = T & Dimensions;

/**
 * スタイルプロパティを持つコンポーネント型
 */
export type StyledComponent<T> = T & StyledComponentProps;

/**
 * Result型を扱うユーティリティ関数
 */
export const ResultUtils = {
  success<T>(data: T, metadata?: Record<string, unknown>): Result<T> {
    return { success: true, data, metadata };
  },

  fail<T, E = BaseResponseError>(error: E): Result<T, E> {
    return { success: false, error };
  },

  isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true;
  },

  unwrap<T, E>(result: Result<T, E>): T {
    if (!result.success) {
      throw new Error('Result is not successful');
    }
    return result.data;
  },
};
