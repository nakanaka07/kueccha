// Map.tsx: マップを表示するコンポーネント
import React, { useState, useCallback, memo } from "react";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { MarkerClusterer } from "@react-google-maps/api";
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

interface MapProps {
    pois: Poi[];
    mapInitialized: boolean;
    setMapInitialized: React.Dispatch<React.SetStateAction<boolean>>;
}

const Map = memo(({ pois, setMapInitialized }: MapProps) => {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    const handleMapLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
        setMapInitialized(true);
    }, [setMapInitialized]);

    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    return (
        <GoogleMap
            onLoad={handleMapLoad}
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
                    <React.Fragment>
                        {pois.map((poi) => (
                            <Marker
                                key={poi.key}
                                position={poi.location}
                                title={poi.name}
                                onClick={() => handleMarkerClick(poi)}
                                clusterer={clusterer}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillColor: AREA_COLORS[poi.area as keyof typeof AREA_COLORS] || "#000000",
                                    fillOpacity: 1,
                                    strokeColor: AREA_COLORS[poi.area as keyof typeof AREA_COLORS] || "#000000",
                                    strokeWeight: 2,
                                    scale: 12,
                                }}
                            />
                        ))}
                    </React.Fragment>
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
}, (prevProps, nextProps) => prevProps.pois === nextProps.pois);

export default Map;
