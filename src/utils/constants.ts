/**
 * アプリケーション定数ファイル
 *
 * このファイルは、アプリケーション全体で使用される定数を一元管理します。
 * マップ関連の設定、マーカーのスタイル、エラーメッセージなど、
 * アプリケーション全体で共通して使用される値を定義しています。
 */

/**
 * 必要なライブラリとアセットのインポート
 */
// Google Maps APIの型定義をインポート
import { LoadScriptProps } from '@react-google-maps/api';
// マーカーとして使用する各種アイコン画像をインポート
import publicToiletIcon from './images/ano_icon01.png'; // 公共トイレ用アイコン
import recommendIcon from './images/ano_icon_recommend.png'; // おすすめスポット用アイコン
import ryotsuAikawaIcon from './images/icon_map01.png'; // 両津・相川地区用アイコン
import kanaiSawadaNiiboHatanoManoIcon from './images/icon_map02.png'; // 金井・佐和田・新穂・畑野・真野地区用アイコン
import akadomariHamochiOgiIcon from './images/icon_map03.png'; // 赤泊・羽茂・小木地区用アイコン
import defaultIcon from './images/row2.png'; // デフォルト用アイコン
import parkingIcon from './images/shi_icon01.png'; // 駐車場用アイコン
import snackIcon from './images/shi_icon02.png'; // スナック用アイコン
import currentLocationIcon from './images/shi_icon04.png'; // 現在地用アイコン
// アプリケーションで使用する型定義をインポート
import type { AreaType, Poi, MenuItem } from './types'; // エリアタイプ、観光地情報、メニュー項目の型定義

/**
 * エリア定義
 *
 * マップ上に表示される各エリア（地区）の名称を定義します。
 * これらの値は、マーカーのフィルタリングやカテゴリ分けに使用されます。
 */
export const AREAS = {
  RYOTSU_AIKAWA: '両津・相川地区', // 佐渡島北部のエリア
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区', // 佐渡島中央部のエリア
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区', // 佐渡島南部のエリア
  SNACK: 'スナック', // スナックカテゴリ
  PUBLIC_TOILET: '公共トイレ', // 公共トイレカテゴリ
  PARKING: '駐車場', // 駐車場カテゴリ
  RECOMMEND: 'おすすめ', // おすすめスポットカテゴリ
  CURRENT_LOCATION: '現在地', // 現在地を示すカテゴリ
} as const; // constアサーションで値を不変にし、型安全性を高める

/**
 * 情報ウィンドウに表示する営業時間の曜日定義
 *
 * スポット詳細の情報ウィンドウに表示する営業時間の各曜日とそのデータキーのマッピング。
 * 日本語表示用の曜日名とデータ取得用のキー名をペアで定義しています。
 */
export const INFO_WINDOW_BUSINESS_HOURS = [
  { day: '月曜日', key: 'monday' }, // 月曜日の表示とデータキー
  { day: '火曜日', key: 'tuesday' }, // 火曜日の表示とデータキー
  { day: '水曜日', key: 'wednesday' }, // 水曜日の表示とデータキー
  { day: '木曜日', key: 'thursday' }, // 木曜日の表示とデータキー
  { day: '金曜日', key: 'friday' }, // 金曜日の表示とデータキー
  { day: '土曜日', key: 'saturday' }, // 土曜日の表示とデータキー
  { day: '日曜日', key: 'sunday' }, // 日曜日の表示とデータキー
  { day: '祝祭日', key: 'holiday' }, // 祝祭日の表示とデータキー
] as const; // constアサーションで配列内容を不変にする

/**
 * マーカーの色定義
 *
 * マップ上の各カテゴリに対応するマーカーの色を16進数カラーコードで定義します。
 * これらの色はマーカーのスタイル設定やUI要素で使用されます。
 */
export const MARKER_COLORS = {
  DEFAULT: '#000000', // デフォルトの黒色
  RYOTSU_AIKAWA: '#d9a62e', // 両津・相川地区の黄金色
  KANAI_SAWADA_NIIBO_HATANO_MANO: '#ec6800', // 金井・佐和田・新穂・畑野・真野地区のオレンジ色
  AKADOMARI_HAMOCHI_OGI: '#007b43', // 赤泊・羽茂・小木地区の緑色
  SNACK: '#65318e', // スナックの紫色
  PUBLIC_TOILET: '#2792c3', // 公共トイレの青色
  PARKING: '#333333', // 駐車場のダークグレー色
  RECOMMEND: '#d7003a', // おすすめスポットの赤色
  CURRENT_LOCATION: '#42a30f', // 現在地のライム緑色
} as const; // constアサーションで値を不変にする

