/* Hard Refresh Manager Tests */

// Mock browser APIs
const mockCaches = {
  keys: jest.fn(() => Promise.resolve(['cache1', 'cache2', 'cache3'])),
  delete: jest.fn(() => Promise.resolve(true)),
  open: jest.fn(() => Promise.resolve({
    keys: jest.fn(() => Promise.resolve([]))
  }))
};

const mockServiceWorker = {
  ready: Promise.resolve({
    active: {
      postMessage: jest.fn()
    }
  }),
  addEventListener: jest.fn()
};

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockSessionStorage = {
  clear: jest.fn()
};

// Setup global mocks
global.caches = mockCaches;
global.navigator = {
  serviceWorker: mockServiceWorker
};
global.localStorage = mockLocalStorage;
global.sessionStorage = mockSessionStorage;
global.window = {
  location: {
    href: 'https://example.com',
    reload: jest.fn()
  }
};
global.document = {
  addEventListener: jest.fn(),
  createElement: jest.fn(() => ({
    style: {},
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
    remove: jest.fn()
  })),
  body: {
    appendChild: jest.fn()
  },
  getElementById: jest.fn(),
  readyState: 'complete'
};

// Import the module
import { HardRefreshManager } from '../modules/hard-refresh.js';

describe('HardRefreshManager', () => {
  let hardRefreshManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create new instance
    hardRefreshManager = new HardRefreshManager();
  });

  afterEach(() => {
    if (hardRefreshManager) {
      hardRefreshManager.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      expect(hardRefreshManager.isInitialized).toBe(true);
      expect(hardRefreshManager.supportedFeatures).toBeDefined();
    });

    test('should detect browser support correctly', () => {
      const features = hardRefreshManager.supportedFeatures;
      
      expect(features.cacheAPI).toBe(true);
      expect(features.serviceWorker).toBe(true);
      expect(features.localStorage).toBe(true);
      expect(features.sessionStorage).toBe(true);
    });

    test('should setup keyboard listeners', () => {
      expect(document.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { capture: true, passive: false }
      );
    });
  });

  describe('Cache Clearing', () => {
    test('should clear all caches successfully', async () => {
      await hardRefreshManager.clearAllCaches();
      
      expect(mockCaches.keys).toHaveBeenCalled();
      expect(mockCaches.delete).toHaveBeenCalledTimes(3);
      expect(mockCaches.delete).toHaveBeenCalledWith('cache1');
      expect(mockCaches.delete).toHaveBeenCalledWith('cache2');
      expect(mockCaches.delete).toHaveBeenCalledWith('cache3');
    });

    test('should handle cache clearing errors gracefully', async () => {
      mockCaches.delete.mockRejectedValueOnce(new Error('Cache delete failed'));
      
      // Should not throw
      await expect(hardRefreshManager.clearAllCaches()).resolves.not.toThrow();
    });

    test('should clear storages with data preservation', async () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      await hardRefreshManager.clearStorages();
      
      expect(mockLocalStorage.clear).toHaveBeenCalled();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('Service Worker Communication', () => {
    test('should send message to service worker', async () => {
      const mockActive = {
        postMessage: jest.fn()
      };
      
      mockServiceWorker.ready = Promise.resolve({
        active: mockActive
      });
      
      await hardRefreshManager.notifyServiceWorker();
      
      expect(mockActive.postMessage).toHaveBeenCalledWith({
        type: 'HARD_REFRESH_REQUEST',
        timestamp: expect.any(Number)
      });
    });

    test('should handle service worker not available', async () => {
      mockServiceWorker.ready = Promise.resolve({
        active: null
      });
      
      // Should not throw
      await expect(hardRefreshManager.notifyServiceWorker()).resolves.not.toThrow();
    });
  });

  describe('Hard Refresh Execution', () => {
    test('should perform complete hard refresh', async () => {
      const spy = jest.spyOn(hardRefreshManager, 'clearAllCaches').mockResolvedValue();
      const spy2 = jest.spyOn(hardRefreshManager, 'clearStorages').mockResolvedValue();
      const spy3 = jest.spyOn(hardRefreshManager, 'notifyServiceWorker').mockResolvedValue();
      const spy4 = jest.spyOn(hardRefreshManager, 'reloadWithCacheBusting').mockImplementation();
      
      await hardRefreshManager.performHardRefresh('test');
      
      expect(spy).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();
      expect(spy4).toHaveBeenCalled();
    });

    test('should handle refresh errors with fallback', async () => {
      jest.spyOn(hardRefreshManager, 'clearAllCaches').mockRejectedValue(new Error('Test error'));
      const fallbackSpy = jest.spyOn(hardRefreshManager, 'fallbackRefresh').mockImplementation();
      
      await hardRefreshManager.performHardRefresh('test');
      
      expect(fallbackSpy).toHaveBeenCalled();
    });

    test('should debounce multiple rapid calls', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(hardRefreshManager, 'performHardRefresh').mockImplementation();
      
      // Trigger multiple times rapidly
      hardRefreshManager.triggerHardRefresh('test1');
      hardRefreshManager.triggerHardRefresh('test2');
      hardRefreshManager.triggerHardRefresh('test3');
      
      // Fast-forward time
      jest.advanceTimersByTime(600);
      
      // Should only call once with the last trigger
      expect(spy).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });
  });

  describe('Mobile Support', () => {
    test('should setup touch event listeners when enabled', () => {
      hardRefreshManager.config.enableMobileSupport = true;
      hardRefreshManager.setupMobileSupport();
      
      expect(document.addEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: true }
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        { passive: true }
      );
      expect(document.addEventListener).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
        { passive: true }
      );
    });
  });

  describe('Configuration', () => {
    test('should allow enabling confirmation dialog', () => {
      hardRefreshManager.setConfirmationEnabled(true);
      expect(hardRefreshManager.config.confirmationEnabled).toBe(true);
    });

    test('should allow disabling mobile support', () => {
      hardRefreshManager.setMobileSupport(false);
      expect(hardRefreshManager.config.enableMobileSupport).toBe(false);
    });

    test('should return current status', () => {
      const status = hardRefreshManager.getStatus();
      
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('isRefreshing');
      expect(status).toHaveProperty('supportedFeatures');
      expect(status).toHaveProperty('config');
    });
  });

  describe('UI Elements', () => {
    test('should create progress indicator', () => {
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should show and hide progress indicator', () => {
      const mockElement = {
        style: {},
        remove: jest.fn()
      };
      document.getElementById.mockReturnValue(mockElement);
      
      hardRefreshManager.showProgressIndicator();
      expect(mockElement.style.display).toBe('block');
      
      hardRefreshManager.hideProgressIndicator();
      expect(mockElement.style.opacity).toBe('0');
    });
  });

  describe('Error Handling', () => {
    test('should show error notification on failure', () => {
      const error = new Error('Test error');
      hardRefreshManager.showErrorNotification(error);
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should fallback to basic reload on all failures', () => {
      hardRefreshManager.fallbackRefresh();
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should destroy instance properly', () => {
      const mockElement = { remove: jest.fn() };
      document.getElementById.mockReturnValue(mockElement);
      
      hardRefreshManager.destroy();
      
      expect(hardRefreshManager.isInitialized).toBe(false);
      expect(mockElement.remove).toHaveBeenCalled();
    });
  });
});

// Integration tests
describe('HardRefreshManager Integration', () => {
  test('should integrate with existing app systems', () => {
    // Mock existing app globals
    global.Logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    
    const manager = new HardRefreshManager();
    
    expect(manager.isInitialized).toBe(true);
    expect(global.Logger.info).toHaveBeenCalled();
  });

  test('should work without service worker', () => {
    global.navigator.serviceWorker = undefined;
    
    const manager = new HardRefreshManager();
    
    expect(manager.supportedFeatures.serviceWorker).toBe(false);
    expect(manager.isInitialized).toBe(true);
  });

  test('should work with limited browser support', () => {
    global.caches = undefined;
    global.localStorage = undefined;
    
    const manager = new HardRefreshManager();
    
    expect(manager.supportedFeatures.cacheAPI).toBe(false);
    expect(manager.supportedFeatures.localStorage).toBe(false);
    expect(manager.isInitialized).toBe(true);
  });
});
