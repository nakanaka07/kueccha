import { POI, POICategory, POIType } from '@/types/poi';

/**
 * CSVデータを処理するユーティリティ
 * 
 * CSVファイルからPOIデータを読み込み、アプリケーションで使用可能な形式に変換します。
 * WKT（Well-Known Text）形式の座標を緯度・経度に変換し、
 * 各種フィルタリングや検索に必要なデータ構造を構築します。
 */

/**
 * CSV文字列をPOIオブジェクトの配列に変換
 * 
 * @param csvText - 処理するCSV文字列
 * @param type - POIの種類（飲食店、駐車場、トイレなど）
 * @returns 変換されたPOIオブジェクトの配列
 */
export function parseCSVtoPOIs(csvText: string, type: POIType): POI[] {
  if (!csvText) {
    console.warn('空のCSVデータが渡されました');
    return [];
  }

  try {
    // CSVの行に分割
    const lines = csvText.split('\n');
    
    // ヘッダー行（項目名）を取得
    const headers = lines[0].split(',').map(h => h.trim());
    
    // ヘッダーのインデックスを取得（存在しない場合は-1）
    const nameIndex = headers.indexOf('名称（入力）');
    const wktIndex = headers.indexOf('WKT（入力）');
    const closedIndex = headers.indexOf('閉店情報（入力）');
    const genreIndex = headers.indexOf('ジャンル（入力）');
    const japaneseFoodIndex = headers.indexOf('和食カテゴリー（入力）');
    const westernFoodIndex = headers.indexOf('洋食カテゴリー（入力）');
    const otherFoodIndex = headers.indexOf('その他カテゴリー（入力）');
    const retailIndex = headers.indexOf('販売カテゴリー（入力）');
    const parkingInfoIndex = headers.indexOf('駐車場情報（入力）');
    const contactIndex = headers.indexOf('問い合わせ（入力）');
    const addressIndex = headers.indexOf('所在地（入力）');
    const areaIndex = headers.indexOf('地区（入力）');
    const businessHoursIndex = headers.indexOf('営業時間');
    const infoIndex = headers.indexOf('関連情報（入力）');
    const googleMapsIndex = headers.indexOf('Google マップで見る（入力）');
    
    // ヘッダーの後の行からデータを処理
    return lines.slice(1)
      .filter(line => line.trim() !== '')
      .map((line, index) => {
        // CSVの列を分割（カンマの中にカンマがある場合を考慮）
        const columns = parseCSVLine(line);
        
        // WKT形式の座標を解析
        const coordinates = parseWKT(columns[wktIndex]);
        
        // カテゴリーを決定
        const category = determineCategory(
          columns[japaneseFoodIndex]?.toLowerCase() === 'true',
          columns[westernFoodIndex]?.toLowerCase() === 'true',
          columns[otherFoodIndex]?.toLowerCase() === 'true',
          columns[retailIndex]?.toLowerCase() === 'true'
        );

        // POIオブジェクトを構築
        const poi: POI = {
          id: `${type}-${index}`,
          name: columns[nameIndex]?.trim() || '名称不明',
          type,
          position: coordinates,
          isClosed: columns[closedIndex]?.toLowerCase() === 'true',
          genre: columns[genreIndex]?.trim() || '',
          category,
          address: columns[addressIndex]?.trim() || '',
          area: columns[areaIndex]?.trim() || '',
          contact: columns[contactIndex]?.trim() || '',
          businessHours: columns[businessHoursIndex]?.trim() || '',
          parkingInfo: columns[parkingInfoIndex]?.trim() || '',
          infoUrl: columns[infoIndex]?.trim() || '',
          googleMapsUrl: columns[googleMapsIndex]?.trim() || '',
          // 検索用に正規化したテキスト（ひらがな・カタカナの区別なく検索できるように）
          searchText: normalizeText(`${columns[nameIndex]} ${columns[genreIndex]} ${columns[addressIndex]}`),
        };

        return poi;
      });
  } catch (error) {
    console.error('CSVデータの解析中にエラーが発生しました:', error);
    return [];
  }
}

