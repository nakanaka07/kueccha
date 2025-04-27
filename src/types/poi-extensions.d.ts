/**
 * PointOfInterest型の拡張定義
 *
 * Google Maps マーカー表示に関する拡張プロパティを提供します。
 * これらのプロパティを使うことで、マーカーの視覚的な表現をカスタマイズできます。
 *
 * @version 1.4.0
 * @since 1.4.0 - 2025年4月追加
 * @see {@link ../../docs/google_maps_guidelines/03_markers.md マーカーガイドライン}
 */

declare module '@/types/poi-types' {
  interface PointOfInterest {
    /**
     * POIの優先度フラグ - マーカー表示時の優先度に影響
     */
    isPriority?: boolean;

    /**
     * 推奨POIフラグ - 特別な装飾を適用
     */
    isRecommended?: boolean;

    /**
     * 特殊POIフラグ - マーカー形状に影響
     */
    isSpecial?: boolean;

    /**
     * マーカーの色 - カスタムカラー設定
     */
    markerColor?: string;

    /**
     * グリフ（マーカー内のアイコン）
     */
    glyph?: string;

    /**
     * グリフの色
     */
    glyphColor?: string;
  }
}
