import React, { useState, useCallback, useMemo, memo } from "react";
import {
    GoogleMap,
    InfoWindow,
    useJsApiLoader,
    Libraries,
} from "@react-google-maps/api";
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS, AREAS } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

interface MapProps {
    pois: Poi[];
}

const defaultMarkerColor = "#000000";
const libraries: Libraries = ["marker"];

const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries,
        mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
    });

    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

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


    const createAdvancedMarker = useCallback(
        (poi: Poi, map: google.maps.Map) => {
            const markerColor = AREA_COLORS[AREAS[poi.area]] || defaultMarkerColor;
            const markerElement = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: poi.location,
                title: poi.name,
                content: createMarkerContent(markerColor),
            });
            markerElement.addListener("click", () => handleMarkerClick(poi));
            return markerElement;
        },
        [handleMarkerClick, createMarkerContent]
    );

    const map = useMemo(() => {
        if (!isLoaded) return <div>Loading...</div>;

        return (
            <GoogleMap
                mapContainerStyle={MAP_CONFIG.mapContainerStyle}
                center={MAP_CONFIG.defaultCenter}
                zoom={MAP_CONFIG.defaultZoom}
                options={{
                    mapId: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID,
                    disableDefaultUI: false,
                    clickableIcons: false, // マーカーのクリックイベントをマップに伝播させない
                }}
                onLoad={(map) => pois.forEach(poi => createAdvancedMarker(poi, map))}
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
    }, [isLoaded, pois, handleMapClick, createAdvancedMarker, activeMarker]);

    return map;
});

export default Map;
