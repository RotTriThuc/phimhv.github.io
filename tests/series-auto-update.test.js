/**
 * Test Suite cho Series Auto-Update System
 *
 * Test cases:
 * 1. Series detection và tracking
 * 2. Background update checking
 * 3. Cache invalidation
 * 4. UI refresh mechanisms
 * 5. Event system
 * 6. Memory cleanup
 */

// Mock dependencies
const mockApi = {
  search: jest.fn(),
  getMovie: jest.fn()
};

const mockExtractItems = jest.fn();

const mockCreateEl = jest.fn((tag, className, content) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
});

// Test data
const mockMovie = {
  name: 'Gia Tộc Rồng (Phần 1)',
  slug: 'gia-toc-rong-phan-1',
  year: 2022,
  episode_current: 'Hoàn Tất (10/10)'
};

const mockSeason2 = {
  name: 'Gia Tộc Rồng (Phần 2)',
  slug: 'gia-toc-rong-phan-2',
  year: 2024,
  episode_current: 'Tập 8'
};

const mockSeason3 = {
  name: 'Gia Tộc Rồng (Phần 3)',
  slug: 'gia-toc-rong-phan-3',
  year: 2025,
  episode_current: 'Sắp ra mắt'
};

describe('Series Auto-Update System', () => {
  let seriesUpdateManager;
  let seriesNavigator;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup DOM
    document.body.innerHTML = '<div id="app"></div>';

    // Setup global mocks
    global.window = {
      Api: mockApi,
      extractItems: mockExtractItems,
      createEl: mockCreateEl,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      showNotification: jest.fn()
    };

    // Import modules
    const { SeriesUpdateManager } = await import(
      '../modules/series-update-manager.js'
    );
    const navigator = await import('../modules/series-navigator.js');

    seriesUpdateManager = new SeriesUpdateManager();
    seriesNavigator = navigator;
  });

  afterEach(() => {
    // Cleanup
    if (seriesUpdateManager) {
      seriesUpdateManager.clearAll();
    }
  });

  describe('Series Detection', () => {
    test('should detect series info from movie name', () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);

      expect(seriesInfo).toBeTruthy();
      expect(seriesInfo.baseName).toBe('Gia Tộc Rồng');
      expect(seriesInfo.season).toBe(1);
      expect(seriesInfo.seriesId).toBe('Gia Tộc Rồng_SERIES');
    });

    test('should return null for non-series movies', () => {
      const nonSeriesMovie = {
        name: 'Phim Độc Lập',
        slug: 'phim-doc-lap'
      };

      const seriesInfo = seriesNavigator.getSeriesBaseInfo(nonSeriesMovie);
      expect(seriesInfo).toBeNull();
    });
  });

  describe('Series Tracking', () => {
    test('should track series successfully', () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);
      const callback = jest.fn();

      const result = seriesUpdateManager.trackSeries(
        seriesInfo,
        mockMovie,
        callback
      );

      expect(result).toBe(true);
      expect(seriesUpdateManager.trackedSeries.has(seriesInfo.seriesId)).toBe(
        true
      );
      expect(seriesUpdateManager.updateCallbacks.has(seriesInfo.seriesId)).toBe(
        true
      );
    });

    test('should start periodic checking when tracking first series', () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);

      expect(seriesUpdateManager.isRunning).toBe(false);

      seriesUpdateManager.trackSeries(seriesInfo, mockMovie);

      expect(seriesUpdateManager.isRunning).toBe(true);
    });

    test('should stop periodic checking when no series tracked', () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);

      seriesUpdateManager.trackSeries(seriesInfo, mockMovie);
      expect(seriesUpdateManager.isRunning).toBe(true);

      seriesUpdateManager.untrackSeries(seriesInfo.seriesId);
      expect(seriesUpdateManager.isRunning).toBe(false);
    });
  });

  describe('Update Detection', () => {
    test('should detect new seasons', () => {
      const oldSeasons = [mockMovie, mockSeason2];
      const newSeasons = [mockMovie, mockSeason2, mockSeason3];

      const hasUpdates = seriesUpdateManager.compareSeasons(
        oldSeasons,
        newSeasons
      );

      expect(hasUpdates).toBe(true);
    });

    test('should not detect updates when no changes', () => {
      const oldSeasons = [mockMovie, mockSeason2];
      const newSeasons = [mockMovie, mockSeason2];

      const hasUpdates = seriesUpdateManager.compareSeasons(
        oldSeasons,
        newSeasons
      );

      expect(hasUpdates).toBe(false);
    });

    test('should handle empty arrays', () => {
      const hasUpdates1 = seriesUpdateManager.compareSeasons([], [mockMovie]);
      const hasUpdates2 = seriesUpdateManager.compareSeasons([mockMovie], []);
      const hasUpdates3 = seriesUpdateManager.compareSeasons([], []);

      expect(hasUpdates1).toBe(true);
      expect(hasUpdates2).toBe(false);
      expect(hasUpdates3).toBe(false);
    });
  });

  describe('Background Checking', () => {
    test('should check series for updates', async () => {
      // Setup mock API response
      mockExtractItems.mockReturnValue([mockMovie, mockSeason2, mockSeason3]);
      mockApi.search.mockResolvedValue({ data: { items: [] } });

      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);
      seriesUpdateManager.trackSeries(seriesInfo, mockMovie);

      // Mock findRelatedSeasons
      jest.doMock('../modules/series-navigator.js', () => ({
        findRelatedSeasons: jest
          .fn()
          .mockResolvedValue([mockMovie, mockSeason2, mockSeason3])
      }));

      const hasUpdates = await seriesUpdateManager.checkSeriesForUpdates(
        seriesInfo.seriesId
      );

      expect(hasUpdates).toBe(true);
    });

    test('should respect minimum check interval', async () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);
      seriesUpdateManager.trackSeries(seriesInfo, mockMovie);

      // Set recent check time
      seriesUpdateManager.lastCheckTimes.set(seriesInfo.seriesId, Date.now());

      const hasUpdates = await seriesUpdateManager.checkSeriesForUpdates(
        seriesInfo.seriesId
      );

      expect(hasUpdates).toBe(false);
      expect(mockApi.search).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    test('should invalidate cache on force refresh', async () => {
      const cacheKey = mockMovie.slug;

      // Setup cache
      const mockCache = new Map();
      mockCache.set(cacheKey, {
        data: [mockMovie, mockSeason2],
        timestamp: Date.now()
      });

      // Mock cache access
      jest.doMock('../modules/series-navigator.js', () => ({
        relatedSeasonsCache: mockCache
      }));

      const result = await seriesNavigator.getCachedRelatedSeasons(
        mockMovie,
        mockApi,
        mockExtractItems,
        true // force refresh
      );

      expect(mockApi.search).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    test('should trigger update event', () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);
      const metadata = {
        seriesInfo,
        currentMovie: mockMovie
      };

      seriesUpdateManager.triggerUpdateEvent(
        seriesInfo.seriesId,
        [mockMovie, mockSeason2],
        metadata
      );

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'seriesUpdated',
          detail: expect.objectContaining({
            seriesId: seriesInfo.seriesId,
            seriesInfo: seriesInfo
          })
        })
      );
    });

    test('should call update callback', async () => {
      const callback = jest.fn();
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);

      seriesUpdateManager.trackSeries(seriesInfo, mockMovie, callback);

      // Simulate update
      const metadata = seriesUpdateManager.trackedSeries.get(
        seriesInfo.seriesId
      );
      metadata.lastKnownSeasons = [mockMovie];

      // Mock API to return new season
      mockExtractItems.mockReturnValue([mockMovie, mockSeason2]);
      jest.doMock('../modules/series-navigator.js', () => ({
        findRelatedSeasons: jest
          .fn()
          .mockResolvedValue([mockMovie, mockSeason2])
      }));

      await seriesUpdateManager.checkSeriesForUpdates(seriesInfo.seriesId);

      expect(callback).toHaveBeenCalledWith([mockMovie, mockSeason2], metadata);
    });
  });

  describe('Memory Management', () => {
    test('should clear all tracked series', () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);
      seriesUpdateManager.trackSeries(seriesInfo, mockMovie);

      expect(seriesUpdateManager.trackedSeries.size).toBe(1);

      seriesUpdateManager.clearAll();

      expect(seriesUpdateManager.trackedSeries.size).toBe(0);
      expect(seriesUpdateManager.isRunning).toBe(false);
    });

    test('should provide stats', () => {
      const seriesInfo = seriesNavigator.getSeriesBaseInfo(mockMovie);
      seriesUpdateManager.trackSeries(seriesInfo, mockMovie);

      const stats = seriesUpdateManager.getStats();

      expect(stats).toHaveProperty('trackedSeriesCount', 1);
      expect(stats).toHaveProperty('isRunning', true);
      expect(stats).toHaveProperty('config');
    });
  });

  describe('UI Integration', () => {
    test('should create series navigator with refresh button', () => {
      const relatedSeasons = [mockMovie, mockSeason2];
      const navigator = seriesNavigator.createSeriesNavigator(
        mockMovie,
        relatedSeasons,
        mockCreateEl
      );

      expect(navigator).toBeTruthy();
      expect(mockCreateEl).toHaveBeenCalledWith(
        'button',
        'series-navigator__refresh-btn',
        '🔄'
      );
    });

    test('should handle refresh button click', async () => {
      const relatedSeasons = [mockMovie, mockSeason2];
      const navigator = seriesNavigator.createSeriesNavigator(
        mockMovie,
        relatedSeasons,
        mockCreateEl
      );

      // Find refresh button
      const refreshBtn = navigator.querySelector(
        '.series-navigator__refresh-btn'
      );
      expect(refreshBtn).toBeTruthy();

      // Mock successful refresh
      mockApi.search.mockResolvedValue({ data: { items: [] } });
      mockExtractItems.mockReturnValue([mockMovie, mockSeason2, mockSeason3]);

      // Simulate click
      await refreshBtn.click();

      expect(window.showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '✅ Đã cập nhật danh sách phần phim'
        })
      );
    });
  });
});
