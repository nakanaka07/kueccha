// Map.tsx: マップを表示するコンポーネント
import React, { useState, useCallback, useMemo, memo } from "react";
import {
    GoogleMap,
    InfoWindow,
    Marker,
    MarkerClusterer,
    useJsApiLoader,
} from "@react-google-maps/api";
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS, AREAS, AreaType, AreaName } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

// MapコンポーネントのPropsの型定義
interface MapProps {
    pois: Poi[];
    areaVisibility: Record<AreaName, boolean>;
}

const defaultMarkerColor = "#000000"; // デフォルトのマーカーの色

const Map: React.FC<MapProps> = memo(({ pois, areaVisibility }: MapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: ["marker"],
        mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
    });

    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    const markerIcon = useCallback(
        (area: AreaType) => ({
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: AREA_COLORS[AREAS[area]] || defaultMarkerColor,
            fillOpacity: 1,
            strokeColor: AREA_COLORS[AREAS[area]] || defaultMarkerColor,
            strokeWeight: 2,
            scale: 12,
        }),
        []
    );

    const filteredPois = useMemo(() => {
        return pois.filter((poi) => areaVisibility[AREAS[poi.area]]);
    }, [pois, areaVisibility]);

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
                }}
                onClick={handleMapClick}
            >
                <MarkerClusterer>
                    {(clusterer) => (
                        <>
                            {filteredPois.map((poi) => (
                                <Marker
                                    key={poi.key}
                                    position={poi.location}
                                    title={poi.name}
                                    onClick={() => handleMarkerClick(poi)}
                                    icon={markerIcon(poi.area)}
                                />
                            ))}
                        </>
                    )}
                </MarkerClusterer>

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
    }, [isLoaded, filteredPois, markerIcon, handleMapClick]);

    return map;
});

export default Map;
