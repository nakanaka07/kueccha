// src/Map.tsx

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import {
    GoogleMap,
    InfoWindow,
    useJsApiLoader,
    Libraries,
} from "@react-google-maps/api";
import MarkerClustererPlus from "@googlemaps/markerclustererplus";
import type { Poi } from "./types";
import { MAP_CONFIG, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

interface MapProps {
    pois: Poi[];
}

const libraries: Libraries = ["marker"];

const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
        mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID],
        version: "weekly",
        language: "ja",
    });

    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerClustererRef = useRef<MarkerClustererPlus | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

    const createMarkerContent = useCallback((color: string) => {
        const div = document.createElement("div");
        div.style.width = "24px";
        div.style.height = "24px";
        div.style.borderRadius = "50%";
        div.style.backgroundColor = color;
        div.style.border = "2px solid white";
        div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        return div;
    }, []);

    useEffect(() => {
        if (isLoaded && mapRef.current) {
            // 既存のマーカーを削除
            markersRef.current.forEach(marker => marker.setMap(null));
            if (markerClustererRef.current) {
                markerClustererRef.current.clearMarkers();
            }
            markersRef.current = [];

            const markers: google.maps.marker.AdvancedMarkerElement[] = pois.map(poi => {
                const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;
                const markerElement = new google.maps.marker.AdvancedMarkerElement({
                    map: mapRef.current,
                    position: poi.location,
                    content: createMarkerContent(markerColor),
                });

                markerElement.addListener("click", () => setActiveMarker(poi));
                return markerElement;
            });

            markersRef.current = markers;

            // MarkerClustererPlusを使用してクラスタリング
            markerClustererRef.current = new MarkerClustererPlus(mapRef.current, markers, {
            });
        }

        // クリーンアップ処理
        return () => {
            markersRef.current.forEach(marker => marker.setMap(null));
        };
    }, [isLoaded, pois, createMarkerContent]);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    const map = useMemo(() => {
        if (!isLoaded) return <div>Loading...</div>;

        return (
            <GoogleMap
                mapContainerStyle={MAP_CONFIG.mapContainerStyle}
                center={MAP_CONFIG.defaultCenter}
                zoom={MAP_CONFIG.defaultZoom}
                options={{
                    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
                    disableDefaultUI: false,
                    clickableIcons: false,
                }}
                onLoad={map => { mapRef.current = map; }}
                onClick={handleMapClick}
            >
                {activeMarker && (
                    <InfoWindow
                        position={activeMarker.location}
                        onCloseClick={() => setActiveMarker(null)}
                    >
                        <InfoWindowContent poi={activeMarker} />
                    </InfoWindow>
                )}
            </GoogleMap>
        );
    }, [isLoaded, handleMapClick, activeMarker]);


    return map;
});

export default Map;
