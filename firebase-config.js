// 🔥 Firebase Comment System for GitHub Pages
// Hoàn toàn miễn phí, không cần server backend

// FIREBASE CONFIG - Real configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC9GgPO41b0hmVVn5D-5LdGGSLnBsQWlPc",
  authDomain: "phim-comments.firebaseapp.com",
  projectId: "phim-comments",
  storageBucket: "phim-comments.firebasestorage.app",
  messagingSenderId: "338411994257",
  appId: "1:338411994257:web:870b6a7cd166a50bc75330"
};

// 💡 HƯỚNG DẪN LẤY CONFIG:
// 1. https://console.firebase.google.com → [+ Add project]
// 2. Tên project: "phim-comments" → Disable Analytics → Create
// 3. "Firestore Database" → Create → Test mode → asia-southeast1  
// 4. Project Overview → "</>" Web icon → App name → Copy config

class MovieCommentSystem {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.cache = new Map();
  }

  // Khởi tạo Firebase
  async init() {
    try {
      console.log('🔥 Initializing Movie Comment System...');
      
      // Validate config
      if (!this.validateConfig()) {
        throw new Error('Please update Firebase config in firebase-config.js');
      }

      // Load Firebase SDK
      await this.loadFirebase();
      
      // Initialize Firebase app
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      
      this.db = firebase.firestore();
      
      // Enable offline support
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
        console.log('💾 Offline support enabled');
      } catch (err) {
        console.warn('⚠️ Offline support failed:', err.code);
      }
      
      this.initialized = true;
      console.log('✅ Comment system ready!');
      return true;
    } catch (error) {
      console.error('❌ Init failed:', error);
      return false;
    }
  }

  // Validate Firebase config
  validateConfig() {
    const required = ['apiKey', 'authDomain', 'projectId'];
    return required.every(field => 
      firebaseConfig[field] && 
      !firebaseConfig[field].includes('your-')
    );
  }

  // Load Firebase SDK - Using v8 compat for easier integration
  async loadFirebase() {
    if (window.firebase) return;
    
    const scripts = [
      'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
      'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
    ];

    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          console.log(`✅ Loaded: ${src.split('/').pop()}`);
          resolve();
        };
        script.onerror = () => {
          console.error(`❌ Failed to load: ${src}`);
          reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(script);
      });
    }
  }

  // Lấy user ID persistent
  getUserId() {
    let userId = localStorage.getItem('movie_commenter_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2) + Date.now();
      localStorage.setItem('movie_commenter_id', userId);
    }
    return userId;
  }

  // Lấy tên user
  getUserName() {
    return localStorage.getItem('movie_commenter_name') || 'Khách';
  }

  // Set tên user
  setUserName(name) {
    const sanitized = name.trim().substring(0, 30).replace(/[<>]/g, '');
    localStorage.setItem('movie_commenter_name', sanitized);
    return sanitized;
  }

  // Thêm comment mới
  async addComment(movieSlug, content) {
    if (!this.initialized) await this.init();
    
    const userId = this.getUserId();
    const userName = this.getUserName();
    
    if (!movieSlug || !content || content.trim().length < 3) {
      throw new Error('Vui lòng nhập nội dung bình luận (tối thiểu 3 ký tự)');
    }

         const comment = {
       movieSlug: movieSlug,
       content: content.trim().substring(0, 500),
       authorId: userId,
       authorName: userName,
       timestamp: firebase.firestore.FieldValue.serverTimestamp(),
       likes: 0,
       likedBy: [],
       status: 'approved', // AUTO-APPROVE for testing (change back to 'pending' for production)
       reports: 0
     };

    try {
      const docRef = await this.db.collection('movieComments').add(comment);
      this.cache.delete(movieSlug); // Clear cache
      console.log('✅ Comment added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Add comment failed:', error);
      throw new Error('Không thể gửi bình luận. Vui lòng thử lại.');
    }
  }

  // Lấy comments cho phim
  async getComments(movieSlug, limit = 30) {
    if (!this.initialized) await this.init();
    
    // Check cache
    const cached = this.cache.get(movieSlug);
    if (cached && Date.now() - cached.time < 300000) { // 5 min cache
      return cached.data;
    }

    try {
      const snapshot = await this.db.collection('movieComments')
        .where('movieSlug', '==', movieSlug)
        .where('status', '==', 'approved')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const comments = [];
      snapshot.forEach(doc => {
        comments.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        });
      });

      // Cache results
      this.cache.set(movieSlug, {
        data: comments,
        time: Date.now()
      });

      console.log(`📄 Loaded ${comments.length} comments for ${movieSlug}`);
      return comments;
    } catch (error) {
      console.error('❌ Get comments failed:', error);
      return [];
    }
  }

  // Like/unlike comment
  async toggleLike(commentId) {
    const userId = this.getUserId();
    const commentRef = this.db.collection('movieComments').doc(commentId);

    try {
      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(commentRef);
        if (!doc.exists) return;

        const data = doc.data();
        const likedBy = data.likedBy || [];
        const hasLiked = likedBy.includes(userId);

        if (hasLiked) {
          transaction.update(commentRef, {
            likes: Math.max(0, (data.likes || 0) - 1),
            likedBy: likedBy.filter(id => id !== userId)
          });
        } else {
          transaction.update(commentRef, {
            likes: (data.likes || 0) + 1,
            likedBy: [...likedBy, userId]
          });
        }
      });

      // Clear cache
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('❌ Toggle like failed:', error);
      return false;
    }
  }

  // Report comment
  async reportComment(commentId, reason = 'inappropriate') {
    const userId = this.getUserId();
    const commentRef = this.db.collection('movieComments').doc(commentId);

    try {
      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(commentRef);
        if (!doc.exists) return;

        const data = doc.data();
        const reportedBy = data.reportedBy || [];
        
        if (!reportedBy.includes(userId)) {
          transaction.update(commentRef, {
            reports: (data.reports || 0) + 1,
            reportedBy: [...reportedBy, userId],
            lastReportReason: reason
          });
        }
      });

      console.log('🚨 Comment reported');
      return true;
    } catch (error) {
      console.error('❌ Report failed:', error);
      return false;
    }
  }

  // Render comment UI
  renderCommentSection(container, movieSlug) {
    if (!container || !movieSlug) return;

    const section = document.createElement('div');
    section.className = 'movie-comments-section';
    section.innerHTML = `
      <div class="comments-header">
        <h3>💬 Bình luận về phim</h3>
        <div class="comments-count">Đang tải...</div>
      </div>
      
      <div class="comment-form">
        <div class="form-row">
          <input type="text" id="commenter-name" placeholder="Tên của bạn" 
                 value="${this.getUserName()}" maxlength="30">
        </div>
        <div class="form-row">
          <textarea id="comment-content" placeholder="Chia sẻ cảm nghĩ của bạn về bộ phim này..." 
                    maxlength="500" rows="3"></textarea>
        </div>
        <div class="form-row">
          <span class="char-count">0/500</span>
          <button id="submit-comment" class="submit-btn">Gửi bình luận</button>
        </div>
      </div>

      <div class="comments-list">
        <div class="loading">Đang tải bình luận...</div>
      </div>
    `;

    container.appendChild(section);
    
    // Bind events
    this.bindEvents(movieSlug);
    
    // Load comments
    this.loadAndDisplayComments(movieSlug);
  }

  // Bind form events
  bindEvents(movieSlug) {
    const nameInput = document.getElementById('commenter-name');
    const contentTextarea = document.getElementById('comment-content');
    const submitBtn = document.getElementById('submit-comment');
    const charCount = document.querySelector('.char-count');

    // Character count
    contentTextarea?.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCount.textContent = `${length}/500`;
      charCount.style.color = length > 450 ? '#ff5722' : '#666';
    });

    // Save name
    nameInput?.addEventListener('blur', (e) => {
      const name = e.target.value.trim();
      if (name) this.setUserName(name);
    });

    // Submit comment
    submitBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.handleSubmit(movieSlug);
    });

    // Submit on Enter
    contentTextarea?.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.handleSubmit(movieSlug);
      }
    });
  }

  // Handle comment submission
  async handleSubmit(movieSlug) {
    const nameInput = document.getElementById('commenter-name');
    const contentTextarea = document.getElementById('comment-content');
    const submitBtn = document.getElementById('submit-comment');

    const name = nameInput?.value.trim();
    const content = contentTextarea?.value.trim();

    if (!name) {
      alert('Vui lòng nhập tên của bạn');
      nameInput?.focus();
      return;
    }

    if (!content || content.length < 3) {
      alert('Vui lòng nhập bình luận (tối thiểu 3 ký tự)');
      contentTextarea?.focus();
      return;
    }

    this.setUserName(name);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    try {
      await this.addComment(movieSlug, content);
      
      // Reset form
      contentTextarea.value = '';
      document.querySelector('.char-count').textContent = '0/500';
      
      this.showNotification('✅ Bình luận đã được gửi! Đang chờ admin duyệt.');
      
      // Reload comments after 2 seconds
      setTimeout(() => this.loadAndDisplayComments(movieSlug), 2000);
    } catch (error) {
      this.showNotification('❌ ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi bình luận';
    }
  }

  // Load and display comments
  async loadAndDisplayComments(movieSlug) {
    const commentsList = document.querySelector('.comments-list');
    const commentsCount = document.querySelector('.comments-count');
    
    if (!commentsList) return;

    try {
      const comments = await this.getComments(movieSlug);
      
      commentsCount.textContent = `${comments.length} bình luận`;
      
      if (comments.length === 0) {
        commentsList.innerHTML = `
          <div class="no-comments">
            <p>Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!</p>
          </div>
        `;
        return;
      }

      const commentsHtml = comments.map(comment => this.renderComment(comment)).join('');
      commentsList.innerHTML = commentsHtml;
      
      this.bindCommentActions();
    } catch (error) {
      commentsList.innerHTML = `
        <div class="error">
          <p>Không thể tải bình luận. <button onclick="movieComments.loadAndDisplayComments('${movieSlug}')">Thử lại</button></p>
        </div>
      `;
    }
  }

  // Render single comment
  renderComment(comment) {
    const timeAgo = this.getTimeAgo(comment.timestamp);
    const isLiked = comment.likedBy?.includes(this.getUserId());
    
    return `
      <div class="comment" data-comment-id="${comment.id}">
        <div class="comment-avatar">${comment.authorName.charAt(0).toUpperCase()}</div>
        <div class="comment-content">
          <div class="comment-header">
            <strong class="comment-author">${this.escapeHtml(comment.authorName)}</strong>
            <span class="comment-time">${timeAgo}</span>
          </div>
          <div class="comment-text">${this.escapeHtml(comment.content)}</div>
          <div class="comment-actions">
            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-action="like">
              👍 <span>${comment.likes || 0}</span>
            </button>
            <button class="action-btn report-btn" data-action="report">
              🚨 Báo cáo
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Bind comment actions
  bindCommentActions() {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const commentId = btn.closest('.comment').dataset.commentId;
        
        if (action === 'like') {
          await this.handleLike(commentId, btn);
        } else if (action === 'report') {
          await this.handleReport(commentId);
        }
      });
    });
  }

  // Handle like action
  async handleLike(commentId, btn) {
    btn.disabled = true;
    
    const success = await this.toggleLike(commentId);
    if (success) {
      const likeCountSpan = btn.querySelector('span');
      const currentCount = parseInt(likeCountSpan.textContent) || 0;
      const isLiked = btn.classList.contains('liked');
      
      if (isLiked) {
        likeCountSpan.textContent = Math.max(0, currentCount - 1);
        btn.classList.remove('liked');
      } else {
        likeCountSpan.textContent = currentCount + 1;
        btn.classList.add('liked');
      }
    }
    
    btn.disabled = false;
  }

  // Handle report action
  async handleReport(commentId) {
    const reason = prompt('Lý do báo cáo (tùy chọn):') || 'inappropriate';
    
    const success = await this.reportComment(commentId, reason);
    if (success) {
      this.showNotification('✅ Đã gửi báo cáo. Cảm ơn bạn!');
    }
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getTimeAgo(date) {
    if (!date) return 'Vừa xong';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  }

  showNotification(message) {
    // Simple notification - có thể customize
    const notification = document.createElement('div');
    notification.className = 'comment-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: #4caf50; color: white; padding: 12px 20px;
      border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-size: 14px; max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}

// Global instance
window.movieComments = new MovieCommentSystem();

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.movieComments.init();
  });
} else {
  window.movieComments.init();
}

console.log('🎬 Movie Comment System loaded! Use movieComments.renderCommentSection(container, movieSlug)'); 