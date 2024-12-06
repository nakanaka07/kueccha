import React, { memo, useMemo } from "react";
import type { Poi } from "./types";
import { isURL } from "./useSheetData";

// URLの最大表示文字数。これを超える場合は省略表示
const URL_MAX_LENGTH = 30;

// 長いURLを省略表示するための関数
const truncateUrl = (url: string) =>
	url.length <= URL_MAX_LENGTH ? url : url.substring(0, URL_MAX_LENGTH) + "...";

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
			{title && <strong>{title}</strong>} {/* タイトルを太字にする */}
			{parts.map((part, index) => {
				// 各URLを <div> で囲み、改行を入れる
				return (
					<React.Fragment key={index}>
						{isURL(part) ? (
							<div>
								<a href={part} target="_blank" rel="noopener noreferrer" title={part}>
									{truncateUrl(part)}
								</a>
							</div>
						) : part.trim() !== "" ? (
							<div>{part}</div> // テキスト部分も<div>で囲み、改行を入れる
						) : null}
					</React.Fragment>
				);
			})}
		</>
	);
};

const InfoWindowContent = memo(({ poi }: { poi: Poi }) => {
	// 営業時間情報を生成。営業時間のある曜日だけを表示
	const businessHours = useMemo(() => {
		// オブジェクトの配列を直接 filter
		return [
			{ day: "月　", hours: poi.monday },
			{ day: "火　", hours: poi.tuesday },
			{ day: "水　", hours: poi.wednesday },
			{ day: "木　", hours: poi.thursday },
			{ day: "金　", hours: poi.friday },
			{ day: "土　", hours: poi.saturday },
			{ day: "日　", hours: poi.sunday },
			{ day: "祝　", hours: poi.holiday },
		].filter(({ hours }) => !!hours);
	}, [poi]);

	// 追加情報を生成。値のあるものだけを表示
	const additionalInfo = useMemo(() => {
		// オブジェクトの配列を直接 filter
		return [
			{ label: "補足", value: poi.description },
			{ label: "予約", value: poi.reservation },
			{ label: "支払い", value: poi.payment },
			{ label: "電話番号", value: poi.phone },
			{ label: "住所", value: poi.address },
		].filter(({ value }) => !!value);
	}, [poi]);


	const informationLinks = useMemo(
		() => convertUrlsToLinks(poi.information, "情報"),
		[poi.information]
	);
	const viewLinks = useMemo(
		() => convertUrlsToLinks(poi.view, "Googleマップで見る"),
		[poi.view]
	);

	return (
		<div> {/* 外側の div 要素をそのまま使用 */}
            <div> {/* title-bar のクラス名を削除 */}
                <h2>{poi.name}</h2> {/* スタイルをインラインで指定しない */}
            </div>
			{businessHours.length > 0 && (
				<div>
					{businessHours.map(({ day, hours }, index) => (
						<div key={index}> {/* hours-row のクラス名を削除 */}
							<span>{day}</span> {/* day のクラス名を削除 */}
							<span>{hours}</span> {/* hours のクラス名を削除 */}
						</div>
					))}
				</div>
			)}

			{additionalInfo.length > 0 && (
				<div>
					{additionalInfo.map(({ label, value }, index) => (
						<div key={index}> {/* info-row のクラス名を削除 */}
							<span>{label}: </span> {/* label のクラス名を削除 */}
							<span>{value}</span> {/* value のクラス名を削除 */}
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
