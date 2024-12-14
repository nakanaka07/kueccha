import React, { useState, useCallback, useEffect, memo, useRef, useMemo } from "react";
import { GoogleMap, InfoWindow, useJsApiLoader, Libraries } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Poi } from "./types";
import { MAP_CONFIG, AREA_COLORS, defaultMarkerColor, AREAS } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

interface MapProps {
    pois: Poi[];
    isLoaded: boolean;
    setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

const libraries: Libraries = ["marker"];

const getMarkerColor = (area: string) => AREA_COLORS[area as keyof typeof AREA_COLORS] || defaultMarkerColor; // AREA_COLORSアクセス用のヘルパー関数

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
    const markerClustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<Map<string, google.maps.Marker>>(new Map()); // マーカーをIDで管理

    useEffect(() => {
        setIsLoaded(apiLoaded);
    }, [apiLoaded, setIsLoaded]);

    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);


    const createMarkerContent = useCallback((color: string) => ({
        url: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%98%85|${color}`,
        scaledSize: new google.maps.Size(30, 30),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 30),
    }), []);

    useEffect(() => {
        if (isLoaded && mapRef.current) {
            const newMarkers = new Map<string, google.maps.Marker>();

            pois.forEach((poi) => {
                const poiId = poi.id; // Poiにidがあると仮定

                if (markersRef.current.has(poiId)) {
                    // マーカーが既に存在する場合は更新 (必要に応じて位置、アイコンなどを更新)
                    const existingMarker = markersRef.current.get(poiId)!;
                   // ... 更新ロジック ...
                   newMarkers.set(poiId, existingMarker)

                } else {
                    // 新しいマーカーを作成
                    try {
                        const location = {
                            lat: Number(poi.location.lat),
                            lng: Number(poi.location.lng),
                        };

                        const markerColor = getMarkerColor(poi.area);  // ヘルパー関数を使用
                        const marker = new google.maps.Marker({
                            map: mapRef.current,
                            position: location,
                            title: poi.name,
                            icon: createMarkerContent(markerColor),
                        });

                        marker.addListener("click", () => handleMarkerClick(poi));
                        newMarkers.set(poiId, marker)
                    } catch (error) {
                        console.error("マーカー作成エラー:", error, poi);
                    }
                }


            });

            // 存在しないマーカーを削除
            markersRef.current.forEach((marker, id) => {
                if (!newMarkers.has(id)) {
                    marker.setMap(null);
                }
            });

            markersRef.current = newMarkers;



                if(markerClustererRef.current){
                    markerClustererRef.current.clearMarkers();
                    markerClustererRef.current.addMarkers([...newMarkers.values()])
                } else {
                    markerClustererRef.current = new MarkerClusterer({map:mapRef.current, markers:[...newMarkers.values()]})
                }

        }
    }, [isLoaded, pois, createMarkerContent, handleMarkerClick]);

    const mapComponent = useMemo(() => {  // activeMarkerを依存配列から削除
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
            >
                 {activeMarker && (  // InfoWindowをMapコンポーネント内でレンダリング
                    <InfoWindow
                        position={activeMarker.location}
                        onCloseClick={() => setActiveMarker(null)}
                    >
                        <InfoWindowContent poi={activeMarker} />
                    </InfoWindow>
                )}
            </GoogleMap>
        );
    }, [isLoaded]); // activeMarkerを除外

    return mapComponent;
});

export default Map;

