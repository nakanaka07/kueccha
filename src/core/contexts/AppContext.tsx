import React, { createContext, useContext } from 'react';
import { GeolocationProvider, useGeolocationContext } from './GeolocationContext';
import { LoadingProvider, useLoadingContext } from './LoadingContext';
import { MapProvider, useMapContext } from './MapContext';
import { PoiProvider, usePoiContext } from './PoiContext';
import { useAreaFiltering } from '../../modules/filter/hooks/useAreaFiltering';
import { useAreaVisibility } from '../../modules/filter/hooks/useAreaVisibility';
import { Poi } from '../types/poi';

interface AppContextType {
  map: ReturnType<typeof useMapContext>;
  poi: ReturnType<typeof usePoiContext>;
  geolocation: ReturnType<typeof useGeolocationContext>;
  loading: ReturnType<typeof useLoadingContext>;
  areaVisibility: ReturnType<typeof useAreaVisibility>;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialPois: Poi[];
}> = ({ children, initialPois }) => {
  const { areaVisibility, filteredPois } = useAreaFiltering([]);

  return (
    <LoadingProvider>
      <GeolocationProvider>
        <MapProvider>
          <PoiProvider initialPois={initialPois}>
            <AppContextConsumer areaFiltering={{ areaVisibility, filteredPois }}>{children}</AppContextConsumer>
          </PoiProvider>
        </MapProvider>
      </GeolocationProvider>
    </LoadingProvider>
  );
};

const AppContextConsumer: React.FC<{
  children: React.ReactNode;
  areaFiltering: {
    areaVisibility: ReturnType<typeof useAreaVisibility>;
    filteredPois: Poi[];
  };
}> = ({ children, areaFiltering }) => {
  const map = useMapContext();
  const poi = usePoiContext();
  const geolocation = useGeolocationContext();
  const loading = useLoadingContext();

  React.useEffect(() => {
    loading.registerLoading('map', map.state.isLoading);
    loading.registerLoaded('map', map.state.isMapLoaded);
  }, [map.state.isLoading, map.state.isMapLoaded, loading]);

  React.useEffect(() => {
    loading.registerLoading('poi', poi.state.isLoading);
    loading.registerLoaded('poi', poi.state.isLoaded);
  }, [poi.state.isLoading, poi.state.isLoaded, loading]);

  React.useEffect(() => {
    if (geolocation.state.currentLocation && map.state.isMapLoaded) {
      map.setCenter(geolocation.state.currentLocation);
    }
  }, [geolocation.state.currentLocation, map.state.isMapLoaded, map]);

  return (
    <AppContext.Provider
      value={{
        map,
        poi,
        geolocation,
        loading,
        areaVisibility: areaFiltering.areaVisibility,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
