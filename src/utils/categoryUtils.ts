/**
 * カテゴリーバッジのクラス決定関数
 * カテゴリー名に基づいて適切なCSSクラスを返します
 */
export const getCategoryClass = (category: string): string => {
  switch (category) {
    case '和食':
      return 'category-badge japanese';
    case '洋食':
      return 'category-badge western';
    case 'その他':
      return 'category-badge other';
    case '販売':
      return 'category-badge retail';
    default:
      return 'category-badge';
  }
};