import React from 'react';
import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import type { InfoWindowProps, Poi } from '../../../types';
import { AREAS, BUSINESS_HOURS } from '../../../constants';
import { formatInformation } from '../../../utils/formatters';

const InfoWindow = ({ poi, onCloseClick }: InfoWindowProps) => {
  const position = {
    lat: poi.location.lat,
    lng: poi.location.lng,
  };

  const businessHours = BUSINESS_HOURS.map(({ day, key }) => ({
    day,
    hours: poi[key as keyof Poi],
  })).filter(({ hours }) => hours);

  const encodedAddress = poi.address ? encodeURIComponent(poi.address) : '';

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <GoogleInfoWindow position={position} onCloseClick={onCloseClick}>
      <div>
        {/* ヘッダー */}
        <div>
          <h2 id="poi-name">{poi.name}</h2>
        </div>

        {/* 営業時間セクション */}
        {businessHours.length > 0 && (
          <div>
            <div>
              {businessHours.map(({ day, hours }) => (
                <div key={day}>
                  <span>{day}:</span>
                  <span>{typeof hours === 'string' ? hours : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 基本情報セクション */}
        <div>
          <div>
            {[
              { label: 'カテゴリー', value: poi.category },
              { label: 'ジャンル', value: poi.genre },
              { label: 'エリア', value: AREAS[poi.area] },
              ...(poi.phone ? [{ label: '電話', value: poi.phone, isPhone: true }] : []),
              ...(poi.address ? [{ label: '住所', value: poi.address, isAddress: true }] : []),
            ].map(
              ({ label, value, isPhone, isAddress }) =>
                value && (
                  <div key={label}>
                    <span>{label}:</span>
                    {isPhone ? (
                      <a href={`tel:${value}`}>{value}</a>
                    ) : isAddress ? (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                        {value}
                      </a>
                    ) : (
                      <span>{value}</span>
                    )}
                  </div>
                ),
            )}
          </div>
        </div>

        {/* 関連情報セクション */}
        {poi.information && (
          <div>
            <div>{formatInformation(poi.information)}</div>
          </div>
        )}

        {/* Googleマップボタン */}
        {poi.address && (
          <div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              Googleマップで見る
            </a>
          </div>
        )}
      </div>
    </GoogleInfoWindow>
  );
};

InfoWindow.displayName = 'InfoWindow';

export { InfoWindow };
export default InfoWindow;
