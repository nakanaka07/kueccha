import React, { useEffect, useRef } from 'react';

import { AREAS, INFO_WINDOW_BUSINESS_HOURS } from '../constants';
import type { InfoWindowProps, BusinessHourKey } from '../types/types';
import { formatInformation, isValidPhoneNumber } from '../utils/formatters';

export const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const infoWindowRef = useRef<HTMLDivElement>(null);

  // リサイズ処理
  useEffect(() => {
    const handleResize = () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.style.maxHeight = `${window.innerHeight - 150}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 外部クリック処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (infoWindowRef.current && !infoWindowRef.current.contains(event.target as Node)) {
        onCloseClick();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCloseClick]);

  // POI項目のレンダリング
  const renderItems = () => {
    const items = [
      {
        key: 'holidayInfo',
        title: '定休日について',
        value: poi.holidayInfo,
      },
      {
        key: 'parking',
        title: '駐車場',
        value: poi.parking,
      },
      {
        key: 'payment',
        title: 'キャッシュレス',
        value: poi.payment,
      },
      {
        key: 'category',
        title: 'カテゴリー',
        value: poi.category,
      },
      {
        key: 'genre',
        title: 'ジャンル',
        value: poi.genre,
      },
      {
        key: 'area',
        title: 'エリア',
        value: poi.area ? AREAS[poi.area] : undefined,
      },
      {
        key: 'phone',
        title: '問い合わせ',
        value: poi.phone,
        render:
          poi.phone && isValidPhoneNumber(poi.phone) ? (
            <a href={`tel:${poi.phone}`}>{poi.phone}</a>
          ) : (
            <span>{poi.phone}</span>
          ),
      },
      {
        key: 'address',
        title: '所在地',
        value: poi.address,
      },
      {
        key: 'information',
        title: '関連情報',
        value: poi.information,
        render: poi.information ? formatInformation(poi.information) : null,
      },
      {
        key: 'view',
        title: '',
        value: poi.view,
        render: (
          <a href={poi.view} target="_blank" rel="noopener noreferrer">
            Google マップで写真を見る
          </a>
        ),
      },
    ];

    return items.map((item) => {
      if (!item.value) return null;

      return (
        <div key={item.key}>
          {item.title && <h3>{item.title}</h3>}
          {item.render || <p>{item.value}</p>}
        </div>
      );
    });
  };

  // 営業時間のレンダリング
  const renderBusinessHours = () => {
    const hasHours = INFO_WINDOW_BUSINESS_HOURS.some((hour) => poi[hour.key as BusinessHourKey]);

    if (!hasHours) return null;

    return (
      <div>
        {INFO_WINDOW_BUSINESS_HOURS.map(
          (hour) =>
            poi[hour.key as BusinessHourKey] && (
              <div key={hour.key}>
                <span>{hour.day}</span>
                <span>{poi[hour.key as BusinessHourKey]}</span>
              </div>
            ),
        )}
      </div>
    );
  };

  return (
    <div ref={infoWindowRef} onClick={(e) => e.stopPropagation()}>
      <div>
        <h2 id="info-window-title">{poi.name}</h2>
        <button onClick={onCloseClick} aria-label="閉じる" title="閉じます。">
          ×
        </button>
      </div>
      <div>
        {renderBusinessHours()}
        <div>
          {poi.location && (
            <div>
              <span>位置</span>
              <span>
                {typeof poi.location === 'string'
                  ? poi.location
                  : `緯度: ${poi.location.lat}, 経度: ${poi.location.lng}`}
              </span>
            </div>
          )}
          {renderItems()}
        </div>
      </div>
    </div>
  );
};

InfoWindow.displayName = 'InfoWindow';
