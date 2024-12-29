// components/InfoWindow.tsx
import React from 'react';
import type { Poi } from '../types';
import { AREAS } from '../types';

interface InfoWindowProps {
  poi: Poi;
}

const InfoWindow = React.memo(({ poi }: InfoWindowProps) => {
  // 関数コンポーネントに名前を付ける
  const businessHours = [
    { day: '月', hours: poi.monday },
    { day: '火', hours: poi.tuesday },
    { day: '水', hours: poi.wednesday },
    { day: '木', hours: poi.thursday },
    { day: '金', hours: poi.friday },
    { day: '土', hours: poi.saturday },
    { day: '日', hours: poi.sunday },
    { day: '祝', hours: poi.holiday },
  ];

  return (
    <div className="bg-white p-4 rounded shadow-lg max-w-sm">
      <h3 className="text-lg font-bold mb-2">{poi.name}</h3>

      {businessHours.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-1">営業時間</h4>
          {businessHours.map(({ day, hours }) => (
            <div key={day} className="text-sm">
              {day}: {hours}
            </div>
          ))}
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
            <span className="font-semibold">電話:</span> {poi.phone}
          </div>
        )}
        {poi.address && (
          <div>
            <span className="font-semibold">住所:</span> {poi.address}
          </div>
        )}
      </div>
    </div>
  );
});

InfoWindow.displayName = 'InfoWindow'; // displayNameを設定

export { InfoWindow }; // export方法を変更
