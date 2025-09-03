/**
 * 📡 Notification RSS Feed Generator
 * Tạo RSS feed cho thông báo phim mới và tập mới
 * 
 * Features:
 * - Generate RSS XML từ notifications
 * - Hỗ trợ RSS 2.0 standard
 * - Auto-update RSS feed
 * - Lọc theo preferences của user
 * - Cache RSS content
 */

import { FirebaseLogger } from '../firebase-config.js';

export class NotificationRSSGenerator {
  constructor() {
    this.rssCache = null;
    this.lastUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 phút
    this.maxItems = 50; // Tối đa 50 items trong RSS
  }

  /**
   * Khởi tạo RSS generator
   */
  async init() {
    try {
      // Đảm bảo Firebase đã sẵn sàng
      if (!window.movieComments || !window.movieComments.initialized) {
        await window.movieComments?.init();
      }

      // Tạo RSS endpoint
      this.setupRSSEndpoint();
      
      FirebaseLogger.info('📡 RSS Generator initialized');
      return true;

    } catch (error) {
      FirebaseLogger.error('❌ Failed to initialize RSS Generator:', error);
      return false;
    }
  }

  /**
   * Setup RSS endpoint
   */
  setupRSSEndpoint() {
    // Thêm link RSS vào head
    this.addRSSLink();
    
    // Expose RSS generator globally
    window.generateRSSFeed = this.generateRSSFeed.bind(this);
    window.getRSSContent = this.getRSSContent.bind(this);
  }

  /**
   * Thêm RSS link vào HTML head
   */
  addRSSLink() {
    // Kiểm tra xem đã có RSS link chưa
    if (document.querySelector('link[type="application/rss+xml"]')) return;

    const link = document.createElement('link');
    link.rel = 'alternate';
    link.type = 'application/rss+xml';
    link.title = 'Thông báo phim mới - Web Xem Anime';
    link.href = window.location.origin + '/rss.xml';
    
    document.head.appendChild(link);
  }

  /**
   * Lấy RSS content (cached hoặc generate mới)
   */
  async getRSSContent() {
    try {
      // Kiểm tra cache
      if (this.rssCache && this.lastUpdate) {
        const now = Date.now();
        if (now - this.lastUpdate < this.cacheTimeout) {
          FirebaseLogger.debug('📡 Returning cached RSS content');
          return this.rssCache;
        }
      }

      // Generate RSS mới
      const rssContent = await this.generateRSSFeed();
      
      // Cache content
      this.rssCache = rssContent;
      this.lastUpdate = Date.now();
      
      return rssContent;

    } catch (error) {
      FirebaseLogger.error('❌ Failed to get RSS content:', error);
      return this.getErrorRSS();
    }
  }

  /**
   * Generate RSS feed từ notifications
   */
  async generateRSSFeed() {
    try {
      // Lấy notifications từ Firebase
      const notifications = await this.getNotificationsForRSS();
      
      // Generate RSS XML
      const rssXML = this.buildRSSXML(notifications);
      
      FirebaseLogger.info(`📡 Generated RSS feed with ${notifications.length} items`);
      return rssXML;

    } catch (error) {
      FirebaseLogger.error('❌ Failed to generate RSS feed:', error);
      return this.getErrorRSS();
    }
  }

  /**
   * Lấy notifications cho RSS
   */
  async getNotificationsForRSS() {
    try {
      if (!window.movieComments?.getNotifications) {
        return [];
      }

      // Lấy notifications active, sắp xếp theo thời gian
      const notifications = await window.movieComments.getNotifications({
        status: 'active',
        limit: this.maxItems,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });

      // Lọc chỉ lấy notifications về phim/tập mới
      const filteredNotifications = notifications.filter(notification => 
        notification.type === 'new_movie' || 
        notification.type === 'new_episode' ||
        notification.type === 'admin_announcement'
      );

      return filteredNotifications;

    } catch (error) {
      FirebaseLogger.error('❌ Failed to get notifications for RSS:', error);
      return [];
    }
  }

  /**
   * Build RSS XML từ notifications
   */
  buildRSSXML(notifications) {
    const siteUrl = window.location.origin;
    const now = new Date().toUTCString();
    
    const rssItems = notifications.map(notification => this.buildRSSItem(notification)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Thông báo phim mới - Web Xem Anime</title>
    <link>${siteUrl}</link>
    <description>Cập nhật thông báo về phim mới và tập mới trên Web Xem Anime</description>
    <language>vi-VN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Web Xem Anime RSS Generator</generator>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    
    ${rssItems}
  </channel>
</rss>`;
  }

  /**
   * Build RSS item từ notification
   */
  buildRSSItem(notification) {
    const siteUrl = window.location.origin;
    const pubDate = notification.createdAt ? 
      new Date(notification.createdAt).toUTCString() : 
      new Date().toUTCString();
    
    // Tạo link dựa trên loại notification
    let link = siteUrl;
    let category = 'Thông báo';
    
    if (notification.type === 'new_movie' && notification.metadata?.movieSlug) {
      link = `${siteUrl}/#/phim/${notification.metadata.movieSlug}`;
      category = 'Phim mới';
    } else if (notification.type === 'new_episode' && notification.metadata?.movieSlug) {
      link = `${siteUrl}/#/xem/${notification.metadata.movieSlug}`;
      category = 'Tập mới';
    } else if (notification.type === 'admin_announcement') {
      category = 'Thông báo Admin';
    }

    // Escape XML characters
    const title = this.escapeXML(notification.title || 'Thông báo');
    const description = this.escapeXML(notification.content || '');
    const guid = `notification-${notification.id}`;

    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description><![CDATA[${description}]]></description>
      <category>${category}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
    </item>`;
  }

  /**
   * Escape XML characters
   */
  escapeXML(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generate error RSS khi có lỗi
   */
  getErrorRSS() {
    const siteUrl = window.location.origin;
    const now = new Date().toUTCString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Thông báo phim mới - Web Xem Anime</title>
    <link>${siteUrl}</link>
    <description>Cập nhật thông báo về phim mới và tập mới trên Web Xem Anime</description>
    <language>vi-VN</language>
    <lastBuildDate>${now}</lastBuildDate>
    
    <item>
      <title>Lỗi tải thông báo</title>
      <link>${siteUrl}</link>
      <description>Không thể tải thông báo. Vui lòng thử lại sau.</description>
      <pubDate>${now}</pubDate>
      <guid isPermaLink="false">error-${Date.now()}</guid>
    </item>
  </channel>
</rss>`;
  }

