import React, { useEffect, useRef } from 'react';
import type { InfoWindowProps } from '../../utils/types';
import { AREAS } from '../../utils/constants';
import { formatInformation } from '../../utils/formatters';
import './InfoWindow.css';

const isValidPhoneNumber = (phone: string) => {
  const phoneRegex = /^[0-9-+() ]+$/;
  return phoneRegex.test(phone);
};

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

  const businessHours = [
    { day: '月曜日', value: poi.monday },
    { day: '火曜日', value: poi.tuesday },
    { day: '水曜日', value: poi.wednesday },
    { day: '木曜日', value: poi.thursday },
    { day: '金曜日', value: poi.friday },
    { day: '土曜日', value: poi.saturday },
    { day: '日曜日', value: poi.sunday },
    { day: '祝祭日', value: poi.holiday },
  ];

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
        {businessHours.some(hour => hour.value) && (
          <div className="info-section">
            <ul>
              {businessHours.map((hour, index) =>
                hour.value ? (
                  <li key={index}>
                    <span className="day">{hour.day}</span>{' '}
                    <span className="value">{hour.value}</span>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}

        <div className="info-horizontal">
          {[
            {
              key: 'description',
              condition: poi.description,
              title: '補足',
              content: <p>{poi.description}</p>,
            },
            {
              key: 'reservation',
              condition: poi.reservation,
              title: '予約',
              content: <p>{poi.reservation}</p>,
            },
            {
              key: 'payment',
              condition: poi.payment,
              title: '支払',
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
                  Google マップで見る
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
