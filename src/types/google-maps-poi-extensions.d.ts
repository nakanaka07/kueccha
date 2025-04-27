/**
 * Google Maps API 拡張型定義（2025年対応）
 *
 * Google Mapsの最新機能（2025年対応）に関する型定義拡張です。
 * マーカーの拡張機能とPointOfInterest表示に関連する型を定義しています。
 *
 * @version 1.4.0
 * @since 1.4.0
 * @see {@link ../../docs/google_maps_guidelines/03_markers.md マーカーガイドライン}
 * @see {@link ../../docs/google_maps_guidelines/10_sado_optimization.md 佐渡島固有の最適化}
 */

/**
 * マーカー衝突時の振る舞いを定義する型
 */
export type CollisionBehavior = 'REQUIRED' | 'OPTIONAL' | 'OPTIONAL_AND_HIDES_LOWER_PRIORITY';

/**
 * Google Mapsのマーカー名前空間の拡張
 */
declare namespace google.maps {
  namespace marker {
    /**
     * 高度なマーカー要素のオプション（2025年対応）
     */
    interface AdvancedMarkerElementOptions {
      /**
       * マーカークリック可能性を設定（2025年新機能）
       * @default true - デフォルトでクリック可能
       */
      gmpClickable?: boolean;

      /**
       * マーカードラッグ可能性を設定（2025年新機能）
       * @default false - デフォルトでドラッグ不可
       */
      gmpDraggable?: boolean;

      /**
       * マーカー衝突時の振る舞い（2025年新機能）
       * - REQUIRED: 常に表示
       * - OPTIONAL: マップの状況に応じて表示/非表示
       * - OPTIONAL_AND_HIDES_LOWER_PRIORITY: 優先度が低いマーカーは非表示
       * @default 'OPTIONAL' - デフォルトではマップの状況に応じて表示/非表示
       */
      collisionBehavior?: CollisionBehavior;
    }
  }
}

/**
 * @deprecated このファイル内のPointOfInterest拡張は非推奨です。
 * 代わりに @/types/poi-extensions.d.ts をインポートして使用してください。
 *
 * このブロックは後方互換性のために2025年8月まで維持されます。
 * 影響を受ける依存関係:
 * - MapMarkers.tsx
 * - InfoWindowSections.tsx
 */