  /**
   * Tạo RSS feed cho user cụ thể (theo preferences)
   */
  async generatePersonalizedRSS(userId) {
    try {
      // Load user preferences
      let userPreferences = null;
      if (window.NotificationPreferencesManager) {
        await window.NotificationPreferencesManager.init();
        userPreferences = window.NotificationPreferencesManager.getPreferences();
      }

      // Lấy notifications
      const allNotifications = await this.getNotificationsForRSS();
      
      // Lọc theo preferences nếu có
      let filteredNotifications = allNotifications;
      if (userPreferences && window.NotificationPreferencesManager) {
        filteredNotifications = allNotifications.filter(notification => {
          if (notification.type === 'new_movie' && notification.metadata?.movieData) {
            return window.NotificationPreferencesManager.isInterestedInMovie(notification.metadata.movieData);
          }
          if (notification.type === 'new_episode' && notification.metadata?.movieData) {
            return window.NotificationPreferencesManager.isInterestedInEpisode(notification.metadata.movieData);
          }
          return true; // Luôn hiển thị admin announcements
        });
      }

      return this.buildRSSXML(filteredNotifications);

    } catch (error) {
      FirebaseLogger.error('❌ Failed to generate personalized RSS:', error);
      return this.getErrorRSS();
    }
  }

  /**
   * Tạo RSS feed URL cho user
   */
  getRSSURL(personalized = false) {
    const baseUrl = window.location.origin;
    
    if (personalized && window.NotificationPreferencesManager) {
      const userId = window.NotificationPreferencesManager.userId;
      return `${baseUrl}/rss-${userId}.xml`;
    }
    
    return `${baseUrl}/rss.xml`;
  }

  /**
   * Thêm RSS subscription button vào UI
   */
  addRSSSubscriptionButton() {
    // Tìm notification actions container
    const actionsContainer = document.querySelector('.notification-actions');
    if (!actionsContainer) return;

    // Kiểm tra xem đã có button chưa
    if (document.querySelector('.rss-button')) return;

    const button = document.createElement('button');
    button.className = 'preferences-button rss-button';
    button.innerHTML = '📡 RSS';
    button.title = 'Đăng ký RSS feed';
    button.onclick = () => this.showRSSModal();

    actionsContainer.appendChild(button);
  }

  /**
   * Hiển thị modal RSS subscription
   */
  showRSSModal() {
    const rssUrl = this.getRSSURL();
    const personalizedUrl = this.getRSSURL(true);

    const modal = document.createElement('div');
    modal.className = 'preferences-modal open';
    modal.innerHTML = `
      <div class="preferences-content" style="max-width: 500px;">
        <div class="preferences-header">
          <h2>📡 RSS Feed</h2>
          <button class="preferences-close" onclick="this.closest('.preferences-modal').remove()">✕</button>
        </div>
        
        <div class="preferences-body">
          <div class="preference-section">
            <h3>🌐 RSS Feed chung</h3>
            <p style="color: #ccc; font-size: 14px; margin-bottom: 10px;">
              Tất cả thông báo phim mới và tập mới
            </p>
            <div style="background: #2a2a2a; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <code style="color: #6c5ce7; word-break: break-all;">${rssUrl}</code>
            </div>
            <button class="btn-action" onclick="navigator.clipboard.writeText('${rssUrl}'); this.textContent='✅ Đã copy'">
              📋 Copy URL
            </button>
          </div>
          
          <div class="preference-section">
            <h3>👤 RSS Feed cá nhân</h3>
            <p style="color: #ccc; font-size: 14px; margin-bottom: 10px;">
              Chỉ thông báo theo sở thích của bạn
            </p>
            <div style="background: #2a2a2a; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <code style="color: #6c5ce7; word-break: break-all;">${personalizedUrl}</code>
            </div>
            <button class="btn-action" onclick="navigator.clipboard.writeText('${personalizedUrl}'); this.textContent='✅ Đã copy'">
              📋 Copy URL
            </button>
          </div>
          
          <div class="preference-section">
            <h3>📱 Cách sử dụng</h3>
            <ul style="color: #ccc; font-size: 13px; margin: 0; padding-left: 20px;">
              <li>Copy URL RSS feed</li>
              <li>Mở RSS reader (Feedly, Inoreader, ...)</li>
              <li>Thêm feed mới với URL đã copy</li>
              <li>Nhận thông báo tự động!</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Auto remove after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.rssCache = null;
    this.lastUpdate = null;
    FirebaseLogger.info('🗑️ RSS cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      isCached: !!this.rssCache,
      lastUpdate: this.lastUpdate,
      cacheAge: this.lastUpdate ? Date.now() - this.lastUpdate : 0,
      cacheTimeout: this.cacheTimeout
    };
  }
}

// Khởi tạo global instance
window.NotificationRSSGenerator = new NotificationRSSGenerator();

// Auto-init khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.NotificationRSSGenerator.init();
  });
} else {
  window.NotificationRSSGenerator.init();
}

export default NotificationRSSGenerator;
