import React, { useEffect, useRef } from 'react';
import './InfoWindow.css';
import { AREAS } from '../../utils/constants';
import { formatInformation, isValidPhoneNumber } from '../../utils/formatters';
import type { InfoWindowProps, LatLngLiteral } from '../../utils/types'; // LatLngLiteral をインポート

const businessHours = [
  { day: '月曜日', key: 'monday' },
  { day: '火曜日', key: 'tuesday' },
  { day: '水曜日', key: 'wednesday' },
  { day: '木曜日', key: 'thursday' },
  { day: '金曜日', key: 'friday' },
  { day: '土曜日', key: 'saturday' },
  { day: '日曜日', key: 'sunday' },
  { day: '祝祭日', key: 'holiday' },
];

const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const infoWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (infoWindowRef.current) {
        const windowHeight = window.innerHeight;
        const maxHeight = windowHeight - 150;
        infoWindowRef.current.style.maxHeight = `${maxHeight}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        infoWindowRef.current &&
        !infoWindowRef.current.contains(event.target as Node)
      ) {
        onCloseClick();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCloseClick]);

  const formatLocation = (location: LatLngLiteral) => {
    return `緯度: ${location.lat}, 経度: ${location.lng}`;
  };

  const formatValue = (value: string | LatLngLiteral | undefined): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && 'lat' in value && 'lng' in value) {
      return formatLocation(value);
    }
    return '';
  };

  return (
    <div
      className="info-window"
      ref={infoWindowRef}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="info-header">
        <h2 id="info-window-title">{poi.name}</h2>
        <button
          onClick={onCloseClick}
          aria-label="閉じる"
          className="modal-close-button"
          title="閉じます。"
        >
          ×
        </button>
      </div>

      <div className="info-content">
        {businessHours.some((hour) => poi[hour.key]) && (
          <div className="info-section">
            {businessHours.map(
              (hour) =>
                poi[hour.key] && (
                  <div key={hour.key}>
                    <span className="day">{hour.day}</span>
                    <span className="value">{formatValue(poi[hour.key])}</span>
                  </div>
                ),
            )}
          </div>
        )}

        <div className="info-horizontal">
          {poi.location && (
            <div className="info-section">
              <span className="day">位置</span>
              <span className="value">{formatLocation(poi.location)}</span>
            </div>
          )}
          {[
            {
              key: 'description',
              condition: poi.holidayInfo,
              title: '定休日について',
              content: <p>{poi.holidayInfo}</p>,
            },
            {
              key: 'reservation',
              condition: poi.parking,
              title: '駐車場',
              content: <p>{poi.parking}</p>,
            },
            {
              key: 'payment',
              condition: poi.payment,
              title: 'キャッシュレス',
              content: <p>{poi.payment}</p>,
            },
            {
              key: 'category',
              condition: poi.category,
              title: 'カテゴリー',
              content: <p>{poi.category}</p>,
            },
            {
              key: 'genre',
              condition: poi.genre,
              title: 'ジャンル',
              content: <p>{poi.genre}</p>,
            },
            {
              key: 'area',
              condition: poi.area,
              title: 'エリア',
              content: <p>{AREAS[poi.area]}</p>,
            },
            {
              key: 'phone',
              condition: poi.phone,
              title: '問い合わせ',
              content:
                poi.phone && isValidPhoneNumber(poi.phone) ? (
                  <a href={`tel:${poi.phone}`} className="info-link">
                    {poi.phone}
                  </a>
                ) : (
                  <span>{poi.phone}</span>
                ),
            },
            {
              key: 'address',
              condition: poi.address,
              title: '所在地',
              content: <p>{poi.address}</p>,
            },
            {
              key: 'information',
              condition: poi.information,
              title: '関連情報',
              content: (
                <div className="info-related">
                  {poi.information ? formatInformation(poi.information) : null}
                </div>
              ),
            },
            {
              key: 'view',
              condition: poi.view,
              title: '',
              content: (
                <a
                  href={poi.view}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-button"
                >
                  Google マップで写真を見る
                </a>
              ),
            },
          ].map((item) =>
            item.condition ? (
              <div className="info-section" key={item.key}>
                {item.title && <h3>{item.title}</h3>}
                {item.content}
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
};

InfoWindow.displayName = 'InfoWindow';

export { InfoWindow };
export default InfoWindow;
