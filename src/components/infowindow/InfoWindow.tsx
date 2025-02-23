// Reactと必要なフックをインポート
import React, { useEffect, useRef, useMemo } from 'react';
// CSSファイルをインポート
import './InfoWindow.css';
// 定数をインポート
import { AREAS, INFO_WINDOW_BUSINESS_HOURS } from '../../utils/constants';
// フォーマット関数とバリデーション関数をインポート
import { formatInformation, isValidPhoneNumber } from '../../utils/formatters';
// 型定義をインポート
import type { InfoWindowProps, LatLngLiteral, BusinessHourKey } from '../../utils/types';

// InfoWindowコンポーネントを定義
const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  // InfoWindowのDOM要素を参照するためのrefを作成
  const infoWindowRef = useRef<HTMLDivElement>(null);

  // ウィンドウのリサイズ時にInfoWindowの最大高さを調整する関数
  const handleResize = () => {
    if (infoWindowRef.current) {
      const windowHeight = window.innerHeight;
      const maxHeight = windowHeight - 150;
      infoWindowRef.current.style.maxHeight = `${maxHeight}px`;
    }
  };

  // InfoWindowの外側をクリックしたときに閉じる関数
  const handleClickOutside = (event: MouseEvent) => {
    if (infoWindowRef.current && !infoWindowRef.current.contains(event.target as Node)) {
      console.log('Clicked outside InfoWindow'); // ログ出力を追加
      onCloseClick();
    }
  };

  // コンポーネントのマウント時とアンマウント時にリサイズイベントリスナーを追加/削除
  useEffect(() => {
    console.log('InfoWindow mounted'); // ログ出力を追加
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      console.log('InfoWindow unmounted'); // ログ出力を追加
    };
  }, []);

  // コンポーネントのマウント時とアンマウント時にクリックイベントリスナーを追加/削除
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // 緯度と経度をフォーマットする関数
  const formatLocation = (location: LatLngLiteral) => {
    return `緯度: ${location.lat}, 経度: ${location.lng}`;
  };

  // 営業時間の情報をメモ化してパフォーマンスを最適化
  const businessHoursContent = useMemo(
    () =>
      INFO_WINDOW_BUSINESS_HOURS.map(
        (hour) =>
          poi[hour.key as BusinessHourKey] && (
            <div key={hour.key}>
              <span className="day">{hour.day}</span>
              <span className="value">{poi[hour.key as BusinessHourKey]}</span>
            </div>
          ),
      ),
    [poi],
  );

  return (
    // InfoWindowのコンテナ
    <div className="info-window" ref={infoWindowRef} onClick={(e) => e.stopPropagation()}>
      {/* ヘッダー部分 */}
      <div className="info-header">
        <h2 id="info-window-title">{poi.name}</h2>
        <button
          onClick={() => {
            console.log('Close button clicked'); // ログ出力を追加
            onCloseClick();
          }}
          aria-label="閉じる"
          className="modal-close-button"
          title="閉じます。"
        >
          ×
        </button>
      </div>

      {/* コンテンツ部分 */}
      <div className="info-content">
        {INFO_WINDOW_BUSINESS_HOURS.some((hour) => poi[hour.key]) && (
          <div className="info-section">{businessHoursContent}</div>
        )}

        <div className="info-horizontal">
          {poi.location && (
            <div className="info-section">
              <span className="day">位置</span>
              <span className="value">
                {typeof poi.location === 'string' ? poi.location : formatLocation(poi.location)}
              </span>
            </div>
          )}
          {[
            {
              key: 'description',
              condition: poi.holidayInfo,
              title: '定休日について',
              content: <p>{poi.holidayInfo}</p>,
              description: 'この場所の定休日に関する情報です。',
            },
            {
              key: 'reservation',
              condition: poi.parking,
              title: '駐車場',
              content: <p>{poi.parking}</p>,
              description: '駐車場の有無や詳細についての情報です。',
            },
            {
              key: 'payment',
              condition: poi.payment,
              title: 'キャッシュレス',
              content: <p>{poi.payment}</p>,
              description: '利用可能な支払い方法についての情報です。',
            },
            {
              key: 'category',
              condition: poi.category,
              title: 'カテゴリー',
              content: <p>{poi.category}</p>,
              description: 'この場所のカテゴリーに関する情報です。',
            },
            {
              key: 'genre',
              condition: poi.genre,
              title: 'ジャンル',
              content: <p>{poi.genre}</p>,
              description: 'この場所のジャンルに関する情報です。',
            },
            {
              key: 'area',
              condition: poi.area,
              title: 'エリア',
              content: <p>{AREAS[poi.area]}</p>,
              description: 'この場所が属するエリアに関する情報です。',
            },
            {
              key: 'phone',
              condition: poi.phone,
              title: '問い合わせ',
              content:
                poi.phone && isValidPhoneNumber(poi.phone) ? (
                  <a href={`tel:${poi.phone}`} className="info-link">
                    {poi.phone}
                  </a>
                ) : (
                  <span>{poi.phone}</span>
                ),
              description: 'この場所への問い合わせ先の電話番号です。',
            },
            {
              key: 'address',
              condition: poi.address,
              title: '所在地',
              content: <p>{poi.address}</p>,
              description: 'この場所の住所に関する情報です。',
            },
            {
              key: 'information',
              condition: poi.information,
              title: '関連情報',
              content: (
                <div className="info-related">{poi.information ? formatInformation(poi.information) : null}</div>
              ),
              description: 'この場所に関連する追加情報です。',
            },
            {
              key: 'view',
              condition: poi.view,
              title: '',
              content: (
                <a href={poi.view} target="_blank" rel="noopener noreferrer" className="info-button">
                  Google マップで写真を見る
                </a>
              ),
              description: 'Google マップでこの場所の写真を見ることができます。',
            },
          ].map((item) =>
            item.condition ? (
              <div className="info-section" key={item.key}>
                {item.title && <h3>{item.title}</h3>}
                {item.content}
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
};

// コンポーネントの表示名を設定
InfoWindow.displayName = 'InfoWindow';

// コンポーネントをエクスポート
export { InfoWindow };
export default InfoWindow;
