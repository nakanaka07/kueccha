import React, { useEffect, useRef } from 'react'; // Reactと必要なフックをインポート
import type { InfoWindowProps } from '../../utils/types'; // InfoWindowProps型をインポート
import { AREAS } from '../../utils/constants'; // エリア定数をインポート
import { formatInformation } from '../../utils/formatters'; // 情報フォーマット関数をインポート
import './InfoWindow.css'; // スタイルシートをインポート

// 電話番号が有効かどうかをチェックする関数
const isValidPhoneNumber = (phone: string) => {
  const phoneRegex = /^[0-9-+() ]+$/; // 電話番号の正規表現
  return phoneRegex.test(phone); // 正規表現にマッチするかどうかを返す
};

const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onCloseClick }) => {
  const infoWindowRef = useRef<HTMLDivElement>(null); // InfoWindowの参照を保持するためのref

  useEffect(() => {
    const handleResize = () => {
      if (infoWindowRef.current) {
        const windowHeight = window.innerHeight; // ウィンドウの高さを取得
        const maxHeight = windowHeight - 150; // 最大高さを設定
        infoWindowRef.current.style.maxHeight = `${maxHeight}px`; // InfoWindowの最大高さを設定
      }
    };

    window.addEventListener('resize', handleResize); // リサイズイベントリスナーを追加
    handleResize(); // 初回実行

    return () => {
      window.removeEventListener('resize', handleResize); // クリーンアップ関数でリサイズイベントリスナーを削除
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        infoWindowRef.current &&
        !infoWindowRef.current.contains(event.target as Node)
      ) {
        onCloseClick(); // InfoWindowの外側がクリックされた場合に閉じる
      }
    };

    document.addEventListener('mousedown', handleClickOutside); // マウスダウンイベントリスナーを追加

    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // クリーンアップ関数でマウスダウンイベントリスナーを削除
    };
  }, [onCloseClick]);

  const businessHours = [
    { day: '月曜日', value: poi.monday },
    { day: '火曜日', value: poi.tuesday },
    { day: '水曜日', value: poi.wednesday },
    { day: '木曜日', value: poi.thursday },
    { day: '金曜日', value: poi.friday },
    { day: '土曜日', value: poi.saturday },
    { day: '日曜日', value: poi.sunday },
    { day: '祝祭日', value: poi.holiday },
  ]; // 営業時間の配列を定義

  return (
    <div
      className="info-window"
      ref={infoWindowRef} // InfoWindowの参照を設定
      onClick={(e) => e.stopPropagation()} // クリックイベントを伝播させない
    >
      <div className="info-header">
        <h2 id="info-window-title">{poi.name}</h2> {/* POIの名前を表示 */}
        <button
          onClick={onCloseClick} // 閉じるボタンのクリックハンドラを設定
          aria-label="閉じる" // アクセシビリティのためのラベルを設定
          className="modal-close-button" // クラス名を設定
          title="閉じます。" // タイトルを設定
        >
          ×
        </button>
      </div>

      <div className="info-content">
        {businessHours.some((hour) => hour.value) && (
          <div className="info-section">
            <ul>
              {businessHours.map((hour, index) =>
                hour.value ? (
                  <li key={index}>
                    <span className="day">{hour.day}</span> {/* 曜日を表示 */}
                    <span className="value">{hour.value}</span>{' '}
                    {/* 営業時間を表示 */}
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        )}

        <div className="info-horizontal">
          {[
            {
              key: 'description',
              condition: poi.description,
              title: '補足',
              content: <p>{poi.description}</p>,
            },
            {
              key: 'reservation',
              condition: poi.reservation,
              title: '予約',
              content: <p>{poi.reservation}</p>,
            },
            {
              key: 'payment',
              condition: poi.payment,
              title: '支払',
              content: <p>{poi.payment}</p>,
            },
            {
              key: 'category',
              condition: poi.category,
              title: 'カテゴリー',
              content: <p>{poi.category}</p>,
            },
            {
              key: 'genre',
              condition: poi.genre,
              title: 'ジャンル',
              content: <p>{poi.genre}</p>,
            },
            {
              key: 'area',
              condition: poi.area,
              title: 'エリア',
              content: <p>{AREAS[poi.area]}</p>,
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
            },
            {
              key: 'address',
              condition: poi.address,
              title: '所在地',
              content: <p>{poi.address}</p>,
            },
            {
              key: 'information',
              condition: poi.information,
              title: '関連情報',
              content: (
                <div className="info-related">
                  {poi.information ? formatInformation(poi.information) : null}
                </div>
              ),
            },
            {
              key: 'view',
              condition: poi.view,
              title: '',
              content: (
                <a
                  href={poi.view}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="info-button"
                >
                  Google マップで見る
                </a>
              ),
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

InfoWindow.displayName = 'InfoWindow'; // コンポーネントの表示名を設定

export { InfoWindow }; // InfoWindowコンポーネントをエクスポート
export default InfoWindow; // デフォルトエクスポート
