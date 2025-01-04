import React from 'react';
import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import type { InfoWindowProps } from '../../../types';
import { AREAS } from '../../../constants';
import { formatInformation } from '../../../utils/formatters';
import '../../../App.css'; // スタイルシートをインポート

// 有効な電話番号かどうかをチェックする関数
const isValidPhoneNumber = (phone: string) => {
  const phoneRegex = /^[0-9-+() ]+$/;
  return phoneRegex.test(phone);
};

// InfoWindowコンポーネント
const InfoWindow = ({ poi, onCloseClick }: InfoWindowProps) => {
  // POIの位置情報を設定
  const position = {
    lat: poi.location.lat,
    lng: poi.location.lng,
  };

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
    <GoogleInfoWindow position={position} onCloseClick={onCloseClick}>
      <div className="info-window">
        <h2>{poi.name}</h2>

        <ul>
          {businessHours.map(
            (hour, index) =>
              hour.value && (
                <li key={index}>
                  {hour.day} : {hour.value}
                </li>
              ),
          )}
        </ul>

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
              <div className="info-related">{formatInformation(poi.information)}</div>
            </div>
          )}

          {poi.view && (
            <div className="info-section" key="view">
              <a href={poi.view} target="_blank" rel="noopener noreferrer" className="info-button">
                Google マップで見る
              </a>
            </div>
          )}
        </div>
      </div>
    </GoogleInfoWindow>
  );
};

// コンポーネントの表示名を設定
InfoWindow.displayName = 'InfoWindow';

export { InfoWindow };
export default InfoWindow;
