import React from 'react';
import { BusinessHoursSection } from './BusinessHoursSection';
import { InfoItem } from './InfoItem';
import { InfoWindowHeader } from './InfoWindowHeader';
import { isValidPhoneNumber } from '../../../core/utils/formatters';
import { useInfoWindowInteraction } from './useInfoWindowInteraction';
import type { InfoWindowProps, LatLngLiteral } from '../../../core/types/poi';

const InfoWindowContainer: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const { windowRef } = useInfoWindowInteraction(onCloseClick);

  const formatLocation = (location: LatLngLiteral) => {
    return `緯度: ${location.lat}, 経度: ${location.lng}`;
  };

  return (
    <div className="infoWindow" ref={windowRef} onClick={(e) => e.stopPropagation()}>
      <InfoWindowHeader title={poi.name} onClose={onCloseClick} />

      <div className="infoContent">
        <BusinessHoursSection poi={poi} />

        <div className="infoHorizontal">
          {poi.location && (
            <InfoItem
              title="位置"
              content={
                <span className="value">
                  {typeof poi.location === 'string' ? poi.location : formatLocation(poi.location)}
                </span>
              }
            />
          )}

          {poi.holidayInfo && <InfoItem title="定休日について" content={<p>{poi.holidayInfo}</p>} />}

          {poi.parking && <InfoItem title="駐車場" content={<p>{poi.parking}</p>} />}

          {poi.phone && (
            <InfoItem
              title="問い合わせ"
              content={
                isValidPhoneNumber(poi.phone) ? (
                  <a href={`tel:${poi.phone}`} className="infoLink">
                    {poi.phone}
                  </a>
                ) : (
                  <span>{poi.phone}</span>
                )
              }
            />
          )}

          {poi.view && (
            <InfoItem
              content={
                <a href={poi.view} target="_blank" rel="noopener noreferrer" className="infoButton">
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
