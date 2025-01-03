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
      <div className="bg-white p-4 rounded shadow-lg max-w-sm space-y-2">
        {/* ヘッダー */}
        <div>
          <h2 id="poi-name" className="text-lg font-bold">
            {poi.name}
          </h2>
        </div>

        {/* 営業時間セクション */}
        {businessHours.length > 0 && (
          <div className="border-t pt-2">
            <div className="space-y-2">
              {businessHours.map(({ day, hours }) => (
                <div key={day} className="flex items-center text-sm">
                  <span className="text-gray-600 w-8">{day}:</span>
                  <span>{typeof hours === 'string' ? hours : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 基本情報セクション */}
        <div className="border-t pt-2">
          <div className="space-y-2">
            {[
              { label: 'カテゴリー', value: poi.category },
              { label: 'ジャンル', value: poi.genre },
              { label: 'エリア', value: AREAS[poi.area] },
              ...(poi.phone ? [{ label: '電話', value: poi.phone, isPhone: true }] : []),
              ...(poi.address ? [{ label: '住所', value: poi.address, isAddress: true }] : []),
            ].map(
              ({ label, value, isPhone, isAddress }) =>
                value && (
                  <div key={label} className="grid grid-cols-[6rem_1fr] items-baseline">
                    <span className="text-sm font-semibold text-gray-600">{label}:</span>
                    {isPhone ? (
                      <a href={`tel:${value}`} className="text-sm text-blue-600 hover:underline">
                        {value}
                      </a>
                    ) : isAddress ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-sm">{value}</span>
                    )}
                  </div>
                ),
            )}
          </div>
        </div>

        {/* 関連情報セクション */}
        {poi.information && (
          <div className="border-t pt-2">
            <div className="space-y-2">{formatInformation(poi.information)}</div>
          </div>
        )}

        {/* Googleマップボタン */}
        {poi.address && (
          <div className="border-t pt-2">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
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
