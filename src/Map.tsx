// src/Map.tsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { GoogleMap, InfoWindow, useJsApiLoader, LoadScript, Libraries } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Poi } from "./types";
import { MAP_CONFIG, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

const libraries: Libraries = ["marker"];

interface MapProps {
    pois: Poi[];
}

const Map: React.FC<MapProps> = ({ pois }: MapProps) => {
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
    const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);
    const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    const createMarkerElement = useCallback((color: string) => {
        const div = document.createElement('div');
        div.innerHTML = `<img src="https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%98%85|${color}" style="width:30px;height:30px;" />`;
        return div;
    }, []);

    const createMarkers = useCallback(() => {
        markers.current.forEach(marker => marker.map = null);
        markers.current = [];

        pois.forEach(poi => {
            const location = {
                lat: Number(poi.location.lat),
                lng: Number(poi.location.lng),
            };

            const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;
            const markerElement = createMarkerElement(markerColor);

            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: location,
                title: poi.name,
            });
            marker.element = markerElement;
            marker.addListener("click", () => handleMarkerClick(poi));

            // mapRef.current が null でないことを確認してからマーカーを追加
            if (mapRef.current) {
                marker.map = mapRef.current;
            }

            markers.current.push(marker);
        });

        if (markerClusterer) {
            markerClusterer.clearMarkers();
            markerClusterer.addMarkers(markers.current);
        } else if (mapRef.current) {
            setMarkerClusterer(new MarkerClusterer({ markers: markers.current, map: mapRef.current }));
        }
    }, [pois, createMarkerElement, handleMarkerClick, mapRef.current]); // mapRef.current を依存配列に追加

    useEffect(() => {
        if (isLoaded) {
            createMarkers();
        }
    }, [isLoaded, createMarkers, pois]); // pois を依存配列に追加


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
    }, [isLoaded, activeMarker, handleMapClick]);

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            id="google-map-script"
            mapIds={[import.meta.env.VITE_GOOGLE_MAPS_MAP_ID]}
            version="weekly"
            language="ja"
            onLoad={() => {
                createMarkers();
            }}
        >
            {mapComponent}
        </LoadScript>
    );
};

export default Map;
