// src/Map.tsx
import React, { useState, useCallback, useEffect, memo, useRef, useMemo } from "react";
import { GoogleMap, InfoWindow, useJsApiLoader, Libraries } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
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
    const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

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
            const markers = pois.map((poi) => {
                try {
                    const location = {
                        lat: Number(poi.location.lat),
                        lng: Number(poi.location.lng),
                    };

                    const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;
                    const markerElement = new google.maps.marker.AdvancedMarkerElement({
                        map: mapRef.current,
                        position: location,
                        title: poi.name,
                        content: createMarkerContent(markerColor),
                    });

                    markerElement.addListener("click", () => handleMarkerClick(poi));
                    return markerElement;
                } catch (error) {
                    console.error("Error creating AdvancedMarkerElement:", error, poi);
                    return null;
                }
            }).filter(marker => marker !== null) as google.maps.marker.AdvancedMarkerElement[];

            console.log("markers:", markers);

            if (!markerClusterer) {
                if (markers.length > 0) {
                    const newMarkerClusterer = new MarkerClusterer({ map: mapRef.current, markers });
                    console.log("markerClusterer after creation:", newMarkerClusterer);
                    setMarkerClusterer(newMarkerClusterer);
                } else {
                    console.error("No markers to add to MarkerClusterer.");
                }
            } else if (markers.length > 0) {
                markerClusterer.setMarkers(markers);
                console.log("markerClusterer after setMarkers:", markerClusterer);
            }
        }
    }, [isLoaded, pois, markerClusterer]);

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
                onLoad={(map) => {
                    mapRef.current = map;
                    console.log("mapRef.current:", mapRef.current);
                }}
                onClick={handleMapClick}
            >
                {activeMarker && (
                    <InfoWindow position={activeMarker.location} onCloseClick={() => setActiveMarker(null)}>
                        <InfoWindowContent poi={activeMarker} />
                    </InfoWindow>
                )}
            </GoogleMap>
        );
    }, [isLoaded, handleMapClick]);

    return map;
});

export default Map;
