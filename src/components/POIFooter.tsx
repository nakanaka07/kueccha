import React, { useCallback, useMemo, useEffect } from 'react';

import { ENV } from '@/env';
import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

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
const POIFooter: React.FC<POIFooterProps> = React.memo(({ poi }) => {
  // パフォーマンス計測
  useEffect(() => {
    const renderStart = performance.now();

    return () => {
      const renderDuration = performance.now() - renderStart;
      // レンダリング時間が長い場合のみログ出力
      if (renderDuration > 5 && ENV.env.isDev) {
        logger.debug(
          `${COMPONENT_NAME}のマウント-アンマウント時間: ${renderDuration.toFixed(2)}ms`,
          {
            component: COMPONENT_NAME,
            duration: renderDuration,
            action: 'component_lifecycle',
          }
        );
      }
    };
  }, []);

  // 有効な座標を持っているか確認 - メモ化してパフォーマンス向上
  const hasValidCoordinates = useMemo(() => {
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

  // 有効な電話番号かどうかをチェック - メモ化してパフォーマンス向上
  const validPhone = useMemo(() => {
    return Boolean(poi.問い合わせ) && poi.問い合わせ !== '情報なし';
  }, [poi.問い合わせ]);

  // 電話番号リンクをクリックした時のハンドラー
  const handlePhoneClick = useCallback(() => {
    const startTime = performance.now();

    try {
      logger.info('POI電話番号がクリックされました', {
        component: COMPONENT_NAME,
        action: 'click_phone',
        poiId: poi.id,
        poiName: poi.name,
        phone: poi.問い合わせ,
      });
      // 実際の電話処理はブラウザが行うため、ここでの追加処理は不要
    } catch (error) {
      logger.error('電話番号クリックのログ記録中にエラーが発生しました', {
        component: COMPONENT_NAME,
        action: 'click_phone_error',
        poiId: poi.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      const duration = performance.now() - startTime;
      if (duration > 50) {
        logger.warn('電話番号クリック処理に時間がかかりました', {
          component: COMPONENT_NAME,
          action: 'phone_click_performance',
          durationMs: duration,
        });
      }
    }
  }, [poi.id, poi.name, poi.問い合わせ]);

  // 道案内リンクをクリックした時のハンドラー
  const handleDirectionsClick = useCallback(() => {
    const startTime = performance.now();

    try {
      logger.info('POI道案内がクリックされました', {
        component: COMPONENT_NAME,
        action: 'click_directions',
        poiId: poi.id,
        poiName: poi.name,
        coordinates: { lat: poi.lat, lng: poi.lng },
      });
      // 実際の地図遷移はブラウザが行うため、ここでの追加処理は不要
    } catch (error) {
      logger.error('道案内クリックのログ記録中にエラーが発生しました', {
        component: COMPONENT_NAME,
        action: 'click_directions_error',
        poiId: poi.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      const duration = performance.now() - startTime;
      if (duration > 50) {
        logger.warn('道案内クリック処理に時間がかかりました', {
          component: COMPONENT_NAME,
          action: 'directions_click_performance',
          durationMs: duration,
        });
      }
    }
  }, [poi.id, poi.name, poi.lat, poi.lng]);

  // 施設が閉店している場合は閉店通知のみ表示
  if (poi.isClosed) {
    return (
      <div className='poi-details-footer'>
        <div className='closed-notice' role='alert' aria-live='polite'>
          この施設は閉店/閉鎖しています
        </div>
      </div>
    );
  }

  // 有効な連絡手段がない場合のログ記録
  if (!hasValidCoordinates && !validPhone) {
    logger.warn('POIに有効な連絡手段がありません', {
      component: COMPONENT_NAME,
      action: 'validate_contact_options',
      poiId: poi.id,
      poiName: poi.name || '名称不明',
    });
  }

  return (
    <div className='poi-details-footer'>
      <div className='actions-container' role='group' aria-label='連絡先アクション'>
        {hasValidCoordinates && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
            target='_blank'
            rel='noopener noreferrer'
            className='directions-button'
            onClick={handleDirectionsClick}
            aria-label={`${poi.name || '施設'}への道順を表示`}
          >
            <span className='action-icon directions-icon' aria-hidden='true'></span>
            <span className='action-text'>ここへの道順</span>
          </a>
        )}
        {validPhone && (
          <a
            href={`tel:${poi.問い合わせ}`}
            className='call-button'
            onClick={handlePhoneClick}
            aria-label={`${poi.name || '施設'}に電話をかける（${poi.問い合わせ}）`}
          >
            <span className='action-icon phone-icon' aria-hidden='true'></span>
            <span className='action-text'>電話をかける</span>
          </a>
        )}
      </div>
    </div>
  );
});

// コンポーネントの表示名を設定（Reactデバッグツールでの識別を容易に）
POIFooter.displayName = COMPONENT_NAME;

export { POIFooter };
