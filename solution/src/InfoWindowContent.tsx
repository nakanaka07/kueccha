// InfoWindowContent.tsx: インフォウィンドウの内容を表示するコンポーネント
import React, { memo } from "react";
import type { Poi } from "./types.d.ts";
import { isURL } from "./useSheetData";

const URL_MAX_LENGTH = 30;

const truncateUrl = (url: string) =>
    url.length <= URL_MAX_LENGTH ? url : url.substring(0, URL_MAX_LENGTH) + "...";

const convertUrlsToLinks = (text?: string, title?: string) => {
    if (!text) return null;
    const parts = text.split(/(https?:\/\/[^\s]+)/g);

    return (
        <>
            {title && <span className="link-title">{title}</span>}
            {parts.map((part, index) =>
                isURL(part) ? (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
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
    const businessHours = [
        { day: "月　", hours: poi.monday },
        { day: "火　", hours: poi.tuesday },
        { day: "水　", hours: poi.wednesday },
        { day: "木　", hours: poi.thursday },
        { day: "金　", hours: poi.friday },
        { day: "土　", hours: poi.saturday },
        { day: "日　", hours: poi.sunday },
        { day: "祝　", hours: poi.holiday },
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

            {businessHours.length > 0 && (
                <div className="business-hours">
                    {businessHours.map(({ day, hours }, index) => (
                        <div key={index} className="hours-row">
                            <span className="day">{day}</span>
                            <span className="hours">{hours}</span>
                        </div>
                    ))}
                </div>
            )}

            {additionalInfo.length > 0 && (
                <div className="additional-info">
                    {additionalInfo.map(({ label, value }, index) => (
                        <div key={index} className="info-row">
                            <span className="label">{label}: </span>
                            <span className="value">{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {convertUrlsToLinks(poi.information, "情報")}
            {poi.information && <br />}

            {convertUrlsToLinks(poi.view, "Googleマップで見る")}
            {poi.view && <br />}
        </div>
    );
});

export default InfoWindowContent;
