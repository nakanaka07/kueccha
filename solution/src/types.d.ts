// types.d.ts: アプリケーションで使用する型定義

import { LatLngLiteral } from "@react-google-maps/api";

// POI（Point Of Interest）の型定義
export type Poi = {
    id: string; // POI の ID
    name: string; // 名称
    area: string; // エリア
    location: LatLngLiteral; // 位置情報（緯度経度）
    monday?: string; // 月曜日の営業時間
    tuesday?: string; // 火曜日の営業時間
    wednesday?: string; // 水曜日の営業時間
    thursday?: string; // 木曜日の営業時間
    friday?: string; // 金曜日の営業時間
    saturday?: string; // 土曜日の営業時間
    sunday?: string; // 日曜日の営業時間
    holiday?: string; // 祝日の営業時間
    description?: string; // 補足情報
    reservation?: string; // 予約情報
    payment?: string; // 支払い情報
    phone?: string; // 電話番号
    address: string; // 住所
};
