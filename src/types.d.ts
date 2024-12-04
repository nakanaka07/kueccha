import { AreaType } from "./appConstants";

// POI (Point of Interest) のデータ構造を定義するインターフェース
export interface Poi {
    key: string;                // POIの一意なID
    location: google.maps.LatLngLiteral; // POIの緯度経度情報
    name: string;              // POIの名称 (必須)
    category?: string;         // POIのカテゴリ
    genre?: string;            // POIのジャンル
    information?: string;      // POIの情報 (URLを含む可能性あり)
    monday?: string;           // 月曜日の営業時間
    tuesday?: string;          // 火曜日の営業時間
    wednesday?: string;        // 水曜日の営業時間
    thursday?: string;         // 木曜日の営業時間
    friday?: string;           // 金曜日の営業時間
    saturday?: string;         // 土曜日の営業時間
    sunday?: string;           // 日曜日の営業時間
    holiday?: string;          // 祝日の営業時間
    description?: string;      // POIの補足説明
    reservation?: string;       // 予約情報
    payment?: string;         // 支払い情報
    phone?: string;            // 電話番号
    address?: string;          // 住所
    view?: string;            // GoogleマップのURL
    area: AreaType;            // POIが属するエリア (必須)
}
