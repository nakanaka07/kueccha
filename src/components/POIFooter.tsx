import React, { useCallback } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';
import { ENV } from '@/utils/env';

const COMPONENT_NAME = 'POIFooter';

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
    const { lat, lng, id } = poi;
    const isValid =
      typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

    if (!isValid && id) {
      logger.warn('POIに有効な座標がありません', {
        component: COMPONENT_NAME,
        action: 'validate_coordinates',
        poiId: id,
        poiName: poi.name || '名称不明',
        coordinates: { lat, lng },
      });
    }

    return isValid;
  }, [poi]);

  // 電話番号リンクをクリックした時のハンドラー
  const handlePhoneClick = useCallback(() => {
    logger.measureTime(
      '電話番号クリック処理',
      () => {
        logger.info('POI電話番号がクリックされました', {
          component: COMPONENT_NAME,
          action: 'click_phone',
          poiId: poi.id,
          poiName: poi.name,
          phone: poi.問い合わせ,
        });
        // 実際の電話処理はブラウザが行うため、ここでの追加処理は不要
      },
      ENV.env.isDev ? LogLevel.DEBUG : LogLevel.INFO
    );
  }, [poi]);

  // 道案内リンクをクリックした時のハンドラー
  const handleDirectionsClick = useCallback(() => {
    logger.measureTime(
      '道案内クリック処理',
      () => {
        logger.info('POI道案内がクリックされました', {
          component: COMPONENT_NAME,
          action: 'click_directions',
          poiId: poi.id,
          poiName: poi.name,
          coordinates: { lat: poi.lat, lng: poi.lng },
        });
        // 実際の地図遷移はブラウザが行うため、ここでの追加処理は不要
      },
      ENV.env.isDev ? LogLevel.DEBUG : LogLevel.INFO
    );
  }, [poi]);

  // 施設が閉店している場合は閉店通知のみ表示
  if (poi.isClosed) {
    return (
      <div className='poi-details-footer'>
        <div className='closed-notice' role='alert'>
          この施設は閉店/閉鎖しています
        </div>
      </div>
    );
  }

  // 有効な座標または問い合わせ先がない場合
  const validCoordinates = hasValidCoordinates();
  const validPhone = poi.問い合わせ && poi.問い合わせ !== '情報なし';

  if (!validCoordinates && !validPhone) {
    logger.warn('POIに有効な連絡手段がありません', {
      component: COMPONENT_NAME,
      action: 'validate_contact_options',
      poiId: poi.id,
      poiName: poi.name,
    });
  }

  return (
    <div className='poi-details-footer'>
      <div className='actions-container'>
        {validCoordinates && (
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
        {validPhone && (
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
    </div>
  );
};
