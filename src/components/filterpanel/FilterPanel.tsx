import React, { useEffect, useRef } from 'react'; // Reactと必要なフックをインポート
import type { AreaType, LatLngLiteral, Poi } from '../../utils/types'; // 型定義をインポート
import { AREAS } from '../../utils/constants'; // エリア定数をインポート
import { markerConfig } from '../../utils/config'; // マーカー設定をインポート
import './FilterPanel.css'; // スタイルシートをインポート

// 初期表示設定を定義
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

// FilterPanelコンポーネントのプロパティの型定義
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
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>; // 追加
}

// FilterPanelコンポーネントの定義
const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
  isFilterPanelOpen,
  onCloseClick,
  localAreaVisibility,
  setLocalAreaVisibility,
  currentLocation,
  setCurrentLocation,
  setShowWarning, // 追加
}) => {
  const panelRef = useRef<HTMLDivElement>(null); // フィルターパネルの参照を保持するためのref

  // ローカルエリアの表示状態を設定
  useEffect(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility, setAreaVisibility]);

  // 各エリアのPOI数をカウント
  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  // エリア情報をマッピング
  const areas = Object.entries(AREAS)
    .filter(([area]) => area !== 'CURRENT_LOCATION')
    .map(([area, name]) => ({
      area: area as AreaType,
      name,
      count: areaCounts[area as AreaType] ?? 0,
      isVisible: localAreaVisibility[area as AreaType],
      color: markerConfig.colors[area as AreaType],
    }));

  // 現在地の表示状態を更新
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
          setShowWarning(true); // 現在地が取得されたときに警告メッセージを表示
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
      setShowWarning(false); // 現在地をオフにした際に警告メッセージを閉じる
    }
  };

  return (
    <div className={`filterpanel-container ${isFilterPanelOpen ? 'open' : ''}`}>
      {isFilterPanelOpen && (
        <div ref={panelRef} className="filter-panel">
          <button onClick={onCloseClick} className="close-button">
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
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
