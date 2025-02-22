// Reactと必要なフックをインポート
import React, { useEffect, useRef, useState } from 'react';
// CSSファイルをインポート
import './FilterPanel.css';
// 定数をインポート
import { MARKER_CONFIG, AREAS } from '../../utils/constants';
// 型定義をインポート
import type { AreaType, FilterPanelProps } from '../../utils/types';

// FilterPanelコンポーネントを定義
const FilterPanel: React.FC<FilterPanelProps> = ({
  pois, // POI（ポイントオブインタレスト）のデータ
  setSelectedPoi: _setSelectedPoi, // 選択されたPOIを設定する関数
  setAreaVisibility, // エリアの表示状態を設定する関数
  isFilterPanelOpen, // フィルターパネルの開閉状態
  onCloseClick, // 閉じるボタンのクリックハンドラー
  localAreaVisibility, // ローカルのエリア表示状態
  setLocalAreaVisibility, // ローカルのエリア表示状態を設定する関数
  currentLocation: _currentLocation, // 現在の位置情報
  setCurrentLocation, // 現在の位置情報を設定する関数
  setShowWarning, // 警告メッセージの表示状態を設定する関数
}) => {
  // フィルターパネルのDOM要素を参照するためのref
  const panelRef = useRef<HTMLDivElement>(null);
  // 位置情報エラーを管理する状態変数
  const [locationError, setLocationError] = useState<string | null>(null);

  // エリアの表示状態を更新するuseEffectフック
  useEffect(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility, setAreaVisibility]);

  // 各エリアのPOIの数を計算
  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  // エリア情報を作成
  const areas = Object.entries(AREAS)
    .filter(([area]) => area !== 'CURRENT_LOCATION')
    .map(([area, name]) => ({
      area: area as AreaType,
      name,
      count: areaCounts[area as AreaType] ?? 0,
      isVisible: localAreaVisibility[area as AreaType],
      color: MARKER_CONFIG.colors[area as AreaType],
    }));

  // 現在地の表示状態を変更する関数
  const handleCurrentLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.checked) {
      // 位置情報を取得
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
          // エラーメッセージを設定
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
      // 現在地の表示をオフにする
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
    // フィルターパネルのコンテナ
    <div className={`filterpanel-container ${isFilterPanelOpen ? 'open' : ''}`}>
      {isFilterPanelOpen && (
        <div ref={panelRef} className="filter-panel">
          {/* 閉じるボタン */}
          <button
            onClick={onCloseClick}
            className="close-button"
            aria-label="閉じる"
          >
            ×
          </button>
          <h2>表示エリア</h2>
          <div className="filter-list">
            {/* 各エリアのフィルターアイテム */}
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
            {/* 現在地のフィルターアイテム */}
            <label className="filter-item">
              <input
                type="checkbox"
                checked={localAreaVisibility.CURRENT_LOCATION}
                onChange={handleCurrentLocationChange}
                aria-label="現在地を表示"
              />
              <span
                className="custom-checkbox"
                style={{ borderColor: MARKER_CONFIG.colors.CURRENT_LOCATION }}
              ></span>
              <div className="filter-details">
                <span
                  className="marker-color"
                  style={{
                    backgroundColor: MARKER_CONFIG.colors.CURRENT_LOCATION,
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
          {/* 位置情報エラーの表示 */}
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

// コンポーネントをエクスポート
export default FilterPanel;
