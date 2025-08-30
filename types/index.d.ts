/* TypeScript Type Definitions - Complete type safety for the application */

// Core Types
export interface Movie {
  _id?: string;
  name: string;
  slug: string;
  origin_name?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: number;
  quality?: string;
  lang?: string;
  episode_current?: string;
  episode_total?: string;
  time?: string;
  content?: string;
  type?: string;
  status?: string;
  category?: Category[];
  country?: Country[];
  actor?: string[];
  director?: string[];
  chieurap?: boolean;
  trailer_url?: string;
  view?: number;
  created?: {
    time: string;
  };
  modified?: {
    time: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Country {
  id: string;
  name: string;
  slug: string;
}

export interface Episode {
  server_name: string;
  server_data: EpisodeData[];
}

export interface EpisodeData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

// API Response Types
export interface ApiResponse<T> {
  status: boolean;
  msg: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  params: {
    type_slug: string;
    filterCategory: string[];
    filterCountry: string[];
    filterYear: string;
    filterType: string;
    sortField: string;
    sortType: string;
    pagination: {
      totalItems: number;
      totalItemsPerPage: number;
      currentPage: number;
      totalPages: number;
    };
  };
  type_list: string;
  APP_DOMAIN_FRONTEND: string;
  APP_DOMAIN_CDN_IMAGE: string;
}

export interface SearchResponse {
  data: {
    items: Movie[];
    params: {
      type_slug: string;
      keyword: string;
      filterCategory: string[];
      filterCountry: string[];
      filterYear: string;
      filterType: string;
      sortField: string;
      sortType: string;
      pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        totalPages: number;
      };
    };
  };
}

export interface MovieDetailResponse {
  movie: Movie;
  episodes: Episode[];
}

// Storage Types
export interface SavedMovie extends Movie {
  savedAt: number;
  userId?: string;
}

export interface WatchProgress {
  movieSlug: string;
  episodeName: string;
  currentTime: number;
  duration: number;
  timestamp: number;
  userId?: string;
}

// UI Component Types
export interface NotificationOptions {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  timestamp?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  onPageChange?: (page: number) => void;
}

export interface SearchFormData {
  keyword?: string;
  category?: string;
  country?: string;
  year?: string;
  sort_field?: string;
  sort_type?: string;
  limit?: number;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  pageLoad: {
    domContentLoaded?: number;
    loadComplete?: number;
    domInteractive?: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  };
  navigation: NavigationEntry[];
  apiCalls: ApiCallEntry[];
  imageLoading: ImageLoadEntry[];
  memoryUsage: MemoryEntry[];
  userInteractions: UserInteractionEntry[];
  errors: ErrorEntry[];
  uptime: number;
}

export interface NavigationEntry {
  name: string;
  duration: number;
  startTime: number;
  type: string;
  timestamp: number;
}

export interface ApiCallEntry {
  url: string;
  duration: number;
  size?: number;
  type: 'javascript' | 'stylesheet' | 'api' | 'other';
  timestamp: number;
}

export interface ImageLoadEntry {
  url: string;
  duration: number;
  size?: number;
  timestamp: number;
}

export interface MemoryEntry {
  timestamp: number;
  used: number;
  total: number;
  limit: number;
}

export interface UserInteractionEntry {
  type: 'click' | 'scroll' | 'keypress';
  target?: string;
  className?: string;
  scrollY?: number;
  timestamp: number;
}

export interface ErrorEntry {
  message: string;
  stack?: string;
  context: Record<string, any>;
  timestamp: number;
}

// Error Boundary Types
export interface ErrorBoundaryOptions {
  fallbackComponent?: (error: Error, retryCount: number) => HTMLElement;
  onError?: (error: Error, errorCount: number) => void;
  retryCallback?: () => Promise<void> | void;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByComponent: Record<string, number>;
  recoveryRate: number;
  averageRecoveryTime: number;
}

// Testing Types
export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration?: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  total: number;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  average: string;
  min: string;
  max: string;
  total: string;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size?: number;
}

