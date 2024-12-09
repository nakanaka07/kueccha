// src/InfoWindowContent.tsx

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
			{parts.map((part, index) => {
				if (isURL(part)) {
					return (
						<div key={index}>
							<a
								href={part}
								target="_blank"
								rel="noopener noreferrer"
								title={part}
							>
								{truncateUrl(part)}
							</a>
						</div>
					);
				}
				if (part.trim() !== "") {
					return <div key={index}>{part}</div>;
				}
				return null;
			})}
		</>
	);
};

const InfoWindowContent = memo(({ poi }: { poi: Poi }) => {
	const areaDisplayName = AREAS[poi.area] || poi.area;

	const businessHours = useMemo(
		() =>
			[
				{ day: "月", hours: poi.monday },
				{ day: "火", hours: poi.tuesday },
				{ day: "水", hours: poi.wednesday },
				{ day: "木", hours: poi.thursday },
				{ day: "金", hours: poi.friday },
				{ day: "土", hours: poi.saturday },
				{ day: "日", hours: poi.sunday },
				{ day: "祝", hours: poi.holiday },
			].filter(({ hours }) => !!hours),
		[poi]
	);

	const additionalInfo = useMemo(
		() =>
			[
				{ label: "カテゴリー", value: poi.category },
				{ label: "ジャンル", value: poi.genre },
				{ label: "補足", value: poi.description },
				{ label: "予約", value: poi.reservation },
				{ label: "支払い", value: poi.payment },
				{ label: "電話番号", value: poi.phone },
				{ label: "住所", value: poi.address },
				{ label: "シート", value: areaDisplayName },
			].filter(({ value }) => !!value),
		[poi, areaDisplayName]
	);

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
			<h2>{poi.name}</h2>

			{businessHours.length > 0 && (
				<div>
					{businessHours.map(({ day, hours }, index) => (
						<div key={index}>
							<strong>{day}: </strong> {hours}
						</div>
					))}
				</div>
			)}

			{additionalInfo.length > 0 && (
				<div>
					{additionalInfo.map(({ label, value }, index) => (
						<div key={index}>
							<strong>{label}: </strong> {value}
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
