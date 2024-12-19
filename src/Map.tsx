// src/Map.tsx
import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { GoogleMap, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Poi } from "./types";
import { MAP_CONFIG, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";
import AdvancedMarker from "./AdvancedMarker";

interface MapProps {
    pois: Poi[];
}

const Map: React.FC<MapProps> = ({ pois }: MapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID],
        version: "weekly",
        language: "ja",
    });

    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

    const mapRef = useRef<google.maps.Map | null>(null);
    const markerClusterer = useRef<MarkerClusterer | null>(null);
    const markers = useRef<React.ReactElement<AdvancedMarkerProps & { ref?: React.RefObject<google.maps.Marker> }>>([]);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    const createMarkers = useCallback(() => {
        markers.current = pois.map((poi) => {
            const location = {
                lat: Number(poi.location.lat),
                lng: Number(poi.location.lng),
            };

            const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;
            const markerRef = React.createRef<google.maps.Marker>();

            return (
                <AdvancedMarker
                    key={poi.key}
                    map={mapRef.current}
                    position={location}
                    title={poi.name}
                    color={markerColor}
                    onClick={handleMarkerClick}
                    poi={poi}
                    ref={markerRef} // refをAdvancedMarkerコンポーネントに渡す
                />
            );
        });


        // マーカークラスタリング処理を最適化
        if (mapRef.current) {
            // refからgoogle.maps.Markerの配列を取得
            const mapMarkers = markers.current.map(marker => marker.ref.current?.getMarker()) as google.maps.Marker[];

            if (markerClusterer.current) {
                markerClusterer.current.clearMarkers();
                markerClusterer.current.addMarkers(mapMarkers);
            } else if (mapMarkers.length > 0) {
                markerClusterer.current = new MarkerClusterer({
                    markers: mapMarkers,
                    map: mapRef.current,
                });
            }
        }
    }, [pois, handleMarkerClick]);

    useEffect(() => {
        if (isLoaded && mapRef.current) {
            createMarkers();
        }
    }, [isLoaded, createMarkers, pois]);

    const mapComponent = useMemo(() => {
        if (!isLoaded) return <div>地図を読み込んでいます...</div>;

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
                onLoad={(map) => {
                    mapRef.current = map;
                    // マーカークラスタリングを初期化
                     if (markers.current.length > 0) {
                        const mapMarkers = markers.current.map(marker => marker.ref.current?.getMarker()) as google.maps.Marker[];
                        markerClusterer.current = new MarkerClusterer({
                            map,
                            markers: mapMarkers,
                        });
                    }
                }}
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
                {markers.current}
            </GoogleMap>
        );
    }, [isLoaded, activeMarker, handleMapClick, createMarkers, pois]);

    return mapComponent;
};

export default Map;
