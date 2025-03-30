import React, { useCallback } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

interface POIFooterProps {
  poi: PointOfInterest;
}

/**
 * POI詳細画面のフッターコンポーネント
 *
 * 施設への問い合わせと経路案内ボタンを提供します
 * 施設が閉店/閉鎖している場合は案内メッセージを表示
 *
 * @param poi - 対象の施設情報 (PointOfInterest)
 */
export const POIFooter: React.FC<POIFooterProps> = ({ poi }) => {
  // 有効な座標を持っているか確認
  const hasValidCoordinates = useCallback(() => {
    const isValid =
      typeof poi.lat === 'number' &&
      typeof poi.lng === 'number' &&
      !isNaN(poi.lat) &&
      !isNaN(poi.lng);

    if (!isValid && poi.id) {
      logger.warn('POIに有効な座標がありません', {
        poiId: poi.id,
        name: poi.name || '名称不明',
        coordinates: { lat: poi.lat, lng: poi.lng },
      });
    }

    return isValid;
  }, [poi.id, poi.lat, poi.lng, poi.name]);

  // 電話番号リンクをクリックした時のハンドラー
  const handlePhoneClick = useCallback(() => {
    logger.info('POI電話番号がクリックされました', {
      poiId: poi.id,
      name: poi.name,
      phone: poi.問い合わせ,
    });
  }, [poi.id, poi.name, poi.問い合わせ]);

  // 道案内リンクをクリックした時のハンドラー
  const handleDirectionsClick = useCallback(() => {
    logger.info('POI道案内がクリックされました', {
      poiId: poi.id,
      name: poi.name,
      coordinates: { lat: poi.lat, lng: poi.lng },
    });
  }, [poi.id, poi.name, poi.lat, poi.lng]);

  return (
    <div className='poi-details-footer'>
      {poi.isClosed ? (
        <div className='closed-notice'>この施設は閉店/閉鎖しています</div>
      ) : (
        <div className='actions-container'>
          {hasValidCoordinates() && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
              target='_blank'
              rel='noopener noreferrer'
              className='directions-button'
              onClick={handleDirectionsClick}
              aria-label={`${poi.name || '施設'}への道順を表示`}
            >
              ここへの道順
            </a>
          )}
          {poi.問い合わせ && poi.問い合わせ !== '情報なし' && (
            <a
              href={`tel:${poi.問い合わせ}`}
              className='call-button'
              onClick={handlePhoneClick}
              aria-label={`${poi.name || '施設'}に電話をかける（${poi.問い合わせ}）`}
            >
              電話をかける
            </a>
          )}
        </div>
      )}
    </div>
  );
};
