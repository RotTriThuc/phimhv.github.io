/* Testing Framework - Comprehensive unit testing for all modules */

import { Logger } from './logger.js';

// Simple test framework
class TestFramework {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.currentSuite = null;
  }

  describe(suiteName, callback) {
    this.currentSuite = suiteName;
    Logger.info(`🧪 Running test suite: ${suiteName}`);
    callback();
    this.currentSuite = null;
  }

  it(testName, callback) {
    const fullName = this.currentSuite
      ? `${this.currentSuite} - ${testName}`
      : testName;
    this.results.total++;

    try {
      callback();
      this.results.passed++;
      Logger.debug(`✅ ${fullName}`);
    } catch (error) {
      this.results.failed++;
      Logger.error(`❌ ${fullName}:`, error.message);
    }
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(
            `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
          );
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, but got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, but got ${actual}`);
        }
      },
      toContain: (expected) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${actual} to contain ${expected}`);
        }
      },
      toThrow: () => {
        let threw = false;
        try {
          if (typeof actual === 'function') {
            actual();
          }
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          throw new Error('Expected function to throw an error');
        }
      }
    };
  }

  async runAllTests() {
    Logger.info('🚀 Starting comprehensive test suite...');

    // Reset results
    this.results = { passed: 0, failed: 0, total: 0 };

    // Run all test suites
    await this.testLogger();
    await this.testUtils();
    await this.testApiCache();
    await this.testImageLoader();
    await this.testUIComponents();
    await this.testRouter();

    // Print results
    this.printResults();

    return this.results;
  }

  printResults() {
    const { passed, failed, total } = this.results;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    Logger.info('\n📊 Test Results:');
    Logger.info(`✅ Passed: ${passed}`);
    Logger.info(`❌ Failed: ${failed}`);
    Logger.info(`📈 Pass Rate: ${passRate}%`);
    Logger.info(`📋 Total: ${total}`);

    if (failed === 0) {
      Logger.info('🎉 All tests passed!');
    } else {
      Logger.warn(`⚠️ ${failed} test(s) failed`);
    }
  }

  // Logger module tests
  async testLogger() {
    this.describe('Logger Module', () => {
      this.it('should have all required methods', () => {
        const { Logger } = require('./logger.js');
        this.expect(typeof Logger.debug).toBe('function');
        this.expect(typeof Logger.info).toBe('function');
        this.expect(typeof Logger.warn).toBe('function');
        this.expect(typeof Logger.error).toBe('function');
        this.expect(typeof Logger.critical).toBe('function');
      });

      this.it('should handle environment detection', () => {
        const { isDev } = require('./logger.js');
        this.expect(typeof isDev).toBe('boolean');
      });
    });
  }

  // Utils module tests
  async testUtils() {
    this.describe('Utils Module', () => {
      this.it('should create DOM elements correctly', () => {
        const { createEl } = require('./utils.js');
        const element = createEl('div', 'test-class', 'test content');
        this.expect(element.tagName).toBe('DIV');
        this.expect(element.className).toBe('test-class');
        this.expect(element.textContent).toBe('test content');
      });

      this.it('should parse hash correctly', () => {
        const { parseHash } = require('./utils.js');

        // Mock window.location.hash
        const originalHash = window.location.hash;
        window.location.hash = '#/test?param=value';

        const result = parseHash();
        this.expect(result.path).toBe('/test');
        this.expect(result.params.get('param')).toBe('value');

        // Restore original hash
        window.location.hash = originalHash;
      });

      this.it('should format time correctly', () => {
        const { formatTime } = require('./utils.js');
        this.expect(formatTime(0)).toBe('0:00');
        this.expect(formatTime(65)).toBe('1:05');
        this.expect(formatTime(3665)).toBe('1:01:05');
      });

      this.it('should debounce function calls', (done) => {
        const { debounce } = require('./utils.js');
        let callCount = 0;
        const debouncedFn = debounce(() => callCount++, 100);

        debouncedFn();
        debouncedFn();
        debouncedFn();

        setTimeout(() => {
          this.expect(callCount).toBe(1);
          done();
        }, 150);
      });
    });
  }

  // API Cache tests
  async testApiCache() {
    this.describe('API Cache', () => {
      this.it('should cache and retrieve data', () => {
        const { AdvancedAPICache } = require('./api.js');
        const cache = new AdvancedAPICache();

        const testData = { test: 'data' };
        cache.set('test-url', testData);

        const retrieved = cache.get('test-url');
        this.expect(retrieved).toEqual(testData);
      });

      this.it('should handle cache expiration', (done) => {
        const { AdvancedAPICache } = require('./api.js');
        const cache = new AdvancedAPICache();

        // Override cache duration for testing
        cache.cacheDurations.default = 50; // 50ms

        cache.set('test-url', { test: 'data' });

        setTimeout(() => {
          const retrieved = cache.get('test-url');
          this.expect(retrieved).toBe(null);
          done();
        }, 100);
      });

      this.it('should implement LRU eviction', () => {
        const { AdvancedAPICache } = require('./api.js');
        const cache = new AdvancedAPICache();
        cache.maxSize = 2; // Small cache for testing

        cache.set('url1', 'data1');
        cache.set('url2', 'data2');
        cache.set('url3', 'data3'); // Should evict url1

        this.expect(cache.get('url1')).toBe(null);
        this.expect(cache.get('url2')).toBeTruthy();
        this.expect(cache.get('url3')).toBeTruthy();
      });
    });
  }

  // Image Loader tests
  async testImageLoader() {
    this.describe('Image Loader', () => {
      this.it('should detect network speed', () => {
        const { ProgressiveImageLoader } = require('./image-loader.js');
        const loader = new ProgressiveImageLoader();

        this.expect(['slow', 'medium', 'fast']).toContain(loader.networkSpeed);
        this.expect(typeof loader.defaultQuality).toBe('number');
      });

      this.it('should generate optimized URLs', () => {
        const { ProgressiveImageLoader } = require('./image-loader.js');
        const loader = new ProgressiveImageLoader();

        const originalUrl = 'https://example.com/image.jpg';
        const optimizedUrls = loader.getOptimizedUrl(originalUrl, {
          width: 300,
          quality: 75
        });

        this.expect(Array.isArray(optimizedUrls)).toBeTruthy();
        this.expect(optimizedUrls.length).toBe(3); // 2 CDN + original
      });

      this.it('should track CDN performance', () => {
        const { ProgressiveImageLoader } = require('./image-loader.js');
        const loader = new ProgressiveImageLoader();

        loader.recordCDNPerformance('https://cdn1.example.com/image.jpg', 100);
        loader.recordCDNPerformance('https://cdn2.example.com/image.jpg', 200);

        this.expect(loader.cdnPerformance.get('cdn1.example.com')).toBe(100);
        this.expect(loader.cdnPerformance.get('cdn2.example.com')).toBe(200);
      });
    });
  }

  // UI Components tests
  async testUIComponents() {
    this.describe('UI Components', () => {
      this.it('should create movie cards', () => {
        const { createMovieCard } = require('./ui-components.js');

        const mockMovie = {
          slug: 'test-movie',
          name: 'Test Movie',
          poster_url: 'https://example.com/poster.jpg',
          year: 2023
        };

        const card = createMovieCard(mockMovie);
        this.expect(card.tagName).toBe('ARTICLE');
        this.expect(card.className).toContain('card');
      });

      this.it('should create pagination', () => {
        const { createPagination } = require('./ui-components.js');

        const pagination = createPagination(2, 5, '#/test');
        this.expect(pagination.tagName).toBe('NAV');
        this.expect(pagination.className).toContain('pagination');
      });

      this.it('should handle empty movie list', () => {
        const { listGrid } = require('./ui-components.js');

        const grid = listGrid([]);
        this.expect(grid.className).toContain('grid');
        this.expect(grid.querySelector('.empty-state')).toBeTruthy();
      });
    });
  }

  // Router tests
  async testRouter() {
    this.describe('Router', () => {
      this.it('should parse current route', () => {
        const { getCurrentRoute } = require('./router.js');

        // Mock window.location.hash
        const originalHash = window.location.hash;
        window.location.hash = '#/test?param=value';

        const route = getCurrentRoute();
        this.expect(route.path).toBe('/test');
        this.expect(route.params.param).toBe('value');

        // Restore original hash
        window.location.hash = originalHash;
      });

      this.it('should register page renderers', () => {
        const { registerPageRenderers } = require('./router.js');

        const mockRenderers = {
          renderTest: () => 'test'
        };

        // Should not throw
        this.expect(() => registerPageRenderers(mockRenderers)).not.toThrow();
      });
    });
  }
}

// Performance testing utilities
export class PerformanceTest {
  constructor() {
    this.benchmarks = [];
  }

  async benchmark(name, fn, iterations = 1000) {
    Logger.info(`🏃 Running benchmark: ${name} (${iterations} iterations)`);

    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    const result = {
      name,
      iterations,
      average: avg.toFixed(3),
      min: min.toFixed(3),
      max: max.toFixed(3),
      total: times.reduce((sum, time) => sum + time, 0).toFixed(3)
    };

    this.benchmarks.push(result);

    Logger.info(
      `📊 ${name}: avg=${result.average}ms, min=${result.min}ms, max=${result.max}ms`
    );

    return result;
  }

  printBenchmarkResults() {
    Logger.info('\n🏆 Performance Benchmark Results:');
    this.benchmarks.forEach((result) => {
      Logger.info(
        `${result.name}: ${result.average}ms avg (${result.iterations} runs)`
      );
    });
  }
}

// Memory testing utilities
export class MemoryTest {
  constructor() {
    this.snapshots = [];
  }

  takeSnapshot(label) {
    if ('memory' in performance) {
      const snapshot = {
        label,
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };

      this.snapshots.push(snapshot);
      Logger.debug(
        `📸 Memory snapshot [${label}]: ${(snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
      );

      return snapshot;
    } else {
      Logger.warn('Performance.memory not available');
      return null;
    }
  }

  compareSnapshots(label1, label2) {
    const snap1 = this.snapshots.find((s) => s.label === label1);
    const snap2 = this.snapshots.find((s) => s.label === label2);

    if (!snap1 || !snap2) {
      Logger.error('Snapshots not found for comparison');
      return null;
    }

    const diff = snap2.usedJSHeapSize - snap1.usedJSHeapSize;
    const diffMB = (diff / 1024 / 1024).toFixed(2);

    Logger.info(`🔍 Memory diff [${label1} → ${label2}]: ${diffMB}MB`);

    return {
      difference: diff,
      differenceMB: diffMB,
      percentage: ((diff / snap1.usedJSHeapSize) * 100).toFixed(2)
    };
  }

  printMemoryReport() {
    Logger.info('\n🧠 Memory Usage Report:');
    this.snapshots.forEach((snapshot) => {
      const usedMB = (snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (snapshot.totalJSHeapSize / 1024 / 1024).toFixed(2);
      Logger.info(`${snapshot.label}: ${usedMB}MB / ${totalMB}MB`);
    });
  }
}

// Global test instances
export const testFramework = new TestFramework();
export const performanceTest = new PerformanceTest();
export const memoryTest = new MemoryTest();

// Auto-run tests in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Run tests after a delay to ensure all modules are loaded
  setTimeout(() => {
    testFramework.runAllTests();
  }, 2000);
}
