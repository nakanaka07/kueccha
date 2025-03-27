import React, { useState } from 'react';

import { POIFooter } from '@/components/POIFooter';
import { POIHeader } from '@/components/POIHeader';
import { InfoTabContent, HoursTabContent, MapTabContent } from '@/components/POITabContents';
import { PointOfInterest } from '@/types/poi';
import '@/global.css';

interface POIDetailsProps {
  /**
   * 表示対象のPOI情報
   */
  poi: PointOfInterest;

  /**
   * 詳細画面を閉じるときのコールバック
   */
  onClose: () => void;
}

/**
 * タブナビゲーションコンポーネント
 */
const TabNavigation: React.FC<{
  activeTab: string;
  setActiveTab: (tab: 'info' | 'hours' | 'map') => void;
}> = ({ activeTab, setActiveTab }) => (
  <div className='poi-tabs'>
    <button
      type='button'
      className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
      onClick={() => setActiveTab('info')}
    >
      基本情報
    </button>
    <button
      type='button'
      className={`tab-button ${activeTab === 'hours' ? 'active' : ''}`}
      onClick={() => setActiveTab('hours')}
    >
      営業時間
    </button>
    <button
      type='button'
      className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
      onClick={() => setActiveTab('map')}
    >
      地図
    </button>
  </div>
);

/**
 * POI詳細情報表示コンポーネント
 * 選択されたPOIの詳細情報を表示します
 */
const POIDetails: React.FC<POIDetailsProps> = ({ poi, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'hours' | 'map'>('info');

  return (
    <div className='poi-details-container'>
      <POIHeader poi={poi} onClose={onClose} />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* タブコンテンツ */}
      {activeTab === 'info' && <InfoTabContent poi={poi} />}
      {activeTab === 'hours' && <HoursTabContent poi={poi} />}
      {activeTab === 'map' && <MapTabContent poi={poi} />}

      <POIFooter poi={poi} />
    </div>
  );
};

export default POIDetails;
