// useCallbackフックをインポートします。メモ化されたコールバック関数を作成するために使用します。
import { useCallback } from 'react';
// LatLngLiteral型をインポートします。緯度と経度を表すオブジェクトの型です。
import type { LatLngLiteral } from '../types/types';

// useMapControlフックを定義します。Googleマップのコントロールを提供します。
// 引数としてGoogleマップのインスタンスを受け取ります。
export const useMapControl = (map: google.maps.Map | null) => {
  // 北をリセットする関数を定義します。マップの向きを北にリセットします。
  const resetNorth = useCallback(() => {
    // mapがnullでない場合に実行します。
    if (map) {
      // マップの向きを北に設定します。
      map.setHeading(0);
    }
  }, [map]); // mapが変更された場合にのみこの関数を再生成します。

  // 現在地を取得する関数を定義します。成功時とエラー時のコールバックを引数として受け取ります。
  const handleGetCurrentLocation = useCallback(
    (callbacks: {
      onSuccess: (location: LatLngLiteral) => void; // 成功時のコールバック。位置情報を引数として受け取ります。
      onError: (error: string) => void; // エラー時のコールバック。エラーメッセージを引数として受け取ります。
    }) => {
      // ブラウザが位置情報をサポートしているか確認します。
      if (navigator.geolocation) {
        // 位置情報の取得を試みます。
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // 位置情報の取得に成功した場合、位置情報をオブジェクトに変換します。
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            // 成功時のコールバックを呼び出します。
            callbacks.onSuccess(location);
          },
          (error) => {
            // 位置情報の取得に失敗した場合、エラーメッセージを設定します。
            let errorMessage = '現在地の取得に失敗しました。';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = '位置情報の取得が許可されていません。';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = '位置情報が利用できません。';
                break;
              case error.TIMEOUT:
                errorMessage = '位置情報の取得がタイムアウトしました。';
                break;
              default:
                errorMessage = '未知のエラーが発生しました。';
                break;
            }
            // エラー時のコールバックを呼び出します。
            callbacks.onError(errorMessage);
          },
          {
            enableHighAccuracy: true, // 高精度の位置情報を要求します。
            timeout: 10000, // 位置情報の取得がタイムアウトするまでの時間（ミリ秒）。
            maximumAge: 0, // キャッシュされた位置情報を使用しないように設定します。
          },
        );
      } else {
        // ブラウザが位置情報をサポートしていない場合、エラー時のコールバックを呼び出します。
        callbacks.onError('このブラウザでは位置情報がサポートされていません。');
      }
    },
    [], // 依存配列が空のため、この関数は初回マウント時にのみ生成されます。
  );

  // フックが返すオブジェクト。北をリセットする関数と現在地を取得する関数を含みます。
  return {
    resetNorth, // マップの向きを北にリセットする関数
    handleGetCurrentLocation, // 現在地を取得する関数
  };
};
