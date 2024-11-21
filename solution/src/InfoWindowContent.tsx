// InfoWindowContent.tsx
import { memo } from "react";
import type { Poi } from "./types.d.ts";

const InfoWindowContentMemo = memo(({ poi }: { poi: Poi }) => {
  console.log("InfoWindowContentMemo rendered", poi);
  const businessHours = [
    { day: "月", hours: poi.monday },
    { day: "火", hours: poi.tuesday },
    { day: "水", hours: poi.wednesday },
    { day: "木", hours: poi.thursday },
    { day: "金", hours: poi.friday },
    { day: "土", hours: poi.saturday },
    { day: "日", hours: poi.sunday },
    { day: "祝", hours: poi.holiday },
  ];

  const additionalInfo = [
    { label: "補足", value: poi.description },
    { label: "予約", value: poi.reservation },
    { label: "支払い", value: poi.payment },
    { label: "電話番号", value: poi.phone },
    { label: "住所", value: poi.address },
  ];

  return (
    <div className="info-window">
      <h3>{poi.name}</h3>
      <div className="business-hours">
        {businessHours.map(({ day, hours }) => (
          <div key={day} className="hours-row">
            <span className="day">{day}</span>
            <span className="hours">{hours}</span>
          </div>
        ))}
      </div>
      <div className="additional-info">
        {additionalInfo.map(({ label, value }) => value && (
          <div key={label} className="info-row">
            <span className="label">{label}:</span>
            <span className="value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default InfoWindowContentMemo;
