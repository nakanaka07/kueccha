import React, { useMemo } from 'react';
import type { Poi } from '../types';
import { AREAS } from '../constants';

interface InfoWindowProps {
  poi: Poi;
  onCloseClick: () => void;
}

interface BusinessHour {
  day: string;
  hours: string | undefined;
}

const BUSINESS_HOURS: BusinessHour[] = [
  { day: '月', hours: undefined },
  { day: '火', hours: undefined },
  { day: '水', hours: undefined },
  { day: '木', hours: undefined },
  { day: '金', hours: undefined },
  { day: '土', hours: undefined },
  { day: '日', hours: undefined },
  { day: '祝', hours: undefined },
];

const InfoWindow = React.memo(({ poi, onCloseClick }: InfoWindowProps) => {
  const businessHours = useMemo(
    () =>
      BUSINESS_HOURS.map(({ day }) => ({
        day,
        hours: poi[`${day}day` as keyof Poi],
      })).filter(({ hours }) => hours),
    [poi],
  );

  const encodedAddress = useMemo(
    () => (poi.address ? encodeURIComponent(poi.address) : ''),
    [poi.address],
  );

  const mapUrl = useMemo(
    () => `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    [encodedAddress],
  );

  return (
    <div
      className="bg-white p-4 rounded shadow-lg max-w-sm relative"
      role="dialog"
      aria-labelledby="poi-name"
      aria-modal="true"
    >
      <button
        onClick={onCloseClick}
        className="absolute top-2 right-2 cursor-pointer p-2 hover:bg-gray-100 rounded-full"
        aria-label="閉じる"
      >
        <span aria-hidden="true">&times;</span>
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
                <dd className="text-sm">{typeof hours === 'string' ? hours : ''}</dd>
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
            <a
              href={`tel:${poi.phone}`}
              className="text-blue-600 hover:underline"
              aria-label={`${poi.name}に電話する: ${poi.phone}`}
            >
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
              aria-label={`${poi.name}の場所をGoogleマップで表示`}
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
