// InfoWindowContent.tsx: インフォウィンドウの内容を表示するコンポーネント
import React, { memo } from "react";
import type { Poi } from "./types.d.ts";
import { isURL } from "./useSheetData";

// URLの最大表示文字数
const URL_MAX_LENGTH = 30;

// 長いURLを省略表示する関数
const truncateUrl = (url: string) => {
    return url.length <= URL_MAX_LENGTH ? url : url.substring(0, URL_MAX_LENGTH) + "...";
};

// 文字列中のURLをリンクに変換する関数
const convertUrlsToLinks = (text?: string) => {
    if (!text) return null;

    // URLとそれ以外のテキストを分割
    const parts = text.split(/(https?:\/\/[^\s]+)/g);

    return (
        <>
            {parts.map((part, index) =>
                isURL(part) ? (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer">
                        {truncateUrl(part)}
                        <br />
                    </a>
                ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                )
            )}
        </>
    );
};

const InfoWindowContent = memo(({ poi }: { poi: Poi }) => {
    // 営業時間情報を整形
    const businessHours = [
        { day: "月", hours: poi.monday },
        { day: "火", hours: poi.tuesday },
        { day: "水", hours: poi.wednesday },
        { day: "木", hours: poi.thursday },
        { day: "金", hours: poi.friday },
        { day: "土", hours: poi.saturday },
        { day: "日", hours: poi.sunday },
        { day: "祝", hours: poi.holiday },
    ].filter(({ hours }) => hours);

    // 追加情報を整形
    const additionalInfo = [
        { label: "補足", value: poi.description },
        { label: "予約", value: poi.reservation },
        { label: "支払い", value: poi.payment },
        { label: "電話番号", value: poi.phone },
        { label: "住所", value: poi.address },
    ].filter(({ value }) => value);


    return (
        <div className="info-window">
            <h3>{poi.name}</h3>

            {/* 営業時間 */}
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
                            <span className="label">{label}: </span>
                            <span className="value">{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 情報(URL) */}
            {convertUrlsToLinks(poi.information)}

            {/* Googleマップのリンク */}
            {convertUrlsToLinks(poi.view)}
        </div>
    );
});

export default InfoWindowContent;
