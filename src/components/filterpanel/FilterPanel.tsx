import React, { useEffect, useRef, useCallback } from 'react'; // Reactと必要なフックをインポート
import type { AreaType, LatLngLiteral, Poi } from '../../utils/types'; // 型定義をインポート
import { AREAS } from '../../utils/constants'; // エリア定数をインポート
import { markerConfig } from '../../utils/config'; // マーカー設定をインポート
import './FilterPanel.css'; // スタイルシートをインポート

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
); // 初期表示設定を定義

export { INITIAL_VISIBILITY };

interface FilterPanelProps {
  pois: Poi[]; // POIの配列
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // POIを設定する関数
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >; // エリア表示状態を設定する関数
  isFilterPanelOpen: boolean; // フィルターパネルの開閉状態
  onCloseClick: () => void; // フィルターパネルを閉じる関数
  localAreaVisibility: Record<AreaType, boolean>; // ローカルエリアの表示状態
  setLocalAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >; // ローカルエリア表示状態を設定する関数
  currentLocation: LatLngLiteral | null; // 現在の位置
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >; // 現在の位置を設定する関数
}

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
}) => {
  const panelRef = useRef<HTMLDivElement>(null); // フィルターパネルの参照を保持するためのref

  useEffect(() => {
    setAreaVisibility(localAreaVisibility); // ローカルエリアの表示状態を設定
  }, [localAreaVisibility, setAreaVisibility]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onCloseClick(); // フィルターパネルの外側がクリックされた場合に閉じる
      }
    },
    [onCloseClick],
  );

  useEffect(() => {
    if (isFilterPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside); // マウスダウンイベントリスナーを追加
    } else {
      document.removeEventListener('mousedown', handleClickOutside); // マウスダウンイベントリスナーを削除
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // クリーンアップ関数でマウスダウンイベントリスナーを削除
    };
  }, [isFilterPanelOpen, handleClickOutside]);

  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  ); // 各エリアのPOI数をカウント

  const areas = Object.entries(AREAS)
    .filter(([area]) => area !== 'CURRENT_LOCATION')
    .map(([area, name]) => ({
      area: area as AreaType,
      name,
      count: areaCounts[area as AreaType] ?? 0,
      isVisible: localAreaVisibility[area as AreaType],
      color: markerConfig.colors[area as AreaType],
    })); // エリア情報をマッピング

  const handleCurrentLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.checked) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude }); // 現在の位置を設定
          setLocalAreaVisibility((prev) => ({
            ...prev,
            CURRENT_LOCATION: true,
          })); // 現在地の表示状態を設定
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
      setCurrentLocation(null); // 現在の位置をリセット
      setLocalAreaVisibility((prev) => ({
        ...prev,
        CURRENT_LOCATION: false,
      })); // 現在地の表示状態をリセット
    }
  };

  return (
    <div>
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
                onChange={handleCurrentLocationChange} // 現在地の表示状態を更新
                aria-label="現在地を表示" // アクセシビリティのためのラベルを設定
              />
              <span
                className="custom-checkbox"
                style={{ borderColor: markerConfig.colors.CURRENT_LOCATION }} // カスタムチェックボックスの色を設定
              ></span>
              <div className="filter-details">
                <span
                  className="marker-color"
                  style={{
                    backgroundColor: markerConfig.colors.CURRENT_LOCATION,
                  }} // マーカーの色を設定
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
