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

    const createMarkerContent = useCallback((color: string) => {
        const div = document.createElement('div');
        div.innerHTML = `<img src="https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%98%85|${color}" style="width:30px;height:30px;" />`;
        return div;
    }, []);

    useEffect(() => {
        if (isLoaded && mapRef.current) {
            markers.current.forEach(marker => marker.map = null);
            markers.current = [];

            pois.forEach(poi => {
                const location = {
                    lat: Number(poi.location.lat),
                    lng: Number(poi.location.lng),
                };

                const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;

                const markerContent = createMarkerContent(markerColor);

                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: location,
                    title: poi.name,
                    content: markerContent // contentプロパティを使用
                });

                marker.addListener("click", () => handleMarkerClick(poi));

                if (mapRef.current) {
                    marker.map = mapRef.current;
                }

                markers.current.push(marker);
            });

            if (markerClusterer) {
                markerClusterer.clearMarkers();
                markerClusterer.addMarkers(markers.current);
            } else {
                setMarkerClusterer(new MarkerClusterer({ map: mapRef.current, markers: markers.current }));
            }
        }
    }, [isLoaded, pois, handleMarkerClick, createMarkerContent, markerClusterer, mapRef]);

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
        >
            {mapComponent}
        </LoadScript>
    );
};

export default Map;
