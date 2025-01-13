import React from 'react';
import type { InfoWindowProps } from '../../utils/types';
import { AREAS } from '../../utils/constants';
import { formatInformation } from '../../utils/formatters';
import './InfoWindow.css';

// 有効な電話番号かどうかをチェックする関数
const isValidPhoneNumber = (phone: string) => {
  const phoneRegex = /^[0-9-+() ]+$/;
  return phoneRegex.test(phone);
};

// InfoWindowコンポーネント
const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const businessHours = [
    { day: '月曜日', value: poi.monday },
    { day: '火曜日', value: poi.tuesday },
    { day: '水曜日', value: poi.wednesday },
    { day: '木曜日', value: poi.thursday },
    { day: '金曜日', value: poi.friday },
    { day: '土曜日', value: poi.saturday },
    { day: '日曜日', value: poi.sunday },
    { day: '祝祭日', value: poi.holiday },
  ];

  return (
    <div className="info-window">
      <div className="info-header">
        <h2 id="info-window-title">{poi.name}</h2>
        <button
          onClick={onCloseClick}
          aria-label="閉じる"
          className="modal-close-button"
        >
          ×
        </button>
      </div>

      <div className="info-section">
        <ul>
          {businessHours.map(
            (hour) =>
              hour.value && (
                <li key={hour.day}>
                  {hour.day} : {hour.value}
                </li>
              ),
          )}
        </ul>
      </div>

      <div className="info-horizontal">
        {poi.description && (
          <div className="info-section" key="description">
            <h3>補足</h3>
            <p>{poi.description}</p>
          </div>
        )}

        {poi.reservation && (
          <div className="info-section" key="reservation">
            <h3>予約</h3>
            <p>{poi.reservation}</p>
          </div>
        )}

        {poi.payment && (
          <div className="info-section" key="payment">
            <h3>支払</h3>
            <p>{poi.payment}</p>
          </div>
        )}

        {poi.category && (
          <div className="info-section" key="category">
            <h3>カテゴリー</h3>
            <p>{poi.category}</p>
          </div>
        )}

        {poi.genre && (
          <div className="info-section" key="genre">
            <h3>ジャンル</h3>
            <p>{poi.genre}</p>
          </div>
        )}

        {poi.area && (
          <div className="info-section" key="area">
            <h3>エリア</h3>
            <p>{AREAS[poi.area]}</p>
          </div>
        )}

        {poi.phone && (
          <div className="info-section" key="phone">
            <h3>問い合わせ</h3>
            {isValidPhoneNumber(poi.phone) ? (
              <a href={`tel:${poi.phone}`} className="info-link">
                {poi.phone}
              </a>
            ) : (
              <span>{poi.phone}</span>
            )}
          </div>
        )}

        {poi.address && (
          <div className="info-section" key="address">
            <h3>所在地</h3>
            <p>{poi.address}</p>
          </div>
        )}

        {poi.information && (
          <div className="info-section" key="information">
            <h3>関連情報</h3>
            <div className="info-related">
              {formatInformation(poi.information)}
            </div>
          </div>
        )}

        {poi.view && (
          <div className="info-section" key="view">
            <a
              href={poi.view}
              target="_blank"
              rel="noopener noreferrer"
              className="info-button"
            >
              Google マップで見る
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// コンポーネントの表示名を設定
InfoWindow.displayName = 'InfoWindow';

export { InfoWindow };
export default InfoWindow;
