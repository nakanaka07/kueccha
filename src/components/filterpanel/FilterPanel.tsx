import React, { useEffect, useRef, useCallback } from 'react';
import type { AreaType, LatLngLiteral, Poi } from '../../utils/types'; // Poi 型をインポート
import { AREAS } from '../../utils/constants';
import { markerConfig } from '../../utils/config';
import './FilterPanel.css';

const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]:
      area !== 'SNACK' &&
      area !== 'PUBLIC_TOILET' &&
      area !== 'PARKING' &&
      area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
);

export { INITIAL_VISIBILITY };

interface FilterPanelProps {
  pois: Poi[];
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  isFilterPanelOpen: boolean;
  onCloseClick: () => void;
  localAreaVisibility: Record<AreaType, boolean>;
  setLocalAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  currentLocation: LatLngLiteral | null; // 追加
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >; // 追加
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
  isFilterPanelOpen,
  onCloseClick,
  localAreaVisibility,
  setLocalAreaVisibility,
  currentLocation, // 追加
  setCurrentLocation, // 追加
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility, setAreaVisibility]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onCloseClick();
      }
    },
    [onCloseClick],
  );

  useEffect(() => {
    if (isFilterPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterPanelOpen, handleClickOutside]);

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
          alert(`Error getting current location: ${errorMessage}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // タイムアウトを10秒に設定
          maximumAge: 0,
        },
      );
    } else {
      setCurrentLocation(null);
      setLocalAreaVisibility((prev) => ({
        ...prev,
        CURRENT_LOCATION: false,
      }));
    }
  };

  return (
    <div>
      {isFilterPanelOpen && (
        <div
          role="region"
          aria-label="エリアフィルター"
          className="filter-panel"
        >
          <button
            className="close-button"
            onClick={onCloseClick}
            title="閉じます。"
          >
            ×
          </button>
          <div>
            <div>表示エリア（表示数）</div>
            <div>
              {areas.map(({ area, name, count, isVisible, color }) => (
                <label key={area} className="filter-item">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => {
                      setLocalAreaVisibility(
                        (prev: Record<AreaType, boolean>) => ({
                          ...prev,
                          [area]: e.target.checked,
                        }),
                      );
                      setSelectedPoi(null);
                    }}
                    aria-label={`${name}を表示 (${count}件)`}
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
                    <span
                      className="area-name"
                      data-fullname={name}
                      title={name}
                    >
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
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
