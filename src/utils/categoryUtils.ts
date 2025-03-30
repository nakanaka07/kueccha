import { logger } from '@/utils/logger';

/**
 * カテゴリー定義
 * アプリケーション全体で一貫したカテゴリー名を使用するための定数
 */
export const CATEGORIES = {
  JAPANESE: '和食' as const,
  WESTERN: '洋食' as const,
  OTHER: 'その他' as const,
  RETAIL: '販売' as const,
} as const;

/**
 * カテゴリータイプ定義
 * サポートされているカテゴリーの型
 */
export type CategoryType = (typeof CATEGORIES)[keyof typeof CATEGORIES];

/**
 * カテゴリーバッジのクラス決定関数
 * カテゴリー名に基づいて適切なCSSクラスを返します
 *
 * @param category - POIのカテゴリー名
 * @returns 適用すべきCSSクラス名
 */
export const getCategoryClass = (category: string): string => {
  logger.debug('カテゴリークラスを取得', { category });

  switch (category) {
    case CATEGORIES.JAPANESE:
      return 'category-badge japanese';
    case CATEGORIES.WESTERN:
      return 'category-badge western';
    case CATEGORIES.OTHER:
      return 'category-badge other';
    case CATEGORIES.RETAIL:
      return 'category-badge retail';
    default:
      logger.warn('未定義のカテゴリー', { category });
      return 'category-badge';
  }
};

/**
 * カテゴリー表示名取得関数
 * 内部カテゴリー値から表示用の名称を返します
 *
 * @param category - POIのカテゴリー名
 * @returns 表示用カテゴリー名
 */
export const getCategoryDisplayName = (category: CategoryType): string => {
  // そのままカテゴリー名を返す（将来的に表示名とコード値が異なる場合に対応可能）
  return category;
};
