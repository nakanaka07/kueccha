// InfoWindowContent.tsx: 情報ウィンドウのコンテンツを表示するコンポーネント
import { memo } from "react";
import type { Poi } from "./types.d.ts";

// メモ化することでパフォーマンスを向上
const InfoWindowContent = memo(({ poi }: { poi: Poi }) => {
  // 開発モードでのみコンソールログを出力
  if (import.meta.env.MODE === 'development') {
    console.log("InfoWindowContent レンダリング", poi);
  }

  // 営業時間のデータ。nullチェックと空文字列チェックを追加
  const businessHours = [
    { day: "月", hours: poi.monday && poi.monday !== '' ? poi.monday : '営業時間不明' },
    { day: "火", hours: poi.tuesday && poi.tuesday !== '' ? poi.tuesday : '営業時間不明' },
    { day: "水", hours: poi.wednesday && poi.wednesday !== '' ? poi.wednesday : '営業時間不明' },
    { day: "木", hours: poi.thursday && poi.thursday !== '' ? poi.thursday : '営業時間不明' },
    { day: "金", hours: poi.friday && poi.friday !== '' ? poi.friday : '営業時間不明' },
    { day: "土", hours: poi.saturday && poi.saturday !== '' ? poi.saturday : '営業時間不明' },
    { day: "日", hours: poi.sunday && poi.sunday !== '' ? poi.sunday : '営業時間不明' },
    { day: "祝", hours: poi.holiday && poi.holiday !== '' ? poi.holiday : '営業時間不明' },
  ];

  // 追加情報のデータ。値が falsy な項目は除外
  const additionalInfo = [
    { label: "補足", value: poi.description },
    { label: "予約", value: poi.reservation },
    { label: "支払い", value: poi.payment },
    { label: "電話番号", value: poi.phone },
    { label: "住所", value: poi.address },
  ].filter(({ value }) => value);

  return (
    <div className="info-window">
      <h3>{poi.name}</h3> {/* 店舗名 */}
      <div className="business-hours">
        {/* 営業時間 */}
        {businessHours.map(({ day, hours }) => (
          <div key={day} className="hours-row">
            <span className="day">{day}:</span>
            <span className="hours">{hours}</span>
          </div>
        ))}
      </div>
      {additionalInfo.length > 0 && ( // 追加情報がある場合のみ表示
        <div className="additional-info">
          {/* 追加情報 */}
          {additionalInfo.map(({ label, value }) => (
            <div key={label} className="info-row">
              <span className="label">{label}:</span>
              <span className="value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default InfoWindowContent;
