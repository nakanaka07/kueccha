// src/AdvancedMarker.tsx
import React, { useEffect, useRef, forwardRef } from 'react';
import type { Poi } from './types';

interface AdvancedMarkerProps {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  title: string;
  color: string;
  onClick: (poi: Poi) => void;
  poi: Poi;
}

const AdvancedMarker: React.FC<AdvancedMarkerProps> = forwardRef(({ position, map, title, color, onClick, poi }, ref) => {
    const markerRef = useRef<google.maps.Marker | null>(null);

    useEffect(() => {
        if (!map) return;

        markerRef.current = new google.maps.Marker({
            map,
            position,
            title,
            icon: {
                url: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%98%85|${color}`,
                scaledSize: new google.maps.Size(30, 30),
            },
        });

        const listener = markerRef.current.addListener("click", () => onClick(poi));

        return () => {
            if (markerRef.current) {
                google.maps.event.removeListener(listener);
                markerRef.current.setMap(null);
            }
        };
    }, [map, position, title, color, onClick, poi]);

    // @ts-ignore
    (React.useImperativeHandle as any)(ref, () => ({
        marker: markerRef.current,
        getMarker: () => markerRef.current,
    }));

    return null;
});

export default AdvancedMarker;
