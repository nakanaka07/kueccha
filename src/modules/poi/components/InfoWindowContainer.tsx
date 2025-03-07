// components/InfoWindowContainer.tsx
import React from 'react';
import { BusinessHoursSection } from './BusinessHoursSection';
import { InfoItem } from './InfoItem';
import styles from './InfoWindow.module.css';
import { InfoWindowHeader } from './InfoWindowHeader';
import { AREAS } from '../../../constants/areas';
import { formatInformation, isValidPhoneNumber } from '../../../core/utils/formatters';
import { useInfoWindowInteraction } from '../hooks/useInfoWindowInteraction';
import type { InfoWindowProps, LatLngLiteral } from '../../../types/poi';

const InfoWindowContainer: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const { windowRef } = useInfoWindowInteraction(onCloseClick);

  const formatLocation = (location: LatLngLiteral) => {
    return `緯度: ${location.lat}, 経度: ${location.lng}`;
  };

  return (
    <div className={styles.infoWindow} ref={windowRef} onClick={(e) => e.stopPropagation()}>
      <InfoWindowHeader title={poi.name} onClose={onCloseClick} />

      <div className={styles.infoContent}>
        <BusinessHoursSection poi={poi} />

        <div className={styles.infoHorizontal}>
          {/* 位置情報 */}
          {poi.location && (
            <InfoItem
              title="位置"
              content={
                <span className={styles.value}>
                  {typeof poi.location === 'string' ? poi.location : formatLocation(poi.location)}
                </span>
              }
            />
          )}

          {/* 定休日情報 */}
          {poi.holidayInfo && <InfoItem title="定休日について" content={<p>{poi.holidayInfo}</p>} />}

          {/* 駐車場情報 */}
          {poi.parking && <InfoItem title="駐車場" content={<p>{poi.parking}</p>} />}

          {/* 以下同様に他の情報項目... */}
          {poi.phone && (
            <InfoItem
              title="問い合わせ"
              content={
                isValidPhoneNumber(poi.phone) ? (
                  <a href={`tel:${poi.phone}`} className={styles.infoLink}>
                    {poi.phone}
                  </a>
                ) : (
                  <span>{poi.phone}</span>
                )
              }
            />
          )}

          {/* Google マップ表示リンク */}
          {poi.view && (
            <InfoItem
              content={
                <a href={poi.view} target="_blank" rel="noopener noreferrer" className={styles.infoButton}>
                  Google マップで写真を見る
                </a>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { InfoWindowContainer as InfoWindow };
export default InfoWindowContainer;
