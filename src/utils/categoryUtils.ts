import { logger } from '@/utils/logger';
import { ENV } from '@/utils/env';

/**
 * カテゴリー定義
 * アプリケーション全体で一貫したカテゴリー情報を管理するオブジェクト
 */
export const CATEGORIES = {
  JAPANESE: {
    id: '和食' as const,
    displayName: '和食',
    className: 'category-badge japanese',
  },
  WESTERN: {
    id: '洋食' as const,
    displayName: '洋食',
    className: 'category-badge western',
  },
  OTHER: {
    id: 'その他' as const,
    displayName: 'その他',
    className: 'category-badge other',
  },
  RETAIL: {
    id: '販売' as const,
    displayName: '販売',
    className: 'category-badge retail',
  },
} as const;

// カテゴリーIDの配列（型安全な参照用）
export const CATEGORY_IDS = Object.values(CATEGORIES).map(cat => cat.id);

/**
 * カテゴリーID型定義
 */
export type CategoryType = (typeof CATEGORIES)[keyof typeof CATEGORIES]['id'];

/**
 * カテゴリーがサポートされているかどうかをチェックする関数
 * CategoryType型に含まれるカテゴリであるかを判定します
 *
 * @param category - チェック対象のカテゴリー文字列
 * @returns CategoryType型に含まれる場合はtrue、そうでない場合はfalse
 */
export const isSupportedCategory = (category: string): category is CategoryType => {
  return CATEGORY_IDS.includes(category as CategoryType);
};

/**
 * カテゴリーバッジのクラス決定関数
 * カテゴリー名に基づいて適切なCSSクラスを返します
 *
 * @param category - POIのカテゴリー名
 * @returns 適用すべきCSSクラス名
 */
export const getCategoryClass = (category: CategoryType): string => {
  // 開発環境でのみデバッグログを出力
  if (ENV?.env?.isDev) {
    logger.debug('カテゴリークラスを取得', {
      category,
      component: 'categoryUtils',
    });
  }

  // カテゴリーに対応するエントリーを検索
  const categoryEntry = Object.values(CATEGORIES).find(c => c.id === category);

  if (categoryEntry) {
    return categoryEntry.className;
  }

  // 一致するカテゴリーが見つからない場合
  logger.warn('未定義のカテゴリー', {
    category,
    component: 'categoryUtils',
    validCategories: CATEGORY_IDS,
  });
  return 'category-badge';
};

/**
 * カテゴリー表示名取得関数
 * 内部カテゴリー値から表示用の名称を返します
 *
 * @param category - POIのカテゴリー名
 * @returns 表示用カテゴリー名
 */
export const getCategoryDisplayName = (category: CategoryType): string => {
  const categoryEntry = Object.values(CATEGORIES).find(c => c.id === category);
  return categoryEntry?.displayName || category;
};
