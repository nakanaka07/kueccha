import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

// GoogleマップAPIのモック設定を一元管理
const mockGoogleMapsAPI = (options = {}) => {
  const defaultMock = {
    GoogleMap: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="google-map">{children}</div>
    ),
    Marker: () => <div data-testid="map-marker" />,
    InfoWindow: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="info-window">{children}</div>
    ),
    useLoadScript: () => ({ isLoaded: true, loadError: null }),
  };

  // デフォルト設定にオプションを上書き
  const mockConfig = { ...defaultMock, ...options };
  
  vi.mock('@react-google-maps/api', () => mockConfig);
  
  return mockConfig;
};

describe('App', () => {
  beforeEach(() => {
    // vitest のモックをリセット
    vi.resetAllMocks();
    
    // デフォルトのモック設定を適用
    mockGoogleMapsAPI();
    
    // 環境変数のモック（.env.exampleと命名を統一）
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_GOOGLE_SPREADSHEET_ID', 'test-sheet-id');
  });

  it('renders without crashing', () => {
    // Appコンポーネントをレンダリング
    const { container } = render(<App />);
    // コンテナが存在することを確認
    expect(container).toBeDefined();
  });

  it('renders the map container', () => {
    render(<App />);
    // 地図コンテナが存在するか確認
    const mapElement = screen.queryByTestId('google-map');
    expect(mapElement).toBeInTheDocument();
  });

  it('shows loading state when map is not loaded', () => {
    // 地図読み込み前の状態をモック
    mockGoogleMapsAPI({
      useLoadScript: () => ({ isLoaded: false, loadError: null }),
      GoogleMap: () => null,
    });
    
    render(<App />);
    const loadingElement = screen.queryByText(/読み込み中/i);
    expect(loadingElement).toBeInTheDocument();
  });

  it('shows error message when map fails to load', () => {
    // 地図読み込みエラーの状態をモック
    mockGoogleMapsAPI({
      useLoadScript: () => ({ 
        isLoaded: false, 
        loadError: new Error('Failed to load Google Maps API') 
      }),
      GoogleMap: () => null,
    });
    
    render(<App />);
    const errorElement = screen.queryByText(/エラーが発生しました/i);
    expect(errorElement).toBeInTheDocument();
  });
});