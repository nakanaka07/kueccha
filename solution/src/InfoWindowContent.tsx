// InfoWindowContent.tsx: インフォメーションウィンドウの内容を表示するコンポーネント
import React, { memo } from "react";
import type { Poi } from "./types.d.ts";
import { isURL } from "./useSheetData";

// 長いURLを省略表示するための関数
const truncateUrl = (url: string, maxLength = 30) => {
    if (url.length <= maxLength) {
        return url;
    }
    return url.substring(0, maxLength) + "...";
};

// 文字列中のURLをリンクに変換する関数
const convertUrlsToLinks = (text: string | undefined): JSX.Element => {
    // URLとそれ以外のテキストを分割
    const parts = text?.split(/(https?:\/\/[^\s]+)/g) || [];

    return (
        <div>
            {parts.map((part, index) => {
                if (isURL(part)) {
                    return (
                        <React.Fragment key={index}>
                            <a href={part} target="_blank" rel="noopener noreferrer">
                                {truncateUrl(part)}
                            </a>
                            <br />
                        </React.Fragment>
                    );
                }
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </div>
    );
};


const InfoWindowContent = memo(({ poi }: { poi: Poi }) => {
    console.log("InfoWindowContent rendered", poi);

    const businessHours = [
        { day: "月", hours: poi.monday },
        { day: "火", hours: poi.tuesday },
        { day: "水", hours: poi.wednesday },
        { day: "木", hours: poi.thursday },
        { day: "金", hours: poi.friday },
        { day: "土", hours: poi.saturday },
        { day: "日", hours: poi.sunday },
        { day: "祝", hours: poi.holiday },
    ].filter(({ hours }) => !!hours);


    const additionalInfo = [
        { label: "補足", value: poi.description },
        { label: "予約", value: poi.reservation },
        { label: "支払い", value: poi.payment },
        { label: "電話番号", value: poi.phone },
        { label: "住所", value: poi.address },
    ].filter(({ value }) => !!value);

    return (
        <div className="info-window">
        <h3>{poi.name}</h3>
        <div style={{ marginBottom: "10px" }} />

        {businessHours.length > 0 && (
            <div className="business-hours">
                {businessHours.map(({ day, hours }) => (
                    <div key={day} className="hours-row">
                        <span className="day">{day}</span>
                        <span className="hours">{hours}</span>
                    </div>
                ))}
            </div>
        )}

        {/* 追加情報 */}
        {additionalInfo.length > 0 && (
            <div className="additional-info">
                {additionalInfo.map(({ label, value }) => (
                    <div key={label} className="info-row">
                        <span className="label">{label}:</span>
                        <span className="value">{value}</span>
                    </div>
                ))}
            </div>
        )}

        {/* 情報(URL) */}
        {poi.information && (
            <div className="info-row">
                <span className="label">情報:</span>
                <span className="value">{convertUrlsToLinks(poi.information)}</span>
            </div>
        )}

        {/* Googleマップのリンク */}
        {poi.view && (
            <div className="info-row">
                <span className="label">Googleマップ:</span>
                <span className="value">{convertUrlsToLinks(poi.view)}</span>
            </div>
        )}
    </div>
    );
});

export default InfoWindowContent;
