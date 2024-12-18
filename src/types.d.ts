// src/types.d.ts
import { AreaType } from "./appConstants";

// POI（Point of Interest）のデータ型定義
export interface Poi {
    key: string; // POIを一意に識別するためのキー
    location: google.maps.LatLngLiteral; // POIの緯度経度情報
    name: string;  // POIの名前
    category?: string; // POIのカテゴリー（オプション）
    genre?: string; // POIのジャンル（オプション）
    information?: string; // POIの関連情報URL（オプション）
    monday?: string; // 月曜日の営業時間（オプション）
    tuesday?: string; // 火曜日の営業時間（オプション）
    wednesday?: string; // 水曜日の営業時間（オプション）
    thursday?: string; // 木曜日の営業時間（オプション）
    friday?: string; // 金曜日の営業時間（オプション）
    saturday?: string; // 土曜日の営業時間（オプション）
    sunday?: string; // 日曜日の営業時間（オプション）
    holiday?: string; // 祝日の営業時間（オプション）
    description?: string; // POIの説明（オプション）
    reservation?: string; // 予約情報（オプション）
    payment?: string; // 支払い情報（オプション）
    phone?: string; // 電話番号（オプション）
    address?: string; // 住所（オプション）
    view?: string; // GoogleマップのURL（オプション）
    area: AreaType; // POIが属するエリア
}