export interface CacheStats {
  cacheSize: number;
  requestsInFlight: number;
  memoryUsage: number;
}

// Router Types
export interface RouteParams {
  [key: string]: string;
}

export interface ParsedRoute {
  path: string;
  params: URLSearchParams;
}

export interface RouteHandler {
  (container: HTMLElement, ...args: any[]): Promise<void> | void;
}

export interface PageRenderers {
  renderHome: RouteHandler;
  renderSearch: RouteHandler;
  renderCombinedFilter: RouteHandler;
  renderAllCategories: RouteHandler;
  renderSavedMovies: RouteHandler;
  renderDetail: RouteHandler;
  renderWatch: RouteHandler;
}

// Logger Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LoggerInterface {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  critical: (...args: any[]) => void;
  perf: <T>(label: string, fn: () => T) => T;
  user: (message: string, type?: string) => void;
}

// App State Types
export interface AppState {
  initialized: boolean;
  currentUser: string | null;
  theme: 'light' | 'dark';
  notifications: NotificationOptions[];
  cache: Map<string, any>;
}

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export interface Comment {
  id: string;
  movieSlug: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  likes: number;
  replies?: Comment[];
}

// Service Worker Types
export interface ServiceWorkerConfig {
  cacheName: string;
  version: string;
  staticAssets: string[];
  apiEndpoints: string[];
  offlinePages: string[];
}

export interface CacheStrategy {
  name: string;
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  maxAge?: number;
  maxEntries?: number;
}

// Bundle Types
export interface BundleConfig {
  entry: string;
  output: {
    path: string;
    filename: string;
  };
  chunks: {
    vendor: string[];
    common: string[];
  };
  optimization: {
    splitChunks: boolean;
    minify: boolean;
    treeshaking: boolean;
  };
}

// Component Library Types
export interface ComponentProps {
  className?: string;
  children?: HTMLElement | HTMLElement[] | string;
  onClick?: (event: Event) => void;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface MovieCardProps extends ComponentProps {
  movie: Movie;
  showProgress?: boolean;
  showSaveButton?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface GridProps extends ComponentProps {
  items: any[];
  renderItem: (item: any, index: number) => HTMLElement;
  columns?: number;
  gap?: string;
  loading?: boolean;
}

// Global Window Extensions
declare global {
  interface Window {
    // Development tools
    XemPhimApp?: any;
    AppState?: AppState;
    Logger?: LoggerInterface;
    performanceMonitor?: any;
    performanceDashboard?: any;
    errorBoundaryMonitor?: any;
    testFramework?: any;
    memoryTest?: any;
    performanceTest?: any;
    
    // App functions
    toggleSaveMovie?: (slug: string) => Promise<void>;
    refreshSavedMoviesAfterSync?: () => Promise<void>;
    immediateRefreshSavedMovies?: () => Promise<void>;
    showNotification?: (options: NotificationOptions) => void;
    
    // Storage system
    Storage?: {
      saveMovie: (movie: Movie) => Promise<boolean>;
      removeSavedMovie: (slug: string) => Promise<boolean>;
      getSavedMovies: () => Promise<SavedMovie[]>;
      isMovieSaved: (slug: string) => Promise<boolean>;
      clearSavedMovies: () => Promise<number>;
      saveWatchProgress: (slug: string, progress: Partial<WatchProgress>) => Promise<void>;
      getWatchProgress: (slug: string) => Promise<WatchProgress | null>;
      getAllWatchProgress: () => Promise<Record<string, WatchProgress>>;
      clearWatchProgress: (slug: string) => Promise<void>;
    };
    
    // Firebase integration
    movieComments?: {
      init: () => Promise<void>;
      renderCommentSection: (container: HTMLElement, movieSlug: string) => void;
    };
    
    // Service Worker
    serviceWorker?: ServiceWorker;
    
    // Performance API extensions
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
  
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
  
  interface Navigator {
    connection?: {
      effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
      downlink: number;
      rtt: number;
    };
  }
}

export {};
