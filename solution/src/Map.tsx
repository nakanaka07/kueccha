// Map.tsx
import React, { useState, useCallback, useMemo, memo } from "react";
import {
    GoogleMap,
    InfoWindow,
    Marker,
    MarkerClusterer,
    useJsApiLoader,
    Libraries,
} from "@react-google-maps/api";
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS, AREAS, AreaType, AreaName } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

interface MapProps {
    pois: Poi[];
    areaVisibility: Record<AreaType, boolean>; // Use AreaType here
}

const defaultMarkerColor = "#000000";

const LIBRARIES: Libraries = ['marker'];

const Map: React.FC<MapProps> = ({ pois, areaVisibility }: MapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
        mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
    });

    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    const markerIcons = useMemo<Record<AreaType, { fillColor: string; strokeColor: string }> | {}>(() => {
        if (!isLoaded) return {};

        const icons: Record<AreaType, { fillColor: string; strokeColor: string }> = {
            // すべてのAreaTypeを初期化
            ...(Object.keys(AREAS) as Array<keyof typeof AREAS>).reduce((acc, key) => {
                acc[key as AreaType] = {
                    fillColor: AREA_COLORS[AREAS[key as AreaType]] || defaultMarkerColor,
                    strokeColor: AREA_COLORS[AREAS[key as AreaType]] || defaultMarkerColor,
                };
                return acc;
            }, {} as Record<AreaType, { fillColor: string; strokeColor: string }>),
        };
        return icons;
    }, [isLoaded]);

    const filteredPois = useMemo(
        () => pois.filter((poi) => areaVisibility[poi.area]), // Directly use poi.area (AreaType)
        [pois, areaVisibility]
    );

    const googleMap = useMemo(() => {
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
                            {filteredPois.map((poi) => {
                                // オプショナル連鎖演算子と条件付きレンダリング
                                const icon = isLoaded ? markerIcons[poi.area as AreaType] : undefined;

                                return (
                                    <Marker
                                        key={poi.key}
                                        position={poi.location}
                                        title={poi.name}
                                        onClick={() => handleMarkerClick(poi)}
                                        icon={icon} // icon変数を使用
                                        clusterer={clusterer}
                                    />
                                );
                            })}
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
    }, [isLoaded, filteredPois, handleMapClick, markerIcons, handleMarkerClick]);


    return <>{googleMap}</>;
};

export default memo(Map);
