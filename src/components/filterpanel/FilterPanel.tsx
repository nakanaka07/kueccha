import React, { useEffect, useRef, useState } from 'react';
import './FilterPanel.css';
import { markerConfig, AREAS } from '../../utils/constants';
import type { AreaType, FilterPanelProps } from '../../utils/types';

const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  setSelectedPoi: _setSelectedPoi,
  setAreaVisibility,
  isFilterPanelOpen,
  onCloseClick,
  localAreaVisibility,
  setLocalAreaVisibility,
  currentLocation: _currentLocation,
  setCurrentLocation,
  setShowWarning,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility, setAreaVisibility]);

  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  const areas = Object.entries(AREAS)
    .filter(([area]) => area !== 'CURRENT_LOCATION')
    .map(([area, name]) => ({
      area: area as AreaType,
      name,
      count: areaCounts[area as AreaType] ?? 0,
      isVisible: localAreaVisibility[area as AreaType],
      color: markerConfig.colors[area as AreaType],
    }));

  const handleCurrentLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.checked) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setLocalAreaVisibility((prev) => ({
            ...prev,
            CURRENT_LOCATION: true,
          }));
          setShowWarning(true);
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting current location:', error);
          let errorMessage = '位置情報の取得に失敗しました';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '位置情報の取得が許可されていません';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置情報が利用できません';
              break;
            case error.TIMEOUT:
              errorMessage = '位置情報の取得がタイムアウトしました';
              break;
            default:
              errorMessage = '未知のエラーが発生しました';
              break;
          }
          setLocationError(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      setCurrentLocation(null);
      setLocalAreaVisibility((prev) => ({
        ...prev,
        CURRENT_LOCATION: false,
      }));
      setShowWarning(false);
      setLocationError(null);
    }
  };

  return (
    <div className={`filterpanel-container ${isFilterPanelOpen ? 'open' : ''}`}>
      {isFilterPanelOpen && (
        <div ref={panelRef} className="filter-panel">
          <button
            onClick={onCloseClick}
            className="close-button"
            aria-label="閉じる"
          >
            ×
          </button>
          <h2>表示エリア</h2>
          <div className="filter-list">
            {areas.map(({ area, name, count, isVisible, color }) => (
              <label key={area} className="filter-item">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() =>
                    setLocalAreaVisibility((prev) => ({
                      ...prev,
                      [area]: !prev[area],
                    }))
                  }
                  aria-label={`${name}を表示`}
                />
                <span
                  className="custom-checkbox"
                  style={{ borderColor: color }}
                ></span>
                <div className="filter-details">
                  <span
                    className="marker-color"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="area-name" data-fullname={name} title={name}>
                    {name}
                  </span>
                  <span>({count})</span>
                </div>
              </label>
            ))}
            <label className="filter-item">
              <input
                type="checkbox"
                checked={localAreaVisibility.CURRENT_LOCATION}
                onChange={handleCurrentLocationChange}
                aria-label="現在地を表示"
              />
              <span
                className="custom-checkbox"
                style={{ borderColor: markerConfig.colors.CURRENT_LOCATION }}
              ></span>
              <div className="filter-details">
                <span
                  className="marker-color"
                  style={{
                    backgroundColor: markerConfig.colors.CURRENT_LOCATION,
                  }}
                  aria-hidden="true"
                />
                <span
                  className="area-name"
                  data-fullname="現在地"
                  title="現在地"
                >
                  現在地
                </span>
              </div>
            </label>
          </div>
          {locationError && (
            <div className="error-message" role="alert">
              {locationError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
