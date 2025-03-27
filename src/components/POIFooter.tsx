import React from 'react';

import { PointOfInterest } from '@/types/poi';

/**
 * フッターコンポーネント
 */
export const POIFooter: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  const hasValidCoordinates =
    typeof poi.lat === 'number' &&
    typeof poi.lng === 'number' &&
    !isNaN(poi.lat) &&
    !isNaN(poi.lng);

  return (
    <div className='poi-details-footer'>
      {poi.isClosed ? (
        <div className='closed-notice'>この施設は閉店/閉鎖しています</div>
      ) : (
        <div className='actions-container'>
          {hasValidCoordinates && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
              target='_blank'
              rel='noopener noreferrer'
              className='directions-button'
            >
              ここへの道順
            </a>
          )}
          {poi.問い合わせ && poi.問い合わせ !== '情報なし' && (
            <a href={`tel:${poi.問い合わせ}`} className='call-button'>
              電話をかける
            </a>
          )}
        </div>
      )}
    </div>
  );
};
