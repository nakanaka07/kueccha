import React from 'react';
import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import type { InfoWindowProps } from '../../../types';
import { AREAS } from '../../../constants';
import { formatInformation } from '../../../utils/formatters';
import '../../../App.css'; // スタイルシートをインポート

// InfoWindowコンポーネント
const InfoWindow = ({ poi, onCloseClick }: InfoWindowProps) => {
  // POIの位置情報を設定
  const position = {
    lat: poi.location.lat,
    lng: poi.location.lng,
  };

  return (
    <GoogleInfoWindow position={position} onCloseClick={onCloseClick}>
      <div className="info-window">
        <button onClick={onCloseClick}>閉じる</button>
        <h2>{poi.name}</h2>
        <p>{poi.description}</p>
        <ul>
          {poi.businessHours?.map((hour: string, index: number) => (
            <li key={index}>{hour}</li> // 各子要素に一意のkeyプロパティを追加
          ))}
        </ul>
        {/* ヘッダー */}
        <div className="info-header">
          <h2 id="poi-name">{poi.name}</h2>
        </div>

        {/* 基本情報セクション */}
        <div className="info-section">
          <div className="info-basic">
            {[
              { label: 'カテゴリー', value: poi.category },
              { label: 'ジャンル', value: poi.genre },
              { label: 'エリア', value: AREAS[poi.area] },
              ...(poi.phone ? [{ label: '電話', value: poi.phone, isPhone: true }] : []),
              ...(poi.address ? [{ label: '住所', value: poi.address, isAddress: true }] : []),
            ].map(
              ({ label, value, isPhone, isAddress }) =>
                value && (
                  <div key={label} className="info-item">
                    <span className="info-label">{label}:</span>
                    {isPhone ? (
                      <a href={`tel:${value}`} className="info-link">
                        {value}
                      </a>
                    ) : isAddress ? (
                      <span className="info-value">{value}</span>
                    ) : (
                      <span className="info-value">{value}</span>
                    )}
                  </div>
                ),
            )}
          </div>
        </div>

        {/* 関連情報セクション */}
        {poi.information && (
          <div className="info-section">
            <div className="info-related">{formatInformation(poi.information)}</div>
          </div>
        )}

        {/* Googleマップボタン */}
        {poi.view && (
          <div className="info-section">
            <a href={poi.view} target="_blank" rel="noopener noreferrer" className="info-button">
              Googleマップで見る
            </a>
          </div>
        )}
      </div>
    </GoogleInfoWindow>
  );
};

// コンポーネントの表示名を設定
InfoWindow.displayName = 'InfoWindow';

export { InfoWindow };
export default InfoWindow;
