import React, { useMemo } from 'react';
import { PointOfInterest } from '@/types/poi';
import { formatWeekdaySchedule } from '@utils/markerUtils';
import '@/global.css';

interface InfoWindowProps {
  /**
   * 表示対象のPOI情報
   */
  poi: PointOfInterest;
  
  /**
   * ウィンドウを閉じるときのコールバック
   */
  onClose?: () => void;
  
  /**
   * POI詳細表示画面を開くときのコールバック
   */
  onViewDetails?: (poi: PointOfInterest) => void;
}

/**
 * 地図上のマーカーをクリックした際に表示される情報ウィンドウコンポーネント
 * POIの基本情報を表示し、詳細表示への導線を提供します
 */
const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onClose, onViewDetails }) => {
  // POI情報から営業スケジュールを生成
  const scheduleInfo = useMemo(() => formatWeekdaySchedule(poi), [poi]);

  // カテゴリーのバッジ表示用クラスを生成
  const getCategoryClass = (category: string) => {
    switch (category) {
      case '和食': return 'category-badge japanese';
      case '洋食': return 'category-badge western';
      case 'その他': return 'category-badge other';
      case '販売': return 'category-badge retail';
      default: return 'category-badge';
    }
  };

  // 営業状態に応じたステータスバッジを表示
  const StatusBadge = () => {
    if (poi.isClosed) {
      return <span className="status-badge closed" aria-label="閉店">閉店</span>;
    }
    
    const now = new Date();
    const day = now.getDay(); // 0: 日曜, 1: 月曜, ...
    const dayNames = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];
    const currentDayName = dayNames[day];
    
    // 現在の曜日が定休日かどうかチェック
    // 型安全なアクセス方法を使用
    const dayOffKey = `${currentDayName}定休日` as keyof PointOfInterest;
    const isDayOff = poi[dayOffKey] === true;
    
    if (isDayOff) {
      return <span className="status-badge day-off" aria-label="本日定休日">本日定休日</span>;
    }
    
    // 営業時間内かどうかのチェック（簡易版）
    // Note: 実際には、現在時刻と営業時間を比較する詳細なロジックが必要
    return <span className="status-badge open" aria-label="営業中">営業中</span>;
  };

  return (
    <div className="info-window" role="dialog" aria-labelledby="info-window-title">
      <div className="info-window-header">
        <h2 id="info-window-title" className="info-window-title">
          {poi.name}
          <StatusBadge />
        </h2>
        {onClose && (
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="info-window-content">
        {/* カテゴリとジャンル */}
        <div className="info-section">
          {poi.categories && poi.categories.map((category, index) => (
            <span key={index} className={getCategoryClass(category)}>
              {category}
            </span>
          ))}
          {poi.genre && <p className="genre">{poi.genre}</p>}
        </div>
        
        {/* 住所と地区 */}
        <div className="info-section">
          <h3 className="section-title">
            <span className="icon-location" aria-hidden="true">📍</span>
            所在地
          </h3>
          <p className="address">
            {poi.address}
            {poi.district && <span className="district">（{poi.district}地区）</span>}
          </p>
        </div>
        
        {/* 営業情報 */}
        <div className="info-section">
          <h3 className="section-title">
            <span className="icon-time" aria-hidden="true">🕒</span>
            営業情報
          </h3>
          {scheduleInfo.regularHours ? (
            <div className="business-hours">
              <p className="hours">{scheduleInfo.regularHours}</p>
              {scheduleInfo.daysOff && (
                <p className="days-off">定休日: {scheduleInfo.daysOff}</p>
              )}
              {poi.定休日について && (
                <p className="special-note">{poi.定休日について}</p>
              )}
            </div>
          ) : (
            <p className="no-info">営業時間情報がありません</p>
          )}
        </div>
        
        {/* 連絡先 */}
        {poi.問い合わせ && (
          <div className="info-section">
            <h3 className="section-title">
              <span className="icon-contact" aria-hidden="true">📞</span>
              連絡先
            </h3>
            <p className="contact">
              <a href={`tel:${poi.問い合わせ}`} className="phone-link">
                {poi.問い合わせ}
              </a>
            </p>
          </div>
        )}
        
        {/* Google Mapsリンク */}
        {poi['Google マップで見る'] && (
          <div className="info-section">
            <a 
              href={poi['Google マップで見る']} 
              target="_blank" 
              rel="noopener noreferrer"
              className="google-maps-link"
            >
              Google マップで見る
            </a>
          </div>
        )}
      </div>
      
      <div className="info-window-footer">
        {onViewDetails && (
          <button 
            className="details-button"
            onClick={() => onViewDetails(poi)}
            aria-label="詳細情報を見る"
          >
            詳細情報を見る
          </button>
        )}
      </div>
    </div>
  );
};

export default InfoWindow;