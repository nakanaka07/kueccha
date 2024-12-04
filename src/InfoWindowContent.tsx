import React, { memo, useMemo } from "react";
import type { Poi } from "./types";
import { isURL } from "./useSheetData";

// URLの最大表示文字数。これを超える場合は省略表示
const URL_MAX_LENGTH = 30;

// 長いURLを省略表示するための関数
const truncateUrl = (url: string) => url.length <= URL_MAX_LENGTH ? url : url.substring(0, URL_MAX_LENGTH) + "...";

/**
 * テキスト中のURLをリンクに変換する関数
 * @param text URLを含む可能性のあるテキスト
 * @param title リンクの前に表示するタイトル (オプション)
 * @returns リンクを含むReactノード、またはnull (textがnullまたはundefinedの場合)
 */
const convertUrlsToLinks = (text?: string, title?: string) => {
    if (!text) return null; // textがなければnullを返す

    // 正規表現を使ってURLを分割
    const parts = text.split(/(https?:\/\/[^\s]+)/g);

    return (
        <>
            {title && <span className="link-title">{title}</span>} {/* titleがあれば表示 */}
            {parts.map((part, index) => {
                // partがURLであればリンクに変換
                if (isURL(part)) {
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank" // 新しいタブで開く
                            rel="noopener noreferrer" // セキュリティ対策
                            title={part} // リンクにマウスオーバーした時にフルURLを表示
                        >
                            {" "}
                            {truncateUrl(part)} {/* 省略表示されたURLを表示 */}
                            <br />
                        </a>
                    );
                }
                // partがURLでなく、空白でなければテキストとして表示
                return part.trim() !== "" ? <React.Fragment key={index}>{part}</React.Fragment> : null;
            })}
        </>
    );
};


const InfoWindowContent = memo(({ poi }: { poi: Poi }) => {
    // 営業時間情報を生成。営業時間のある曜日だけを表示
    const businessHours = useMemo(() => [
        { day: "月　", hours: poi.monday },
        { day: "火　", hours: poi.tuesday },
        { day: "水　", hours: poi.wednesday },
        { day: "木　", hours: poi.thursday },
        { day: "金　", hours: poi.friday },
        { day: "土　", hours: poi.saturday },
        { day: "日　", hours: poi.sunday },
        { day: "祝　", hours: poi.holiday },
    ].filter(({ hours }) => !!hours), [poi]); // poiが変更された場合のみ再計算

    // 追加情報を生成。値のあるものだけを表示
    const additionalInfo = useMemo(() => [
        { label: "補足", value: poi.description },
        { label: "予約", value: poi.reservation },
        { label: "支払い", value: poi.payment },
        { label: "電話番号", value: poi.phone },
        { label: "住所", value: poi.address },
    ].filter(({ value }) => !!value), [poi]); // poiが変更された場合のみ再計算

    // リンク情報を生成
    const informationLinks = useMemo(() => convertUrlsToLinks(poi.information, "情報"), [poi.information]); // poi.informationが変更された場合のみ再計算
    const viewLinks = useMemo(() => convertUrlsToLinks(poi.view, "Googleマップで見る"), [poi.view]); // poi.viewが変更された場合のみ再計算

    return (
        <div className="info-window">
            <h4>{poi.name}</h4> {/* POIの名前 */}

            {/* 営業時間 */}
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

            {/* 追加情報 */}
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

            {/* リンク情報 */}
            {informationLinks}
            {viewLinks}
        </div>
    );
});

export default InfoWindowContent;