/**
 * マーカーのアイコン画像定義
 *
 * マップ上の各カテゴリに対応するマーカーのアイコン画像を定義します。
 * 上部でインポートした画像ファイルへの参照を格納しています。
 */
export const MARKER_ICONS: Record<string, string> = {
  DEFAULT: defaultIcon, // デフォルトのマーカーアイコン
  RYOTSU_AIKAWA: ryotsuAikawaIcon, // 両津・相川地区のマーカーアイコン
  KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon, // 金井・佐和田・新穂・畑野・真野地区のマーカーアイコン
  AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon, // 赤泊・羽茂・小木地区のマーカーアイコン
  SNACK: snackIcon, // スナックのマーカーアイコン
  PUBLIC_TOILET: publicToiletIcon, // 公共トイレのマーカーアイコン
  PARKING: parkingIcon, // 駐車場のマーカーアイコン
  RECOMMEND: recommendIcon, // おすすめスポットのマーカーアイコン
  CURRENT_LOCATION: currentLocationIcon, // 現在地のマーカーアイコン
};

/**
 * マーカー設定のまとめ
 *
 * マーカーの色とアイコン設定をひとつのオブジェクトにまとめた設定です。
 * アプリケーション内でこの設定を参照することで、マーカーのスタイル一貫性を保ちます。
 */
export const MARKER_CONFIG = {
  colors: MARKER_COLORS, // マーカーの色設定
  icons: MARKER_ICONS, // マーカーのアイコン画像設定
};

/**
 * 現在地のPOI（地点情報）定義
 *
 * ユーザーの現在地を表すPOIオブジェクトの定義です。
 * locationプロパティは実行時に現在の位置情報から設定されるため、ここでは除外しています。
 */
export const CURRENT_LOCATION_POI: Omit<Poi, 'location'> = {
  id: 'current-location', // 現在地POIの一意識別子
  name: '現在地', // 表示名
  area: 'CURRENT_LOCATION' as AreaType, // エリアタイプ（現在地カテゴリ）
  category: '現在地', // カテゴリ名
  genre: '現在地', // ジャンル名
};

/**
 * メニュー項目の定義
 *
 * アプリケーションのメインメニューに表示する項目のリストです。
 * 各項目にはラベル、タイトル、および関連するアクションが定義されています。
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    label: '表示するエリアを選択', // メニュー項目のラベル
    title: '表示するエリアを選択', // タイトル属性（アクセシビリティ用）
    action: 'handleAreaClick', // クリック時に実行するアクションの識別子
  },
  {
    label: 'フィードバック', // フィードバックメニューのラベル
    title: 'フィードバック', // タイトル属性
    action: 'handleFeedbackClick', // フィードバック機能を呼び出すアクション
  },
  {
    label: '検索', // 検索メニューのラベル
    title: '検索', // タイトル属性
    action: 'toggleSearchBar', // 検索バーの表示/非表示を切り替えるアクション
  },
];

/**
 * エリアの初期表示設定
 *
 * マップ初期表示時に、どのエリアのマーカーを表示するかの設定です。
 * 特定のカテゴリ（スナック、公共トイレ、駐車場、現在地）以外は初期表示をtrueに設定しています。
 */
export const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    // 以下のカテゴリは初期表示しない（false）、それ以外は表示する（true）
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING' && area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
);

/**
 * ローディング関連の時間設定
 *
 * アプリケーション内でのローディング表示や遷移に関連する時間設定です。
 */
export const LOADING_DELAY = 0; // ローディング表示を開始するまでの遅延時間（ミリ秒）
export const BACKGROUND_HIDE_DELAY = 1000; // 背景要素を非表示にするまでの遅延時間（ミリ秒）

/**
 * エラーメッセージ定義
 *
 * アプリケーション内で使用される各種エラーメッセージを定義します。
 * カテゴリ別に整理され、一貫したエラーメッセージを提供します。
 */
