// Google Maps API拡張型定義
declare namespace google {
  namespace maps {
    /**
     * マーカークラスタリング用の名前空間
     */
    namespace markerclusterer {
      class GridAlgorithm {
        constructor(options?: { maxDistance?: number; gridSize?: number });
      }

      interface Cluster {
        markers: google.maps.Marker[];
        position: google.maps.LatLng;
        bounds: google.maps.LatLngBounds;
        getSize(): number;
        getMarkers(): google.maps.Marker[];
      }

      interface ClusterRenderer {
        render(clusters: Cluster[], stats: { clusters: number; markers: number }): void;
        onAdd(): void;
        onRemove(): void;
      }

      class MarkerClusterer {
        constructor(
          map: google.maps.Map,
          markers: google.maps.Marker[],
          options?: {
            algorithm?: GridAlgorithm;
            renderer?: ClusterRenderer;
            onClusterClick?: (cluster: Cluster) => void;
          }
        );

        addMarker(marker: google.maps.Marker, noRedraw?: boolean): void;
        addMarkers(markers: google.maps.Marker[], noRedraw?: boolean): void;
        removeMarker(marker: google.maps.Marker, noRedraw?: boolean): void;
        removeMarkers(markers: google.maps.Marker[], noRedraw?: boolean): void;
        clearMarkers(): void;
      }
    }
  }
}
