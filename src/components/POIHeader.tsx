import React from 'react';

import { PointOfInterest } from '@/types/poi';

/**
 * POIヘッダーコンポーネント
 */
export const POIHeader: React.FC<{ poi: PointOfInterest; onClose: () => void }> = ({
  poi,
  onClose,
}) => (
  <div className='poi-details-header'>
    <h2 className='poi-name'>
      {poi.isClosed && <span className='closed-label'>閉店</span>}
      {poi.name}
    </h2>
    <button type='button' className='close-button' onClick={onClose} aria-label='閉じる'>
      ×
    </button>
  </div>
);
