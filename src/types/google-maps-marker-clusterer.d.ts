/**
 * Google Maps API マーカークラスタリング拡張型定義
 *
 * マーカーのグループ化（クラスタリング）機能を提供するGoogle Maps拡張機能の型定義です。
 * この型定義により、複数のマーカーを効率的にグループ化して表示することができます。
 *
 * @version 1.4.0
 * @since 1.2.0
 * @see {@link ../../docs/google_maps_guidelines/04_clustering.md クラスタリングガイドライン}
 */

declare namespace google {
  namespace maps {
    /**
     * マーカークラスタリング用の名前空間
     * @see {@link https://developers.google.com/maps/documentation/javascript/marker-clustering マーカークラスタリングドキュメント}
     */
    namespace markerclusterer {
      /**
       * マーカーをグリッドベースでクラスタリングするアルゴリズム
       */
      interface GridAlgorithmOptions {
        /** クラスタリングする最大距離（ピクセル） */
        maxDistance?: number;
        /** グリッドのサイズ（ピクセル） */
        gridSize?: number;
      }

      /**
       * グリッドベースのクラスタリングアルゴリズム
       */
      class GridAlgorithm {
        constructor(options?: GridAlgorithmOptions);
      }

      /**
       * マーカークラスタ（マーカーのグループ）
       */
      interface Cluster {
        /** このクラスタに含まれるマーカー配列 */
        markers: google.maps.Marker[];
        /** クラスタの中心位置 */
        position: google.maps.LatLng;
        /** クラスタを囲むバウンディングボックス */
        bounds: google.maps.LatLngBounds;
        /** クラスタ内のマーカー数を取得 */
        getSize(): number;
        /** クラスタ内のマーカー配列を取得 */
        getMarkers(): google.maps.Marker[];
      }

      /**
       * クラスタレンダラー（クラスタの表示方法を定義）
       */
      interface ClusterRenderer {
        /** クラスタをレンダリング */
        render(clusters: Cluster[], stats: { clusters: number; markers: number }): void;
        /** マップへの追加時に呼ばれる */
        onAdd(): void;
        /** マップからの削除時に呼ばれる */
        onRemove(): void;
      }

      /**
       * マーカークラスタリングのオプション
       */
      interface MarkerClustererOptions {
        /** クラスタリングアルゴリズム */
        algorithm?: GridAlgorithm;
        /** クラスタのレンダラー */
        renderer?: ClusterRenderer;
        /** クラスタクリック時のコールバック */
        onClusterClick?: (cluster: Cluster) => void;
      }

      /**
       * マーカークラスタラー（マーカーのグループ化を管理）
       */
      class MarkerClusterer {
        /**
         * マーカークラスタラーを初期化
         * @param map マップインスタンス
         * @param markers 初期マーカー配列
         * @param options クラスタリングオプション
         */
        constructor(
          map: google.maps.Map,
          markers: google.maps.Marker[],
          options?: MarkerClustererOptions
        );

        /**
         * 単一マーカーを追加
         * @param marker 追加するマーカー
         * @param noRedraw 再描画を行わない場合はtrue
         */
        addMarker(marker: google.maps.Marker, noRedraw?: boolean): void;

        /**
         * 複数マーカーを追加
         * @param markers 追加するマーカー配列
         * @param noRedraw 再描画を行わない場合はtrue
         */
        addMarkers(markers: google.maps.Marker[], noRedraw?: boolean): void;

        /**
         * 単一マーカーを削除
         * @param marker 削除するマーカー
         * @param noRedraw 再描画を行わない場合はtrue
         */
        removeMarker(marker: google.maps.Marker, noRedraw?: boolean): void;

        /**
         * 複数マーカーを削除
         * @param markers 削除するマーカー配列
         * @param noRedraw 再描画を行わない場合はtrue
         */
        removeMarkers(markers: google.maps.Marker[], noRedraw?: boolean): void;

        /**
         * すべてのマーカーをクリア
         */
        clearMarkers(): void;
      }
    }
  }
}
