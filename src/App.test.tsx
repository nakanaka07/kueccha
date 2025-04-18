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

// Google Maps APIのモック - シンプル化と型安全性の向上
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: { children?: React.ReactNode }) => <div data-testid='google-map'>{children}</div>,
  Marker: () => <div data-testid='map-marker' />,
  InfoWindow: ({ children }: { children?: React.ReactNode }) => <div data-testid='info-window'>{children}</div>,
  useLoadScript: () => ({
    isLoaded: true,
    loadError: undefined,
    url: 'https://maps.googleapis.com/maps/api/js',
  }),
}));

// モック設定を変更するヘルパー関数（型安全性向上版）
const updateGoogleMapsMock = (options: { isLoaded?: boolean; loadError?: Error } = {}) => {
  const { isLoaded = true, loadError } = options;
  vi.mocked(reactGoogleMaps.useLoadScript).mockImplementation(() => ({
    isLoaded,
    loadError,
    url: 'https://maps.googleapis.com/maps/api/js',
  }));
};

describe('App', () => {
  // テスト関連の環境変数だけを保存
  const envKeysToRestore = ['VITE_GOOGLE_API_KEY', 'VITE_GOOGLE_SPREADSHEET_ID'] as const;
  // 安全な型定義で環境変数を扱う
  type EnvKeys = (typeof envKeysToRestore)[number];
  const originalEnv = new Map<EnvKeys, string | undefined>();
  beforeEach(() => {
    // テスト前に環境変数の現在値を保存 - 安全なアクセス方法で
    envKeysToRestore.forEach(key => {
      // Object.getOwnPropertyDescriptorを使って安全に環境変数にアクセス
      const value = Object.getOwnPropertyDescriptor(process.env, key)?.value as string | undefined;
      originalEnv.set(key, value);
    });

    vi.resetAllMocks();

    // 必要な環境変数だけをモック
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_GOOGLE_SPREADSHEET_ID', 'test-sheet-id');
  });
  afterEach(() => {
    // 保存した環境変数だけを元に戻す
    envKeysToRestore.forEach(key => {
      vi.stubEnv(key, originalEnv.get(key) || '');
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    expect(logger.info).toHaveBeenCalled();
  });

  it('renders the map container', () => {
    const { container } = render(<App />);
    const mapElement = container.querySelector('.map-container');
    expect(mapElement).toBeInTheDocument();
  });

  it('shows loading state when map is not loaded', () => {
    // 地図が読み込まれていない状態をシミュレート
    updateGoogleMapsMock({ isLoaded: false });

    render(<App />);

    // 読み込み中メッセージの存在を確認
    const loadingElement = screen.getByText('地図を読み込んでいます...');
    expect(loadingElement).toBeInTheDocument();
  });

  it('shows error message when map fails to load', () => {
    const testError = new Error('Failed to load Google Maps API');

    // 地図の読み込みエラーをシミュレート
    updateGoogleMapsMock({ isLoaded: false, loadError: testError });

    render(<App />);

    const loadingElement = screen.getByText('地図を読み込んでいます...');
    expect(loadingElement).toBeInTheDocument();

    // エラーがログに記録されたか確認
    expect(logger.error).toHaveBeenCalled();
  });

  it('properly unmounts without errors', () => {
    const { unmount } = render(<App />);
    unmount();
    expect(vi.mocked(logger).error).not.toHaveBeenCalled();
  });
});