export const ERROR_MESSAGES = {
  CONFIG: {
    INVALID: '設定が正しくありません。設定を確認してください。', // 無効な設定に対するエラー
    MISSING: '必要な設定が不足しています。設定を追加してください。', // 設定不足に対するエラー
  },
  DATA: {
    FETCH_FAILED: 'データの取得に失敗しました。ネットワーク接続を確認してください。', // データ取得失敗時のエラー
    LOADING_FAILED: 'データの読み込みに失敗しました。再試行してください。', // データ読込失敗時のエラー
  },
  LOADING: {
    DATA: 'データを読み込み中です。しばらくお待ちください。', // データ読込中のメッセージ
    MAP: 'マップを読み込み中です。しばらくお待ちください。', // マップ読込中のメッセージ
  },
  MAP: {
    LOAD_FAILED: 'Google Maps の読み込みに失敗しました。再試行してください。', // マップ読込失敗時のエラー
    CONFIG_MISSING: 'Google Maps の設定が不完全です。API キーとMap IDを確認してください。', // マップ設定不足時のエラー
    RETRY_MESSAGE: 'しばらく経ってから再度お試しください。', // 再試行を促すメッセージ
  },
  SYSTEM: {
    CONTAINER_NOT_FOUND: 'コンテナ要素が見つかりません。ページをリロードしてください。', // DOM要素不在時のエラー
    UNKNOWN: '予期せぬエラーが発生しました。サポートに連絡してください。', // 未知のシステムエラー
  },
  FORM: {
    EMPTY_NAME: '名前を入力してください。', // 名前未入力時のエラー
    EMPTY_MESSAGE: 'メッセージを入力してください。', // メッセージ未入力時のエラー
    INVALID_EMAIL: '有効なメールアドレスを入力してください。', // 無効なメールアドレス時のエラー
    SUBMISSION_FAILED: '送信に失敗しました。もう一度お試しください。', // フォーム送信失敗時のエラー
  },
  ERROR_BOUNDARY: {
    UNKNOWN_ERROR: 'エラーが発生しました。ページをリロードしてください。', // 一般的なエラー境界のメッセージ
    RETRY_BUTTON: '再試行', // 再試行ボタンのラベル
  },
  GEOLOCATION: {
    PERMISSION_DENIED: '位置情報の取得が許可されていません', // 位置情報へのアクセス拒否時のエラー
    POSITION_UNAVAILABLE: '位置情報が利用できません', // 位置情報取得不可時のエラー
    TIMEOUT: '位置情報の取得がタイムアウトしました', // 位置情報取得タイムアウト時のエラー
    UNKNOWN: '未知のエラーが発生しました', // 不明な位置情報エラー
  },
} as const; // constアサーションで値を不変にする

/**
 * Google Maps API設定
 *
 * Google Mapsの全ての設定パラメータを定義します。
 * 環境変数から取得した設定や位置情報オプション、マップ表示設定などを含みます。
 */
export const MAPS_CONFIG = {
  // API関連設定
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // 環境変数からGoogle Maps APIキーを取得
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // 環境変数からGoogle Maps Map IDを取得
  defaultCenter: { lat: 38.0, lng: 138.5 }, // 佐渡島周辺をデフォルトの中心に設定
  defaultZoom: 10, // デフォルトのズームレベル（島全体が見える程度）
  libraries: ['places', 'geometry', 'drawing', 'marker'] as LoadScriptProps['libraries'], // 使用するGoogle Mapsのライブラリ
  language: 'ja', // マップの言語設定（日本語）
  version: 'weekly', // Google Maps APIのバージョン指定

  // 旧MAP_CONFIGSの内容
  geolocation: {
    timeout: 10000, // 位置情報取得のタイムアウト時間（ミリ秒）
    maxAge: 0, // キャッシュされた位置情報の最大許容年齢（0=キャッシュを使用しない）
    highAccuracy: true, // 高精度の位置情報を要求（バッテリー消費増加の可能性あり）
  },
  defaultType: 'roadmap', // デフォルトで使用するマップタイプ

  // コンテナスタイル
  style: {
    width: '100%', // マップのコンテナ幅（親要素いっぱいに広げる）
    height: '100%', // マップのコンテナ高さ（親要素いっぱいに広げる）
  },

  // マップオプション
  options: {
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // マップIDを再指定（一貫性のため）
    disableDefaultUI: false, // デフォルトUIを有効にする
    zoomControl: true, // ズームコントロールを表示する
    mapTypeControl: true, // マップタイプ切り替えコントロールを表示する
    streetViewControl: true, // ストリートビューコントロールを表示する
    fullscreenControl: true, // フルスクリーンコントロールを表示する
    clickableIcons: true, // マップ上のアイコンをクリック可能にする
    gestureHandling: 'cooperative', // マップのジェスチャー処理方法
    mapTypeControlOptions: {
      // Google Maps API がロードされる前の静的定義のため数値を使用
      style: 2, // DROPDOWN_MENU の定数値（2）
      position: 1, // TOP_LEFT の定数値（1）
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'], // 利用可能なマップタイプ
    },
  },
};

/**
 * Google Sheets API設定
 *
 * データソースとなるGoogle Sheetsの設定パラメータを定義します。
 * 環境変数から取得したAPI KeyとスプレッドシートIDが含まれます。
 */
export const SHEETS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY, // 環境変数からGoogle Sheets APIキーを取得
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID, // 環境変数からスプレッドシートIDを取得
};
