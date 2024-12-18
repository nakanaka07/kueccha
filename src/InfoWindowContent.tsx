// src/InfoWindowContent.tsx

import React, { memo, useMemo } from "react";
import type { Poi } from "./types";
import { AREAS } from "./appConstants";

// URLの最大表示長
const URL_MAX_LENGTH = 30;

// 長いURLを切り詰める関数
const truncateUrl = (url: string): string =>
    url.length <= URL_MAX_LENGTH ? url : url.substring(0, URL_MAX_LENGTH) + "...";

// URLをリンクに変換する関数
const convertUrlsToLinks = (text?: string, title?: string): JSX.Element | null => {
    if (!text) return null;

    // 正規表現でURLを分割
    const parts = text.split(/(https?:\/\/[^\s]+)/g);

    return (
        <>
            {/* タイトルがあれば表示 */}
            {title && <strong>{title}: </strong>}
            {parts.map((part, index) => {
                // URLであればリンクに変換
                try {
                    const url = new URL(part); // URLオブジェクトを作成することでバリデーションを行う
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={part}
                        >
                            {truncateUrl(part)}
                        </a>
                    );
                } catch (error) {
                    // URLでない場合はそのままテキストとして表示
                    if (part.trim() !== "") {
                        return <span key={index}>{part}</span>;
                    }
                    return null;
                }

            })}
        </>
    );
};


const InfoWindowContent = memo(({ poi }: { poi: Poi }): JSX.Element => {
    // エリア名を取得。存在しないエリアの場合はそのままpoi.areaを表示
    const areaDisplayName = AREAS[poi.area] || poi.area;

    // 営業時間情報を生成。useMemoでメモ化することで、poiが変更された場合のみ再計算される
    const businessHours = useMemo(() => {
        return [
            { day: "月", hours: poi.monday },
            { day: "火", hours: poi.tuesday },
            { day: "水", hours: poi.wednesday },
            { day: "木", hours: poi.thursday },
            { day: "金", hours: poi.friday },
            { day: "土", hours: poi.saturday },
            { day: "日", hours: poi.sunday },
            { day: "祝", hours: poi.holiday },
        ].filter(({ hours }) => !!hours); // 営業時間がある日のみ表示
    }, [poi]);

    // 追加情報を生成。useMemoでメモ化することで、poiとareaDisplayNameが変更された場合のみ再計算される
    const additionalInfo = useMemo(() => {
        return [
            { label: "カテゴリー", value: poi.category },
            { label: "ジャンル", value: poi.genre },
            { label: "補足", value: poi.description },
            { label: "予約", value: poi.reservation },
            { label: "支払い", value: poi.payment },
            { label: "電話番号", value: poi.phone },
            { label: "住所", value: poi.address },
            { label: "シート", value: areaDisplayName },
        ].filter(({ value }) => !!value); // 値があるもののみ表示
    }, [poi, areaDisplayName]);

    // 関連情報リンクを生成。useMemoでメモ化することで、poi.informationが変更された場合のみ再計算される
    const informationLinks = useMemo(
        () => convertUrlsToLinks(poi.information, "関連情報"),
        [poi.information]
    );

    // Googleマップで見るリンクを生成。useMemoでメモ化することで、poi.viewが変更された場合のみ再計算される
    const viewLinks = useMemo(
        () => convertUrlsToLinks(poi.view, "Googleマップで見る"),
        [poi.view]
    );


    return (
        <div>
            <h2>{poi.name}</h2>

            {/* 営業時間表示 */}
            {businessHours.length > 0 && (
                <div>
                    {businessHours.map(({ day, hours }, index) => (
                        <div key={index}>
                            <strong>{day}: </strong> {hours}
                        </div>
                    ))}
                </div>
            )}

            {/* 追加情報表示 */}
            {additionalInfo.length > 0 && (
                <div>
                    {additionalInfo.map(({ label, value }, index) => (
                        <div key={index}>
                            <strong>{label}: </strong> {value}
                        </div>
                    ))}
                </div>
            )}

            {/* 関連情報リンクとGoogleマップで見るリンクを表示 */}
            {informationLinks}
            {viewLinks}
        </div>
    );
});

export default InfoWindowContent;
