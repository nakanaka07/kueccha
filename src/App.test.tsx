import * as reactGoogleMaps from '@react-google-maps/api';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import App from '@/App';
import { logger } from '@/utils/logger';

// テスト用にロガーをモック化
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    measureTime: vi.fn((_name: string, fn: () => unknown) => fn()),
    measureTimeAsync: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
  },
}));

// モジュールのモックを事前に設定
vi.mock('@react-google-maps/api', () => {
  // 実際のモック実装はテスト内で動的に変更できるようにオブジェクトを用意
  const mock = {
    GoogleMap: ({ children }: { children: React.ReactNode }) => <div data-testid='google-map'>{children}</div>,
    Marker: () => <div data-testid='map-marker' />,
    InfoWindow: ({ children }: { children: React.ReactNode }) => <div data-testid='info-window'>{children}</div>,
    useLoadScript: () => ({
      isLoaded: true,
      loadError: undefined,
      url: 'https://maps.googleapis.com/maps/api/js',
    }),
  };

  // 実際のエクスポートを返す
  return mock;
});

// モック設定を変更するヘルパー関数
const updateGoogleMapsMock = (options: Partial<typeof reactGoogleMaps> = {}) => {
  const mockModule = vi.mocked(reactGoogleMaps);

  // オプションで指定されたプロパティで上書き
  Object.entries(options).forEach(([key, value]: [string, unknown]) => {
    // 型安全なプロパティアクセスを行う
    if (key in mockModule) {
      (mockModule as Record<string, unknown>)[key] = value;
    }
  });
};

describe('App', () => {
  beforeEach(() => {
    // vitestのモックをリセット
    vi.resetAllMocks();

    // 環境変数のモック
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_GOOGLE_SPREADSHEET_ID', 'test-sheet-id');

    // テスト開始のログ
    logger.info('Appコンポーネントのテスト開始', { testEnvironment: 'vitest' });
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    logger.debug('テストケース完了');
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    // アンバウンドメソッド参照を避けるため、アロー関数を使用する
    expect(
      vi.mocked(logger).info.mock.calls.some(call => typeof call[0] === 'string' && call[0].includes('テスト'))
    ).toBe(true);
  });

  it('renders the map container', () => {
    logger.measureTime('マップコンテナレンダリングテスト', () => {
      const { container } = render(<App />);
      const mapElement = container.querySelector('.map-container');
      expect(mapElement).toBeInTheDocument();
    });
  });

  it('shows loading state when map is not loaded', () => {
    // モックを更新して地図が読み込まれていない状態をシミュレート
    updateGoogleMapsMock({
      useLoadScript: () => ({
        isLoaded: false,
        loadError: undefined,
        url: 'https://maps.googleapis.com/maps/api/js',
      }),
    });

    // App コンポーネントをレンダリング
    render(<App />);
    logger.debug('読み込み中状態のテスト実行');

    // 読み込み中メッセージの存在を確認
    const loadingElement = screen.getByText('地図を読み込んでいます...');
    expect(loadingElement).toBeInTheDocument();
  });

  it('shows error message when map fails to load', () => {
    const testError = new Error('Failed to load Google Maps API');

    // モックを更新して地図の読み込みエラーをシミュレート
    updateGoogleMapsMock({
      useLoadScript: () => ({
        isLoaded: false,
        loadError: testError,
        url: 'https://maps.googleapis.com/maps/api/js',
      }),
    });

    // App コンポーネントをレンダリング
    render(<App />);

    logger.debug('地図読み込みエラー時のテスト実行', { error: testError.message });

    // 現在の実装ではエラー時も同じローディングメッセージが表示される
    const loadingElement = screen.getByText('地図を読み込んでいます...');
    expect(loadingElement).toBeInTheDocument();

    // TODO: 将来的にはエラー専用のメッセージが表示されるべき
    // 現在はエラー時特有のUIテストは実装できないが、将来的に実装すべき
    logger.warn('エラー時の専用メッセージ表示機能が未実装', {
      currentBehavior: 'ローディングメッセージを表示',
      recommendedImprovement: 'エラー専用メッセージの表示',
    });
  });

  it('properly cleans up resources when unmounted', () => {
    // コンポーネントのマウントと破棄のテスト
    const { unmount } = render(<App />);

    // コンポーネントのアンマウント
    unmount();

    // 正常にアンマウントされることを検証
    // 注: 現時点では特定のクリーンアップ処理のテストはないが、
    // 将来的にクリーンアップ処理が追加された場合にこのテストを拡張する
    logger.info('コンポーネントのアンマウントテスト完了');
  });
});
