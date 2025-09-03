/**
 * Network Monitor Module - Phát hiện chất lượng mạng và tối ưu hóa adaptive streaming
 * Tác giả: AI Assistant
 * Mô tả: Module theo dõi băng thông, loại kết nối và đề xuất chất lượng video phù hợp
 */

import { Logger } from './logger.js';

// Cấu hình network monitoring
const NETWORK_CONFIG = {
  // Test endpoints cho bandwidth measurement
  testEndpoints: [
    'https://phimapi.com/ping',
    'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js',
    'https://img.phimapi.com/test.jpg'
  ],

  // Thresholds cho quality levels
  qualityThresholds: {
    low: 0.5, // < 0.5 Mbps
    medium: 2, // 0.5-2 Mbps
    high: 5, // 2-5 Mbps
    ultra: 10 // > 5 Mbps
  },

  // Measurement intervals
  measureInterval: 30000, // 30 seconds
  quickTestSize: 50000, // 50KB for quick tests
  fullTestSize: 500000, // 500KB for detailed tests

  // Connection type priorities
  connectionPriority: {
    ethernet: 4,
    wifi: 3,
    '4g': 2,
    '3g': 1,
    'slow-2g': 0
  }
};

/**
 * Network Quality Monitor Class
 * Theo dõi và phân tích chất lượng mạng real-time
 */
export class NetworkMonitor {
  constructor() {
    this.isMonitoring = false;
    this.currentQuality = 'medium';
    this.bandwidth = 0;
    this.latency = 0;
    this.connectionType = 'unknown';
    this.measurements = [];
    this.listeners = new Set();

    // Performance tracking
    this.stats = {
      totalTests: 0,
      successfulTests: 0,
      averageBandwidth: 0,
      averageLatency: 0
    };

    this.init();
  }

  /**
   * Khởi tạo network monitor
   */
  async init() {
    try {
      // Detect initial connection
      await this.detectConnection();

      // Start monitoring if supported
      if (this.isNetworkAPISupported()) {
        this.setupNetworkAPI();
      }

      // Initial bandwidth test
      await this.measureBandwidth();

      Logger.info('🌐 Network Monitor initialized', {
        quality: this.currentQuality,
        bandwidth: this.bandwidth,
        connection: this.connectionType
      });
    } catch (error) {
      Logger.error('❌ Network Monitor initialization failed:', error);
    }
  }

  /**
   * Kiểm tra hỗ trợ Network Information API
   */
  isNetworkAPISupported() {
    return (
      'connection' in navigator ||
      'mozConnection' in navigator ||
      'webkitConnection' in navigator
    );
  }

