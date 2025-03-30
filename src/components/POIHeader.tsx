import React, { useCallback } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

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
const POIHeader: React.FC<POIHeaderProps> = ({ poi, onClose }) => {
  // 閉じるイベントのハンドラをメモ化
  const handleClose = useCallback(() => {
    logger.info('POI詳細を閉じました', { poiId: poi.id, poiName: poi.name });
    onClose();
  }, [poi.id, poi.name, onClose]);

  return (
    <div className='poi-details-header'>
      <h2 className={`poi-name ${poi.isClosed ? 'closed-poi' : ''}`}>
        {poi.isClosed && (
          <span className='closed-label' aria-label='閉店済みの施設' role='status'>
            閉店
          </span>
        )}
        {poi.name}
      </h2>
      <button
        type='button'
        className='close-button'
        onClick={handleClose}
        aria-label='詳細を閉じる'
      >
        ×
      </button>
    </div>
  );
};

// パフォーマンス最適化としてコンポーネントをメモ化
export const MemoizedPOIHeader = React.memo(POIHeader);
// 後方互換性のため元の名前でもエクスポート
export { MemoizedPOIHeader as POIHeader };
