import React, { useEffect, useRef, useMemo } from 'react';
import './InfoWindow.css';
import { AREAS, INFO_WINDOW_BUSINESS_HOURS } from '../../utils/constants';
import { formatInformation, isValidPhoneNumber } from '../../utils/formatters';
import type {
  InfoWindowProps,
  LatLngLiteral,
  BusinessHourKey,
} from '../../utils/types';

const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const infoWindowRef = useRef<HTMLDivElement>(null);

  const handleResize = () => {
    if (infoWindowRef.current) {
      const windowHeight = window.innerHeight;
      const maxHeight = windowHeight - 150;
      infoWindowRef.current.style.maxHeight = `${maxHeight}px`;
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      infoWindowRef.current &&
      !infoWindowRef.current.contains(event.target as Node)
    ) {
      onCloseClick();
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCloseClick]);

  const formatLocation = (location: LatLngLiteral) => {
    return `緯度: ${location.lat}, 経度: ${location.lng}`;
  };

  const businessHoursContent = useMemo(
    () =>
      INFO_WINDOW_BUSINESS_HOURS.map(
        (hour) =>
          poi[hour.key as BusinessHourKey] && (
            <div key={hour.key}>
              <span className="day">{hour.day}</span>
              <span className="value">{poi[hour.key as BusinessHourKey]}</span>
            </div>
          ),
      ),
    [poi],
  );

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
        {INFO_WINDOW_BUSINESS_HOURS.some((hour) => poi[hour.key]) && (
          <div className="info-section">{businessHoursContent}</div>
        )}

        <div className="info-horizontal">
          {poi.location && (
            <div className="info-section">
              <span className="day">位置</span>
              <span className="value">
                {typeof poi.location === 'string'
                  ? poi.location
                  : formatLocation(poi.location)}
              </span>
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
