import React, { useState, useCallback, memo } from "react";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { MarkerClusterer } from "@react-google-maps/api";
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS } from "./appConstants";
import InfoWindowContentMemo from "./InfoWindowContent";
import { nanoid } from "nanoid";

interface MapProps {
	pois: Poi[];
	mapInitialized: boolean;
	setMapInitialized: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Map = memo(
	({ pois, setMapInitialized }: MapProps) => {
		console.log("Map rendered", pois);
		const [map, setMap] = useState<google.maps.Map | null>(null);
		const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

		const handleMarkerClick = useCallback((poi: Poi) => {
			console.log("handleMarkerClick called", poi);
			setActiveMarker(poi);
		}, []);

		const handleMapLoad = useCallback(
			(map: google.maps.Map) => {
				console.log("handleMapLoad called", map);
				setMap(map);
				setMapInitialized(true);
			},
			[setMapInitialized]
		);

		return (
			<GoogleMap
				onLoad={handleMapLoad}
				mapContainerStyle={MAP_CONFIG.mapContainerStyle}
				center={MAP_CONFIG.defaultCenter}
				zoom={MAP_CONFIG.defaultZoom}
				options={{
					mapId: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID,
					disableDefaultUI: true,
					zoomControl: true,
				}}
			>
				<MarkerClusterer>
					{(clusterer) => (
						<>
							{pois.map((poi) => {
								const markerColor =
									AREA_COLORS[poi.area as keyof typeof AREA_COLORS] ||
									"#000000";

								return (
									<Marker
										key={nanoid()}
										position={{ lat: poi.location.lat, lng: poi.location.lng }}
										title={poi.name}
										onClick={() => handleMarkerClick(poi)}
										clusterer={clusterer}
										icon={{
											path: google.maps.SymbolPath.CIRCLE,
											fillColor: markerColor,
											fillOpacity: 1,
											strokeColor: markerColor,
											strokeWeight: 2,
											scale: 10,
										}}
									/>
								);
							})}
						</>
					)}
				</MarkerClusterer>

				{activeMarker && (
					<InfoWindow
						position={{
							lat: activeMarker.location.lat,
							lng: activeMarker.location.lng,
						}}
						onCloseClick={() => setActiveMarker(null)}
					>
						<InfoWindowContentMemo poi={activeMarker} />
					</InfoWindow>
				)}
			</GoogleMap>
		);
	},
	(prevProps: MapProps, nextProps: MapProps) => {
		return (
			prevProps.pois === nextProps.pois &&
			prevProps.mapInitialized === nextProps.mapInitialized
		);
	}
);

export default Map;
