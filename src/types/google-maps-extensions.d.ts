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

      class MarkerClusterer {
        constructor(
          map: google.maps.Map,
          markers: google.maps.Marker[],
          options?: {
            algorithm?: GridAlgorithm;
            renderer?: any;
            onClusterClick?: (cluster: any) => void;
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
