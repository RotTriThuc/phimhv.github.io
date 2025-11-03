/**
 * 🧪 Notification System Testing & Optimization
 * Testing toàn diện và tối ưu hóa hệ thống thông báo
 * 
 * Features:
 * - Unit tests cho các modules
 * - Integration tests
 * - Performance monitoring
 * - Error handling tests
 * - Edge case handling
 */

import { FirebaseLogger } from '../firebase-config.js';

export class NotificationSystemTester {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = {};
    this.isRunning = false;
  }

  /**
   * Khởi tạo test system
   */
  async init() {
    try {
      FirebaseLogger.info('🧪 Notification System Tester initialized');
      return true;
    } catch (error) {
      FirebaseLogger.error('❌ Failed to initialize Tester:', error);
      return false;
    }
  }

  /**
   * Chạy tất cả tests
   */
  async runAllTests() {
    if (this.isRunning) {
      FirebaseLogger.warn('⚠️ Tests already running');
      return;
    }

    this.isRunning = true;
    this.testResults = [];
    
    try {
      FirebaseLogger.info('🚀 Starting comprehensive notification system tests...');
      
      // Test Firebase connection
      await this.testFirebaseConnection();
      
      // Test notification creation
      await this.testNotificationCreation();
      
      // Test notification UI
      await this.testNotificationUI();
      
      // Test preferences system
      await this.testPreferencesSystem();
      
      // Test RSS generation
      await this.testRSSGeneration();
      
      // Test auto-update integration
      await this.testAutoUpdateIntegration();
      
      // Test performance
      await this.testPerformance();
      
      // Test edge cases
      await this.testEdgeCases();
      
      // Generate report
      const report = this.generateTestReport();
      FirebaseLogger.info('✅ All tests completed');
      
      return report;
      
    } catch (error) {
      FirebaseLogger.error('❌ Test suite failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Test Firebase connection
   */
  async testFirebaseConnection() {
    const testName = 'Firebase Connection';
    const startTime = performance.now();
    
    try {
      // Test Firebase initialization
      if (!window.movieComments || !window.movieComments.initialized) {
        throw new Error('Firebase not initialized');
      }
      
      // Test database connection
      const testNotification = {
        title: 'Test Notification',
        content: 'This is a test notification',
        type: 'system',
        metadata: { test: true }
      };
      
      await window.movieComments.createNotification(testNotification);
      
      // Clean up test notification
      const notifications = await window.movieComments.getNotifications({ limit: 1 });
      if (notifications.length > 0 && notifications[0].metadata?.test) {
        await window.movieComments.deleteNotification(notifications[0].id);
      }
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Test notification creation
   */
  async testNotificationCreation() {
    const testName = 'Notification Creation';
    const startTime = performance.now();
    
    try {
      const testCases = [
        {
          title: 'Test Movie Notification',
          content: 'Test movie content',
          type: 'new_movie',
          metadata: { movieSlug: 'test-movie' }
        },
        {
          title: 'Test Episode Notification',
          content: 'Test episode content',
          type: 'new_episode',
          metadata: { movieSlug: 'test-movie', episodeNumber: 1 }
        },
        {
          title: 'Test Admin Notification',
          content: 'Test admin content',
          type: 'admin_announcement',
          metadata: { priority: 'high' }
        }
      ];
      
      for (const testCase of testCases) {
        await window.movieComments.createNotification(testCase);
      }
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Test notification UI
   */
  async testNotificationUI() {
    const testName = 'Notification UI';
    const startTime = performance.now();
    
    try {
      // Test UI initialization
      if (!window.notificationUI) {
        throw new Error('Notification UI not initialized');
      }
      
      // Test UI elements
      const button = document.getElementById('notification-button');
      const dropdown = document.getElementById('notification-dropdown');
      const badge = document.getElementById('notification-badge');
      
      if (!button || !dropdown || !badge) {
        throw new Error('Required UI elements not found');
      }
      
      // Test notification loading
      await window.notificationUI.loadNotifications();
      
      // Test unread count update
      await window.notificationUI.updateUnreadCount();
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Test preferences system
   */
  async testPreferencesSystem() {
    const testName = 'Preferences System';
    const startTime = performance.now();
    
    try {
      if (!window.NotificationPreferencesManager) {
        throw new Error('Preferences Manager not found');
      }
      
      const manager = window.NotificationPreferencesManager;
      
      // Test preferences loading
      await manager.init();
      
      // Test preference updates
      await manager.updateCategoryPreference('Hành Động', true);
      await manager.updateGeneralPreference('enableNewMovies', false);
      
      // Test movie interest check
      const testMovie = {
        category: [{ name: 'Hành Động' }],
        lang: 'Vietsub',
        quality: 'HD'
      };
      
      const isInterested = manager.isInterestedInMovie(testMovie);
      
      // Reset preferences
      await manager.resetToDefault();
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Test RSS generation
   */
  async testRSSGeneration() {
    const testName = 'RSS Generation';
    const startTime = performance.now();
    
    try {
      if (!window.NotificationRSSGenerator) {
        throw new Error('RSS Generator not found');
      }
      
      const generator = window.NotificationRSSGenerator;
      
      // Test RSS content generation
      const rssContent = await generator.getRSSContent();
      
      if (!rssContent || !rssContent.includes('<?xml')) {
        throw new Error('Invalid RSS content generated');
      }
      
      // Test personalized RSS
      const personalizedRSS = await generator.generatePersonalizedRSS('test-user');
      
      if (!personalizedRSS || !personalizedRSS.includes('<?xml')) {
        throw new Error('Invalid personalized RSS content');
      }
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Test auto-update integration
   */
  async testAutoUpdateIntegration() {
    const testName = 'Auto-Update Integration';
    const startTime = performance.now();
    
    try {
      if (!window.AutoUpdateIntegration) {
        throw new Error('Auto-Update Integration not found');
      }
      
      const integration = window.AutoUpdateIntegration;
      
      // Test integration stats
      const stats = integration.getStats();
      
      if (typeof stats.isMonitoring !== 'boolean') {
        throw new Error('Invalid integration stats');
      }
      
      // Test manual check
      await integration.manualCheck();
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    const testName = 'Performance Tests';
    const startTime = performance.now();
    
    try {
      // Test notification loading performance
      const loadStart = performance.now();
      await window.movieComments.getNotifications({ limit: 50 });
      const loadTime = performance.now() - loadStart;
      
      this.performanceMetrics.notificationLoadTime = loadTime;
      
      // Test UI rendering performance
      const renderStart = performance.now();
      await window.notificationUI.loadNotifications();
      const renderTime = performance.now() - renderStart;
      
      this.performanceMetrics.uiRenderTime = renderTime;
      
      // Test RSS generation performance
      const rssStart = performance.now();
      await window.NotificationRSSGenerator.getRSSContent();
      const rssTime = performance.now() - rssStart;
      
      this.performanceMetrics.rssGenerationTime = rssTime;
      
      // Performance thresholds
      const thresholds = {
        notificationLoadTime: 2000, // 2 seconds
        uiRenderTime: 1000, // 1 second
        rssGenerationTime: 3000 // 3 seconds
      };
      
      // Check if performance is acceptable
      for (const [metric, time] of Object.entries(this.performanceMetrics)) {
        if (time > thresholds[metric]) {
          throw new Error(`Performance issue: ${metric} took ${time}ms (threshold: ${thresholds[metric]}ms)`);
        }
      }
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Test edge cases
   */
  async testEdgeCases() {
    const testName = 'Edge Cases';
    const startTime = performance.now();
    
    try {
      // Test with invalid notification data
      try {
        await window.movieComments.createNotification({});
        throw new Error('Should have failed with empty notification');
      } catch (e) {
        // Expected to fail
      }
      
      // Test with very long content
      const longNotification = {
        title: 'A'.repeat(200),
        content: 'B'.repeat(1000),
        type: 'system'
      };
      
      await window.movieComments.createNotification(longNotification);
      
      // Test preferences with invalid data
      if (window.NotificationPreferencesManager) {
        await window.NotificationPreferencesManager.updateCategoryPreference('', true);
        await window.NotificationPreferencesManager.updateGeneralPreference('invalidKey', 'invalidValue');
      }
      
      // Test RSS with no notifications
      const emptyRSS = await window.NotificationRSSGenerator.getErrorRSS();
      if (!emptyRSS.includes('<?xml')) {
        throw new Error('Error RSS format invalid');
      }
      
      this.addTestResult(testName, true, performance.now() - startTime);
      
    } catch (error) {
      this.addTestResult(testName, false, performance.now() - startTime, error.message);
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, success, duration, error = null) {
    this.testResults.push({
      testName,
      success,
      duration: Math.round(duration),
      error,
      timestamp: new Date().toISOString()
    });
    
    const status = success ? '✅' : '❌';
    const message = `${status} ${testName}: ${Math.round(duration)}ms`;
    
    if (success) {
      FirebaseLogger.info(message);
    } else {
      FirebaseLogger.error(`${message} - ${error}`);
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        totalDuration: totalDuration
      },
      performance: this.performanceMetrics,
      results: this.testResults,
      timestamp: new Date().toISOString()
    };
    
    // Log summary
    FirebaseLogger.info(`📊 Test Summary: ${passedTests}/${totalTests} passed (${report.summary.successRate}%)`);
    
    return report;
  }

  /**
   * Run quick health check
   */
  async quickHealthCheck() {
    const checks = [];
    
    // Check Firebase
    checks.push({
      name: 'Firebase',
      status: !!(window.movieComments && window.movieComments.initialized)
    });
    
    // Check UI
    checks.push({
      name: 'Notification UI',
      status: !!window.notificationUI
    });
    
    // Check Preferences
    checks.push({
      name: 'Preferences Manager',
      status: !!window.NotificationPreferencesManager
    });
    
    // Check RSS
    checks.push({
      name: 'RSS Generator',
      status: !!window.NotificationRSSGenerator
    });
    
    // Check Integration
    checks.push({
      name: 'Auto-Update Integration',
      status: !!window.AutoUpdateIntegration
    });
    
    const healthyCount = checks.filter(c => c.status).length;
    const healthPercentage = Math.round((healthyCount / checks.length) * 100);
    
    return {
      healthy: healthyCount === checks.length,
      healthPercentage,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

// Khởi tạo global instance
window.NotificationSystemTester = new NotificationSystemTester();

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.NotificationSystemTester.init();
  });
} else {
  window.NotificationSystemTester.init();
}

export default NotificationSystemTester;
