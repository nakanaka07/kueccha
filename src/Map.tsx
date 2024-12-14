import React, { useState, useCallback, useEffect, memo, useRef, useMemo } from "react";
import { GoogleMap, InfoWindow, useJsApiLoader, Libraries } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Poi } from "./types";
import { MAP_CONFIG, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

interface MapProps {
    pois: Poi[];
    isLoaded: boolean;
    setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

const libraries: Libraries = ["marker"];

const Map: React.FC<MapProps> = memo(({ pois, isLoaded, setIsLoaded }: MapProps) => {
    const { isLoaded: apiLoaded } = useJsApiLoader({
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
    const markersRef = useRef<google.maps.Marker[]>([]);

    useEffect(() => {
        setIsLoaded(apiLoaded);
    }, [apiLoaded, setIsLoaded]);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    const createMarkerContent = useCallback((color: string) => ({
        url: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%98%85|${color}`,
        scaledSize: new google.maps.Size(30, 30),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 30),
    }), []);

    useEffect(() => {
        if (isLoaded && mapRef.current) {
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];

            const markers = pois.reduce<google.maps.Marker[]>((acc, poi) => {
                try {
                    const location = {
                        lat: Number(poi.location.lat),
                        lng: Number(poi.location.lng),
                    };

                    const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;

                    const marker = new google.maps.Marker({
                        map: mapRef.current,
                        position: location,
                        title: poi.name,
                        icon: createMarkerContent(markerColor),
                    });

                    marker.addListener("click", () => handleMarkerClick(poi));
                    acc.push(marker);
                } catch (error) {
                    console.error("マーカー作成エラー:", error, poi);
                }
                return acc;
            }, []);

            markersRef.current = markers;

            if (markerClusterer) {
                markerClusterer.clearMarkers();
                markerClusterer.addMarkers(markers);
            } else if (markers.length > 0) {
                setMarkerClusterer(new MarkerClusterer({ map: mapRef.current, markers }));
            }
        }
    }, [isLoaded, pois, markerClusterer, createMarkerContent, handleMarkerClick]);

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
            </GoogleMap>
        );
    }, [isLoaded, handleMapClick, activeMarker]);

    return mapComponent;
});

export default Map;