/**
 * CSVの行を適切に解析する関数（引用符で囲まれたカンマを処理）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // 最後の値を追加
  result.push(currentValue);
  
  return result;
}

/**
 * WKT形式の座標文字列から緯度・経度を抽出
 * 例: "POINT (138.4665294 38.319763)" → { lat: 38.319763, lng: 138.4665294 }
 */
function parseWKT(wkt: string): google.maps.LatLngLiteral {
  try {
    // デフォルト値（佐渡島の中心あたり）
    const defaultPosition = { lat: 38.0413, lng: 138.3689 };
    
    if (!wkt) {
      return defaultPosition;
    }
    
    // POINT形式のWKTを解析
    const match = wkt.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match && match.length >= 3) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      
      // 有効な緯度・経度かチェック
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }
    
    console.warn(`無効なWKT形式の座標です: ${wkt}`);
    return defaultPosition;
  } catch (error) {
    console.error('WKT座標の解析中にエラーが発生しました:', error);
    // エラー時は佐渡島の中心座標を返す
    return { lat: 38.0413, lng: 138.3689 };
  }
}

/**
 * 緯度・経度が有効な範囲内かチェック
 */
function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
    lat >= -90 && lat <= 90 && 
    lng >= -180 && lng <= 180;
}

/**
 * POIカテゴリーを決定
 */
function determineCategory(
  isJapanese: boolean,
  isWestern: boolean,
  isOther: boolean,
  isRetail: boolean
): POICategory {
  if (isRetail) return 'retail';
  if (isJapanese && !isWestern && !isOther) return 'japanese';
  if (!isJapanese && isWestern && !isOther) return 'western';
  if (!isJapanese && !isWestern && isOther) return 'other';
  if (isJapanese && isWestern) return 'fusion';
  
  // デフォルト
  return 'unspecified';
}

/**
 * テキストを検索用に正規化（ひらがな・カタカナの区別なく検索できるように）
 */
function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    // カタカナをひらがなに変換
    .replace(/[\u30A1-\u30F6]/g, match => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    })
    // 全角数字を半角に変換
    .replace(/[０-９]/g, match => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    // 全角英字を半角に変換
    .replace(/[Ａ-Ｚａ-ｚ]/g, match => String.fromCharCode(match.charCodeAt(0) - 0xFEE0));
}

/**
 * 複数のCSVデータを結合
 * 
 * @param poiArrays - 結合するPOI配列の配列
 * @returns 結合されたPOI配列
 */
export function combinePOIArrays(...poiArrays: POI[][]): POI[] {
  return poiArrays.flat();
}

/**
 * POIデータをカテゴリでフィルタリング
 * 
 * @param pois - フィルタリングするPOI配列
 * @param categories - 表示するカテゴリの配列
 * @returns フィルタリングされたPOI配列
 */
export function filterPOIsByCategory(pois: POI[], categories: POICategory[]): POI[] {
  if (!categories || categories.length === 0) {
    return pois;
  }
  
  return pois.filter(poi => categories.includes(poi.category));
}

/**
 * POIデータを検索テキストでフィルタリング
 * 
 * @param pois - フィルタリングするPOI配列
 * @param searchText - 検索テキスト
 * @returns フィルタリングされたPOI配列
 */
export function filterPOIsBySearchText(pois: POI[], searchText: string): POI[] {
  if (!searchText || searchText.trim() === '') {
    return pois;
  }
  
  const normalizedSearchText = normalizeText(searchText);
  
  return pois.filter(poi => 
    poi.searchText.includes(normalizedSearchText) ||
    normalizeText(poi.name).includes(normalizedSearchText) ||
    normalizeText(poi.genre).includes(normalizedSearchText) ||
    normalizeText(poi.address).includes(normalizedSearchText)
  );
}