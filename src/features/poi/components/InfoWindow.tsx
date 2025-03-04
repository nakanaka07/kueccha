import React, { useEffect, useRef, useMemo } from 'react';
import styles from './InfoWindow.module.css';
import { AREAS } from '../../../constants/areas';
import { INFO_WINDOW_BUSINESS_HOURS } from '../../../constants/ui';
import { formatInformation, isValidPhoneNumber } from '../../../utils/formatters';
import type { InfoWindowProps, LatLngLiteral, BusinessHourKey } from '../../../types/poi';

const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const infoWindowRef = useRef<HTMLDivElement>(null);

  const formatLocation = (location: LatLngLiteral) => {
    return `緯度: ${location.lat}, 経度: ${location.lng}`;
  };

  const handleResize = () => {
    if (infoWindowRef.current) {
      const windowHeight = window.innerHeight;
      const maxHeight = windowHeight - 150;
      infoWindowRef.current.style.maxHeight = `${maxHeight}px`;
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (infoWindowRef.current && !infoWindowRef.current.contains(event.target as Node)) {
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
  }, [handleClickOutside]);

  const businessHoursContent = useMemo(
    () =>
      INFO_WINDOW_BUSINESS_HOURS.map(
        (hour) =>
          poi[hour.key as BusinessHourKey] && (
            <div key={hour.key}>
              <span className={styles.day}>{hour.day}</span>
              <span className={styles.value}>{poi[hour.key as BusinessHourKey]}</span>
            </div>
          ),
      ),
    [poi],
  );

  return (
    <div className={styles.infoWindow} ref={infoWindowRef} onClick={(e) => e.stopPropagation()}>
      <div className={styles.infoHeader}>
        <h2 id="info-window-title">{poi.name}</h2>
        <button
          onClick={() => {
            onCloseClick();
          }}
          aria-label="閉じる"
          className={styles.modalCloseButton}
          title="閉じます。"
        >
          ×
        </button>
      </div>

      <div className={styles.infoContent}>
        {INFO_WINDOW_BUSINESS_HOURS.some((hour) => poi[hour.key]) && (
          <div className={styles.infoSection}>{businessHoursContent}</div>
        )}

        <div className={styles.infoHorizontal}>
          {poi.location && (
            <div className={styles.infoSection}>
              <span className={styles.day}>位置</span>
              <span className={styles.value}>
                {typeof poi.location === 'string' ? poi.location : formatLocation(poi.location)}
              </span>
            </div>
          )}
          {[
            {
              key: 'description',
              condition: poi.holidayInfo,
              title: '定休日について',
              content: <p>{poi.holidayInfo}</p>,
              description: 'この場所の定休日に関する情報です。',
            },
            {
              key: 'reservation',
              condition: poi.parking,
              title: '駐車場',
              content: <p>{poi.parking}</p>,
              description: '駐車場の有無や詳細についての情報です。',
            },
            {
              key: 'payment',
              condition: poi.payment,
              title: 'キャッシュレス',
              content: <p>{poi.payment}</p>,
              description: '利用可能な支払い方法についての情報です。',
            },
            {
              key: 'category',
              condition: poi.category,
              title: 'カテゴリー',
              content: <p>{poi.category}</p>,
              description: 'この場所のカテゴリーに関する情報です。',
            },
            {
              key: 'genre',
              condition: poi.genre,
              title: 'ジャンル',
              content: <p>{poi.genre}</p>,
              description: 'この場所のジャンルに関する情報です。',
            },
            {
              key: 'area',
              condition: poi.area,
              title: 'エリア',
              content: <p>{AREAS[poi.area]}</p>,
              description: 'この場所が属するエリアに関する情報です。',
            },
            {
              key: 'phone',
              condition: poi.phone,
              title: '問い合わせ',
              content:
                poi.phone && isValidPhoneNumber(poi.phone) ? (
                  <a href={`tel:${poi.phone}`} className={styles.infoLink}>
                    {poi.phone}
                  </a>
                ) : (
                  <span>{poi.phone}</span>
                ),
              description: 'この場所への問い合わせ先の電話番号です。',
            },
            {
              key: 'address',
              condition: poi.address,
              title: '所在地',
              content: <p>{poi.address}</p>,
              description: 'この場所の住所に関する情報です。',
            },
            {
              key: 'information',
              condition: poi.information,
              title: '関連情報',
              content: (
                <div className={styles.infoRelated}>{poi.information ? formatInformation(poi.information) : null}</div>
              ),
              description: 'この場所に関連する追加情報です。',
            },
            {
              key: 'view',
              condition: poi.view,
              title: '',
              content: (
                <a href={poi.view} target="_blank" rel="noopener noreferrer" className={styles.infoButton}>
                  Google マップで写真を見る
                </a>
              ),
              description: 'Google マップでこの場所の写真を見ることができます。',
            },
          ].map((item) =>
            item.condition ? (
              <div className={styles.infoSection} key={item.key}>
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
