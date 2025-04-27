import React, { useCallback, useEffect } from 'react';

import { ENV } from '@/env';
import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

// コンポーネント名を定数化（ロギングやデバッグで一貫して使用するため）
const COMPONENT_NAME = 'POIHeader';

/**
 * POIヘッダーコンポーネントのProps定義
 */
interface POIHeaderProps {
  /** 表示対象のPOI情報 */
  poi: PointOfInterest;
  /** 閉じるボタンクリック時のコールバック */
  onClose: () => void;
}

/**
 * POIの詳細画面ヘッダーコンポーネント
 * 施設名の表示と閉店情報、閉じるボタンを提供します。
 * アクセシビリティを考慮し、閉店情報は適切なaria属性を持ちます。
 */
const POIHeaderComponent: React.FC<POIHeaderProps> = ({ poi, onClose }) => {
  // パフォーマンス計測
  useEffect(() => {
    const renderStart = performance.now();

    return () => {
      const renderDuration = performance.now() - renderStart;
      // レンダリング時間が長い場合のみログ出力
      if (renderDuration > 5 && ENV.env.isDev) {
        logger.debug(`${COMPONENT_NAME}のライフサイクル時間: ${renderDuration.toFixed(2)}ms`, {
          component: COMPONENT_NAME,
          duration: renderDuration,
          action: 'component_lifecycle',
          poiId: poi.id,
        });
      }
    };
  }, [poi.id]);

  // 閉じるイベントのハンドラをメモ化
  const handleClose = useCallback(() => {
    try {
      const startTime = performance.now();

      // 構造化ロギングの実践 - component, action, entityId などの推奨コンテキスト追加
      logger.info('POI詳細を閉じました', {
        component: COMPONENT_NAME,
        action: 'close_poi_details',
        poiId: poi.id,
        poiName: poi.name,
        status: 'success',
      });

      onClose();

      const duration = performance.now() - startTime;
      if (duration > 10) {
        logger.debug('閉じる操作に時間がかかりました', {
          component: COMPONENT_NAME,
          action: 'close_performance',
          durationMs: duration,
        });
      }
    } catch (error) {
      logger.error('POI詳細を閉じる際にエラーが発生しました', {
        component: COMPONENT_NAME,
        action: 'close_poi_details_error',
        poiId: poi.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // エラーが発生してもUIを閉じるためにonCloseを呼び出す
      try {
        onClose();
      } catch {
        // 最終的なフォールバック - 何もしない
      }
    }
  }, [poi.id, poi.name, onClose]);

  return (
    <div className='poi-details-header'>
      <h2
        id='poi-title'
        className={`poi-name ${poi.isClosed ? 'closed-poi' : ''}`}
        data-testid='poi-name'
      >
        {poi.isClosed && (
          <span className='closed-label' aria-label='閉店済みの施設' role='status'>
            閉店
          </span>
        )}
        <span id='poi-description'>{poi.name}</span>
      </h2>
      <button
        type='button'
        className='close-button'
        onClick={handleClose}
        aria-label='詳細を閉じる'
      >
        <span aria-hidden='true'>×</span>
      </button>
    </div>
  );
};

// パフォーマンス最適化としてコンポーネントをメモ化
const MemoizedPOIHeader = React.memo(POIHeaderComponent);
MemoizedPOIHeader.displayName = COMPONENT_NAME;

// 後方互換性のため元の名前でもエクスポート
export { MemoizedPOIHeader as POIHeader };
