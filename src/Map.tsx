// src/Map.tsx

import React, { useState, useCallback, useEffect, memo } from "react";
import {
    InfoWindow,
    useJsApiLoader,
    Libraries,
} from "@react-google-maps/api";
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

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
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
        let map: google.maps.Map | null = null;
        let markerClusterer: MarkerClusterer | null = null;

        if (isLoaded) {
            map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
                center: MAP_CONFIG.defaultCenter,
                zoom: MAP_CONFIG.defaultZoom,
                mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
                disableDefaultUI: false,
                clickableIcons: false,
            });

            const markers: google.maps.Marker[] = pois.map((poi) => {
                try {
                    const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;
                    const markerElement = new google.maps.Marker({
                        map,
                        position: poi.location,
                        title: poi.name,
                        icon: { // Set the icon using the createMarkerContent function
                            url: "", // This is required, but the URL is irrelevant since we use a custom element
                            scaledSize: new google.maps.Size(24, 24), // Size of the marker
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(12, 12), // Center the marker
                            labelOrigin: new google.maps.Point(12, 12)
                        }
                    });

                // Set marker content after creation since we're using Marker now
                const markerContent = createMarkerContent(markerColor);

                markerElement.setIcon(markerContent); //  Use setIcon


                    markerElement.addListener("click", () => handleMarkerClick(poi));

                    return markerElement;
                } catch (error) {
                    console.error("Error creating marker:", error, poi);
                    return null;
                }
            }).filter(Boolean) as google.maps.Marker[]; // 型アサーションと filter を簡潔に記述

            markerClusterer = new MarkerClusterer({ map, markers });
        }    return () => {
            if (markerClusterer) { // markerClustererがnullでないことを確認
                markerClusterer.clearMarkers();
        }
        markers.forEach(marker => marker?.setMap(null)); // markersがnullでないことを確認
        map?.setMap(null); // mapがnullでないことを確認
        };
 }, [isLoaded, pois, createMarkerContent, handleMarkerClick]);

    return (
        <div id="map" style={MAP_CONFIG.mapContainerStyle}>
            {isLoaded ? null : <div>Loading...</div>}
            {activeMarker && isLoaded && (
                <InfoWindow
                    position={activeMarker.location}
                    onCloseClick={() => setActiveMarker(null)}
                >
                    <InfoWindowContent poi={activeMarker} />
                </InfoWindow>
            )}
        </div>
    );
});

export default Map;
