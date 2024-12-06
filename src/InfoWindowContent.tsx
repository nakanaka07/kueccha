import React, { memo, useMemo } from "react";
import type { Poi } from "./types";
import { isURL } from "./useSheetData";
import { AREAS } from "./appConstants";

const URL_MAX_LENGTH = 30;

const truncateUrl = (url: string) =>
    url.length <= URL_MAX_LENGTH ? url : url.substring(0, URL_MAX_LENGTH) + "...";

const convertUrlsToLinks = (text?: string, title?: string) => {
    if (!text) return null;

    const parts = text.split(/(https?:\/\/[^\s]+)/g);

    return (
        <>
            {title && <strong>{title}: </strong>}
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    {isURL(part) ? (
                        <div>
                            <a href={part} target="_blank" rel="noopener noreferrer" title={part}>
                                {truncateUrl(part)}
                            </a>
                        </div>
                    ) : part.trim() !== "" ? (
                        <div>{part}</div>
                    ) : null}
                </React.Fragment>
            ))}
        </>
    );
};

const InfoWindowContent = memo(({ poi }: { poi: Poi }) => {
    const businessHours = useMemo(() => [
        { day: "月", hours: poi.monday },
        { day: "火", hours: poi.tuesday },
        { day: "水", hours: poi.wednesday },
        { day: "木", hours: poi.thursday },
        { day: "金", hours: poi.friday },
        { day: "土", hours: poi.saturday },
        { day: "日", hours: poi.sunday },
        { day: "祝", hours: poi.holiday },
    ].filter(({ hours }) => !!hours), [poi]);

    const areaDisplayName = AREAS[poi.area] || poi.area;

    const additionalInfo = useMemo(() => [
        { label: "カテゴリー", value: poi.category },
        { label: "ジャンル", value: poi.genre },
        { label: "補足", value: poi.description },
        { label: "予約", value: poi.reservation },
        { label: "支払い", value: poi.payment },
        { label: "電話番号", value: poi.phone },
        { label: "住所", value: poi.address },
        { label: "表示シート", value: areaDisplayName },
    ].filter(({ value }) => !!value), [poi, areaDisplayName]);


    const informationLinks = useMemo(
        () => convertUrlsToLinks(poi.information, "関連情報"),
        [poi.information]
    );
    const viewLinks = useMemo(
        () => convertUrlsToLinks(poi.view, "Googleマップで見る"),
        [poi.view]
    );

    return (
        <div>
            <div>
                <h2>{poi.name}</h2>
            </div>

            {businessHours.length > 0 && (
                <div>
                    {businessHours.map(({ day, hours }, index) => (
                        <div key={index}>
                            <span><strong>{day}: </strong></span>
                            <span>{hours}</span>
                        </div>
                    ))}
                </div>
            )}

            {additionalInfo.length > 0 && (
                <div>
                    {additionalInfo.map(({ label, value }, index) => (
                        <div key={index}>
                            <span><strong>{label}: </strong></span>
                            <span>{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {informationLinks}
            {viewLinks}
        </div>
    );
});

export default InfoWindowContent;
