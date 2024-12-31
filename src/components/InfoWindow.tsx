import React, { useMemo } from 'react';
import type { Poi } from '../types';
import { AREAS } from '../constants';

interface InfoWindowProps {
  poi: Poi;
  onCloseClick: () => void;
}

const InfoWindow = React.memo(({ poi, onCloseClick }: InfoWindowProps) => {
  const businessHours = useMemo(
    () =>
      [
        { day: '月', hours: poi.monday },
        { day: '火', hours: poi.tuesday },
        { day: '水', hours: poi.wednesday },
        { day: '木', hours: poi.thursday },
        { day: '金', hours: poi.friday },
        { day: '土', hours: poi.saturday },
        { day: '日', hours: poi.sunday },
        { day: '祝', hours: poi.holiday },
      ].filter(({ hours }) => hours),
    [poi],
  );

  const encodedAddress = encodeURIComponent(`${poi.address}`);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <div
      className="bg-white p-4 rounded shadow-lg max-w-sm relative"
      role="dialog"
      aria-labelledby="poi-name"
    >
      <button
        onClick={onCloseClick}
        className="absolute top-2 right-2 cursor-pointer p-2"
        aria-label="閉じる"
      >
        &times;
      </button>
      <h2 id="poi-name" className="text-lg font-bold mb-2">
        {poi.name}
      </h2>

      {businessHours.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-1">営業時間</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-2">
            {businessHours.map(({ day, hours }) => (
              <React.Fragment key={day}>
                <dt className="text-sm">{day}:</dt>
                <dd className="text-sm">{hours}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      )}

      <div className="grid gap-2 text-sm">
        {poi.category && (
          <div>
            <span className="font-semibold">カテゴリー:</span> {poi.category}
          </div>
        )}
        {poi.genre && (
          <div>
            <span className="font-semibold">ジャンル:</span> {poi.genre}
          </div>
        )}
        {AREAS[poi.area] && (
          <div>
            <span className="font-semibold">エリア:</span> {AREAS[poi.area]}
          </div>
        )}
        {poi.phone && (
          <div>
            <span className="font-semibold">電話:</span>{' '}
            <a href={`tel:${poi.phone}`} className="text-blue-600 hover:underline">
              {poi.phone}
            </a>
          </div>
        )}
        {poi.address && (
          <div>
            <span className="font-semibold">住所:</span>{' '}
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {poi.address}
            </a>
          </div>
        )}
      </div>
    </div>
  );
});

InfoWindow.displayName = 'InfoWindow';

export { InfoWindow };
export default InfoWindow;
