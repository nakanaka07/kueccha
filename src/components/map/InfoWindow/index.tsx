import React from 'react';
import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import type { InfoWindowProps, Poi } from '../../../types';
import { AREAS, BUSINESS_HOURS } from '../../../constants';
import { formatInformation } from '../../../utils/formatters';
import './InfoWindow.css'; // スタイルシートをインポート

// InfoWindowコンポーネント
const InfoWindow = ({ poi, onCloseClick }: InfoWindowProps) => {
  // POIの位置情報を設定
  const position = {
    lat: poi.location.lat,
    lng: poi.location.lng,
  };

  // 営業時間を取得
  const businessHours = BUSINESS_HOURS.map(({ day, key }) => ({
    day,
    hours: poi[key as keyof Poi],
  })).filter(({ hours }) => hours);

  // 住所をエンコードしてGoogleマップのURLを生成
  const encodedAddress = poi.address ? encodeURIComponent(poi.address) : '';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <GoogleInfoWindow position={position} onCloseClick={onCloseClick}>
      <div className="info-window">
        {/* ヘッダー */}
        <div className="info-header">
          <h2 id="poi-name">{poi.name}</h2>
        </div>

        {/* 営業時間セクション */}
        {businessHours.length > 0 && (
          <div className="info-section">
            <div className="info-business-hours">
              {businessHours.map(({ day, hours }) => (
                <div key={day} className="info-business-hour">
                  <span className="info-day">{day}:</span>
                  <span className="info-hours">{typeof hours === 'string' ? hours : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="info-link"
                      >
                        {value}
                      </a>
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
        {poi.address && (
          <div className="info-section">
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="info-button">
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
