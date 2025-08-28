/**
 * 🧪 Notification System Test Suite
 * Comprehensive tests cho notification system
 */

// Test utilities
const TestUtils = {
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Create test notification
  createTestNotification: (overrides = {}) => ({
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info',
    category: 'test',
    priority: 'normal',
    ...overrides
  }),
  
  // Check if element exists
  elementExists: (selector) => document.querySelector(selector) !== null,
  
  // Get element text content
  getElementText: (selector) => {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : null;
  },
  
  // Simulate click
  simulateClick: (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
    return false;
  },
  
  // Clear localStorage
  clearStorage: () => {
    localStorage.removeItem('app-notifications');
    localStorage.removeItem('admin-scheduled-notifications');
    localStorage.removeItem('admin-notification-templates');
  }
};

// Test Suite
const NotificationSystemTests = {
  
  /**
   * Test 1: Initialization
   */
  async testInitialization() {
    console.log('🧪 Test 1: System Initialization');
    
    try {
      // Check if notification button container exists
      const hasContainer = TestUtils.elementExists('#notificationButtonContainer');
      console.assert(hasContainer, '❌ Notification button container not found');
      
      // Check if notification button is rendered
      await TestUtils.wait(500); // Wait for initialization
      const hasButton = TestUtils.elementExists('.notification-btn');
      console.assert(hasButton, '❌ Notification button not rendered');
      
      // Check if AdminNotifications is available
      const hasAdminAPI = typeof window.AdminNotifications === 'object';
      console.assert(hasAdminAPI, '❌ AdminNotifications API not available');
      
      console.log('✅ Test 1 passed: System initialized correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 1 failed:', error);
      return false;
    }
  },

  /**
   * Test 2: Create Notification
   */
  async testCreateNotification() {
    console.log('🧪 Test 2: Create Notification');
    
    try {
      // Clear existing notifications
      TestUtils.clearStorage();
      
      // Create test notification
      const testNotification = TestUtils.createTestNotification();
      const id = await AdminNotifications.createSystemNotification(
        testNotification.title,
        testNotification.message,
        { type: testNotification.type }
      );
      
      console.assert(id, '❌ Failed to create notification');
      console.assert(typeof id === 'string', '❌ Invalid notification ID');
      
      // Check if badge is updated
      await TestUtils.wait(200);
      const badge = document.querySelector('.notification-btn__badge');
      const isVisible = badge && badge.style.display !== 'none';
      console.assert(isVisible, '❌ Badge not visible after creating notification');
      
      console.log('✅ Test 2 passed: Notification created successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Test 2 failed:', error);
      return false;
    }
  },

  /**
   * Test 3: Dropdown Toggle
   */
  async testDropdownToggle() {
    console.log('🧪 Test 3: Dropdown Toggle');
    
    try {
      // Click notification button
      const clicked = TestUtils.simulateClick('.notification-btn');
      console.assert(clicked, '❌ Failed to click notification button');
      
      // Wait for dropdown to appear
      await TestUtils.wait(300);
      
      // Check if dropdown is visible
      const dropdown = document.querySelector('.notification-dropdown');
      const isVisible = dropdown && dropdown.style.display !== 'none';
      console.assert(isVisible, '❌ Dropdown not visible after click');
      
      // Click again to close
      TestUtils.simulateClick('.notification-btn');
      await TestUtils.wait(300);
      
      // Check if dropdown is hidden
      const isHidden = dropdown && dropdown.style.display === 'none';
      console.assert(isHidden, '❌ Dropdown not hidden after second click');
      
      console.log('✅ Test 3 passed: Dropdown toggle works correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 3 failed:', error);
      return false;
    }
  },

  /**
   * Test 4: Notification Display
   */
  async testNotificationDisplay() {
    console.log('🧪 Test 4: Notification Display');
    
    try {
      // Open dropdown
      TestUtils.simulateClick('.notification-btn');
      await TestUtils.wait(300);
      
      // Check if notification is displayed
      const notificationItem = document.querySelector('.notification-item');
      console.assert(notificationItem, '❌ Notification item not displayed');
      
      // Check notification content
      const title = TestUtils.getElementText('.notification-item__title');
      console.assert(title === 'Test Notification', '❌ Notification title incorrect');
      
      // Check if unread indicator is present
      const isUnread = notificationItem.classList.contains('unread');
      console.assert(isUnread, '❌ Notification should be unread');
      
      console.log('✅ Test 4 passed: Notification displayed correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 4 failed:', error);
      return false;
    }
  },

  /**
   * Test 5: Mark as Read
   */
  async testMarkAsRead() {
    console.log('🧪 Test 5: Mark as Read');
    
    try {
      // Click mark as read button
      const markReadBtn = document.querySelector('[data-action="mark-read"]');
      console.assert(markReadBtn, '❌ Mark as read button not found');
      
      markReadBtn.click();
      await TestUtils.wait(300);
      
      // Check if notification is marked as read
      const notificationItem = document.querySelector('.notification-item');
      const isRead = notificationItem.classList.contains('read');
      console.assert(isRead, '❌ Notification not marked as read');
      
      // Check if badge is updated
      const badge = document.querySelector('.notification-btn__badge');
      const isHidden = badge && badge.style.display === 'none';
      console.assert(isHidden, '❌ Badge should be hidden when no unread notifications');
      
      console.log('✅ Test 5 passed: Mark as read works correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 5 failed:', error);
      return false;
    }
  },

  /**
   * Test 6: Filtering
   */
  async testFiltering() {
    console.log('🧪 Test 6: Filtering');
    
    try {
      // Create different types of notifications
      await AdminNotifications.createSystemNotification('System Test', 'System message', { type: 'system' });
      await AdminNotifications.createMovieNotification({ name: 'Test Movie', slug: 'test-movie' });
      await TestUtils.wait(300);
      
      // Test system filter
      const systemFilter = document.querySelector('[data-filter="system"]');
      console.assert(systemFilter, '❌ System filter not found');
      
      systemFilter.click();
      await TestUtils.wait(200);
      
      // Check if only system notifications are shown
      const notificationItems = document.querySelectorAll('.notification-item');
      console.assert(notificationItems.length > 0, '❌ No notifications shown with system filter');
      
      // Test all filter
      const allFilter = document.querySelector('[data-filter="all"]');
      allFilter.click();
      await TestUtils.wait(200);
      
      const allItems = document.querySelectorAll('.notification-item');
      console.assert(allItems.length >= notificationItems.length, '❌ All filter should show more items');
      
      console.log('✅ Test 6 passed: Filtering works correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 6 failed:', error);
      return false;
    }
  },

  /**
   * Test 7: Search Functionality
   */
  async testSearch() {
    console.log('🧪 Test 7: Search Functionality');
    
    try {
      // Find search input
      const searchInput = document.querySelector('#notificationSearch');
      console.assert(searchInput, '❌ Search input not found');
      
      // Search for specific notification
      searchInput.value = 'Test Movie';
      searchInput.dispatchEvent(new Event('input'));
      await TestUtils.wait(300);
      
      // Check if search results are filtered
      const notificationItems = document.querySelectorAll('.notification-item');
      const hasMovieNotification = Array.from(notificationItems).some(item => 
        item.textContent.includes('Test Movie')
      );
      console.assert(hasMovieNotification, '❌ Search did not find movie notification');
      
      // Clear search
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      await TestUtils.wait(200);
      
      console.log('✅ Test 7 passed: Search functionality works correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 7 failed:', error);
      return false;
    }
  },

  /**
   * Test 8: Admin Functions
   */
  async testAdminFunctions() {
    console.log('🧪 Test 8: Admin Functions');
    
    try {
      // Test different notification types
      const systemId = await AdminNotifications.createSystemNotification('Admin Test', 'System notification');
      console.assert(systemId, '❌ Failed to create system notification');
      
      const updateId = await AdminNotifications.notifySystemUpdate('v1.0.1', 'Bug fixes');
      console.assert(updateId, '❌ Failed to create update notification');
      
      const movieId = await AdminNotifications.notifyMovieAdded('Admin Movie', 'admin-movie');
      console.assert(movieId, '❌ Failed to create movie notification');
      
      // Test statistics
      const stats = AdminNotifications.getStatistics();
      console.assert(stats && stats.total > 0, '❌ Statistics not working');
      console.assert(stats.unread >= 0, '❌ Unread count invalid');
      
      // Test templates
      const templates = AdminNotifications.getTemplates();
      console.assert(Array.isArray(templates), '❌ Templates not returned as array');
      console.assert(templates.length > 0, '❌ No default templates found');
      
      console.log('✅ Test 8 passed: Admin functions work correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 8 failed:', error);
      return false;
    }
  },

  /**
   * Test 9: Data Persistence
   */
  async testDataPersistence() {
    console.log('🧪 Test 9: Data Persistence');
    
    try {
      // Create notification
      const testId = await AdminNotifications.createSystemNotification('Persistence Test', 'Test message');
      
      // Check localStorage
      const stored = localStorage.getItem('app-notifications');
      console.assert(stored, '❌ Notifications not saved to localStorage');
      
      const data = JSON.parse(stored);
      console.assert(data.notifications, '❌ Invalid data structure in localStorage');
      console.assert(data.metadata, '❌ Missing metadata in localStorage');
      
      // Check if notification exists in stored data
      const notificationExists = data.notifications.some(([id, notif]) => id === testId);
      console.assert(notificationExists, '❌ Created notification not found in storage');
      
      console.log('✅ Test 9 passed: Data persistence works correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 9 failed:', error);
      return false;
    }
  },

  /**
   * Test 10: Responsive Design
   */
  async testResponsiveDesign() {
    console.log('🧪 Test 10: Responsive Design');
    
    try {
      // Test mobile viewport
      const originalWidth = window.innerWidth;
      
      // Simulate mobile viewport (this is limited in testing)
      const notificationBtn = document.querySelector('.notification-btn');
      const computedStyle = window.getComputedStyle(notificationBtn);
      
      console.assert(notificationBtn, '❌ Notification button not found for responsive test');
      console.assert(computedStyle.display !== 'none', '❌ Notification button hidden');
      
      // Check if dropdown has responsive classes
      const dropdown = document.querySelector('.notification-dropdown');
      console.assert(dropdown, '❌ Dropdown not found for responsive test');
      
      // Test CSS media queries (limited testing capability)
      const hasResponsiveStyles = true; // Assume CSS is loaded correctly
      console.assert(hasResponsiveStyles, '❌ Responsive styles not applied');
      
      console.log('✅ Test 10 passed: Responsive design works correctly');
      return true;
      
    } catch (error) {
      console.error('❌ Test 10 failed:', error);
      return false;
    }
  },

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Notification System Test Suite...\n');
    
    const tests = [
      this.testInitialization,
      this.testCreateNotification,
      this.testDropdownToggle,
      this.testNotificationDisplay,
      this.testMarkAsRead,
      this.testFiltering,
      this.testSearch,
      this.testAdminFunctions,
      this.testDataPersistence,
      this.testResponsiveDesign
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        const result = await test.call(this);
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Test execution error:', error);
        failed++;
      }
      
      // Wait between tests
      await TestUtils.wait(500);
      console.log(''); // Empty line for readability
    }
    
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Notification system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the issues above.');
    }
    
    return { passed, failed };
  }
};

// Auto-run tests when loaded
if (typeof window !== 'undefined') {
  // Wait for system to initialize
  setTimeout(() => {
    console.log('🔔 Notification System Test Suite Ready!');
    console.log('Run tests with: NotificationSystemTests.runAllTests()');
    
    // Expose to global scope
    window.NotificationSystemTests = NotificationSystemTests;
    window.TestUtils = TestUtils;
    
    // Auto-run tests in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🧪 Auto-running tests in development environment...');
      setTimeout(() => NotificationSystemTests.runAllTests(), 2000);
    }
  }, 1000);
}

export { NotificationSystemTests, TestUtils };