  /**
   * Setup Network Information API listeners
   */
  setupNetworkAPI() {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      // Update connection info
      this.updateConnectionInfo(connection);

      // Listen for changes
      connection.addEventListener('change', () => {
        this.updateConnectionInfo(connection);
        this.notifyListeners('connectionChange', {
          type: this.connectionType,
          quality: this.currentQuality
        });
      });
    }
  }

  /**
   * Cập nhật thông tin kết nối từ Network API
   */
  updateConnectionInfo(connection) {
    this.connectionType =
      connection.effectiveType || connection.type || 'unknown';

    // Estimate bandwidth from connection type
    if (connection.downlink) {
      this.bandwidth = connection.downlink;
    }

    // Update quality based on connection
    this.updateQualityRecommendation();

    Logger.debug('📡 Connection updated:', {
      type: this.connectionType,
      downlink: connection.downlink,
      rtt: connection.rtt
    });
  }

  /**
   * Phát hiện loại kết nối ban đầu
   */
  async detectConnection() {
    if (this.isNetworkAPISupported()) {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      if (connection) {
        this.updateConnectionInfo(connection);
        return;
      }
    }

    // Fallback: estimate from user agent and performance
    this.connectionType = this.estimateConnectionType();
  }

  /**
   * Ước tính loại kết nối từ user agent
   */
  estimateConnectionType() {
    const ua = navigator.userAgent.toLowerCase();

    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      return '4g'; // Assume mobile is 4G
    }

    return 'wifi'; // Assume desktop is WiFi
  }

  /**
   * Đo băng thông mạng
   */
  async measureBandwidth(detailed = false) {
    const testSize = detailed
      ? NETWORK_CONFIG.fullTestSize
      : NETWORK_CONFIG.quickTestSize;
    const testUrl = this.selectTestEndpoint();

    try {
      const startTime = performance.now();

      // Create test request with cache busting
      const response = await fetch(
        `${testUrl}?t=${Date.now()}&size=${testSize}`,
        {
          method: 'HEAD',
          cache: 'no-cache'
        }
      );

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // seconds

      if (response.ok) {
        // Calculate bandwidth (Mbps)
        const bandwidth = (testSize * 8) / (duration * 1000000);

        this.updateBandwidth(bandwidth);
        this.updateLatency(duration * 1000); // ms

        this.stats.totalTests++;
        this.stats.successfulTests++;

        Logger.debug('📊 Bandwidth measured:', {
          bandwidth: bandwidth.toFixed(2) + ' Mbps',
          latency: (duration * 1000).toFixed(0) + ' ms',
          testSize: testSize
        });

        return bandwidth;
      }
    } catch (error) {
      this.stats.totalTests++;
      Logger.warn('⚠️ Bandwidth measurement failed:', error);
    }

    return null;
  }

  /**
   * Chọn test endpoint tốt nhất
   */
  selectTestEndpoint() {
    // TODO: Implement endpoint performance tracking
    return NETWORK_CONFIG.testEndpoints[0];
  }

  /**
   * Cập nhật băng thông với smoothing
   */
  updateBandwidth(newBandwidth) {
    if (this.bandwidth === 0) {
      this.bandwidth = newBandwidth;
    } else {
      // Exponential moving average for smoothing
      this.bandwidth = this.bandwidth * 0.7 + newBandwidth * 0.3;
    }

    // Update measurements history
    this.measurements.push({
      timestamp: Date.now(),
      bandwidth: newBandwidth,
      quality: this.getQualityFromBandwidth(newBandwidth)
    });

    // Keep only last 10 measurements
    if (this.measurements.length > 10) {
      this.measurements.shift();
    }

    // Update quality recommendation
    this.updateQualityRecommendation();

    // Update stats
    this.updateStats();
  }

  /**
   * Cập nhật latency
   */
  updateLatency(newLatency) {
    if (this.latency === 0) {
      this.latency = newLatency;
    } else {
      this.latency = this.latency * 0.7 + newLatency * 0.3;
    }
  }

  /**
   * Xác định quality từ bandwidth
   */
  getQualityFromBandwidth(bandwidth) {
    const thresholds = NETWORK_CONFIG.qualityThresholds;

    if (bandwidth >= thresholds.ultra) return 'ultra';
    if (bandwidth >= thresholds.high) return 'high';
    if (bandwidth >= thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Cập nhật đề xuất chất lượng
   */
  updateQualityRecommendation() {
    const bandwidthQuality = this.getQualityFromBandwidth(this.bandwidth);
    const connectionPriority =
      NETWORK_CONFIG.connectionPriority[this.connectionType] || 2;

    // Adjust quality based on connection type
    let recommendedQuality = bandwidthQuality;

    if (connectionPriority <= 1) {
      recommendedQuality = 'low';
    } else if (connectionPriority === 2 && bandwidthQuality === 'ultra') {
      recommendedQuality = 'high';
    }

    if (this.currentQuality !== recommendedQuality) {
      const oldQuality = this.currentQuality;
      this.currentQuality = recommendedQuality;

      Logger.info('🎯 Quality recommendation updated:', {
        from: oldQuality,
        to: recommendedQuality,
        bandwidth: this.bandwidth.toFixed(2) + ' Mbps',
        connection: this.connectionType
      });

      this.notifyListeners('qualityChange', {
        oldQuality,
        newQuality: recommendedQuality,
        bandwidth: this.bandwidth,
        connectionType: this.connectionType
      });
    }
  }

  /**
   * Cập nhật thống kê
   */
  updateStats() {
    if (this.measurements.length > 0) {
      const totalBandwidth = this.measurements.reduce(
        (sum, m) => sum + m.bandwidth,
        0
      );
      this.stats.averageBandwidth = totalBandwidth / this.measurements.length;
    }

    this.stats.averageLatency = this.latency;
  }

  /**
   * Bắt đầu monitoring định kỳ
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.measureBandwidth();
    }, NETWORK_CONFIG.measureInterval);

    Logger.info('🔄 Network monitoring started');
  }

  /**
   * Dừng monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    Logger.info('⏹️ Network monitoring stopped');
  }

  /**
   * Thêm listener cho network events
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Xóa listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Thông báo cho listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        Logger.error('❌ Listener callback failed:', error);
      }
    });
  }

  /**
   * Lấy thông tin network hiện tại
   */
  getNetworkInfo() {
    return {
      quality: this.currentQuality,
      bandwidth: this.bandwidth,
      latency: this.latency,
      connectionType: this.connectionType,
      isMonitoring: this.isMonitoring,
      stats: { ...this.stats },
      measurements: [...this.measurements]
    };
  }

  /**
   * Lấy đề xuất cấu hình video
   */
  getVideoConfig() {
    const configs = {
      low: {
        maxBitrate: 500000, // 500 Kbps
        maxHeight: 360,
        bufferSize: 10, // seconds
        preloadSegments: 2
      },
      medium: {
        maxBitrate: 1500000, // 1.5 Mbps
        maxHeight: 480,
        bufferSize: 15,
        preloadSegments: 3
      },
      high: {
        maxBitrate: 3000000, // 3 Mbps
        maxHeight: 720,
        bufferSize: 20,
        preloadSegments: 4
      },
      ultra: {
        maxBitrate: 6000000, // 6 Mbps
        maxHeight: 1080,
        bufferSize: 30,
        preloadSegments: 5
      }
    };

    return configs[this.currentQuality] || configs.medium;
  }
}

// Global instance
export const networkMonitor = new NetworkMonitor();

// Auto-start monitoring
if (typeof window !== 'undefined') {
  // Start monitoring after page load
  if (document.readyState === 'complete') {
    networkMonitor.startMonitoring();
  } else {
    window.addEventListener('load', () => {
      networkMonitor.startMonitoring();
    });
  }
}
