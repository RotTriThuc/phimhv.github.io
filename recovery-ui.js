// 🎨 Recovery UI System - User Interface for Data Recovery
// Giao diện thân thiện để hỗ trợ người dùng khôi phục dữ liệu

class RecoveryUI {
  constructor() {
    this.modalId = 'recovery-modal';
    this.isShowing = false;
    this.recoveryMethods = [
      {
        id: 'auto',
        title: '🤖 Tự động khôi phục',
        description: 'Hệ thống sẽ tự động tìm và khôi phục dữ liệu của bạn',
        action: 'attemptAutoRecovery'
      },
      {
        id: 'sync',
        title: '📱 Nhập mã sync',
        description: 'Sử dụng mã sync từ thiết bị khác để khôi phục dữ liệu',
        action: 'showSyncCodeInput'
      },
      {
        id: 'manual',
        title: '🔍 Tìm kiếm thủ công',
        description: 'Tìm kiếm dữ liệu bằng thông tin cá nhân',
        action: 'showManualSearch'
      },
      {
        id: 'fresh',
        title: '🆕 Bắt đầu mới',
        description: 'Tạo tài khoản mới và bắt đầu lại từ đầu',
        action: 'startFresh'
      }
    ];
  }

  // 🎨 Show Main Recovery Modal
  showManualRecoveryModal() {
    if (this.isShowing) return;
    
    this.isShowing = true;
    
    const modal = this._createModal();
    document.body.appendChild(modal);
    
    // Add event listeners
    this._bindEvents();
    
    // Show with animation
    requestAnimationFrame(() => {
      modal.classList.add('recovery-modal--visible');
    });
    
    console.log('🎨 Recovery modal displayed');
  }

  _createModal() {
    const modal = document.createElement('div');
    modal.id = this.modalId;
    modal.className = 'recovery-modal';
    
    modal.innerHTML = `
      <div class="recovery-modal__backdrop"></div>
      <div class="recovery-modal__container">
        <div class="recovery-modal__header">
          <h2>🔄 Khôi Phục Dữ Liệu</h2>
          <p>Chúng tôi phát hiện bạn có thể đã mất dữ liệu phim đã lưu. Hãy chọn phương pháp khôi phục:</p>
          <button class="recovery-modal__close" aria-label="Đóng">×</button>
        </div>
        
        <div class="recovery-modal__content">
          <div class="recovery-methods">
            ${this.recoveryMethods.map(method => this._createMethodCard(method)).join('')}
          </div>
          
          <div class="recovery-status" id="recovery-status" style="display: none;">
            <div class="recovery-status__content"></div>
          </div>
          
          <div class="recovery-forms" id="recovery-forms" style="display: none;">
            <!-- Dynamic forms will be inserted here -->
          </div>
        </div>
        
        <div class="recovery-modal__footer">
          <div class="recovery-help">
            <p>💡 <strong>Mẹo:</strong> Để tránh mất dữ liệu trong tương lai, hãy tạo mã sync định kỳ</p>
          </div>
        </div>
      </div>
    `;
    
    // Add CSS styles
    this._injectStyles();
    
    return modal;
  }

  _createMethodCard(method) {
    return `
      <div class="recovery-method" data-method="${method.id}">
        <div class="recovery-method__icon">${method.title.split(' ')[0]}</div>
        <div class="recovery-method__content">
          <h3>${method.title.substring(2)}</h3>
          <p>${method.description}</p>
        </div>
        <button class="recovery-method__button" data-action="${method.action}">
          Chọn
        </button>
      </div>
    `;
  }

  _bindEvents() {
    const modal = document.getElementById(this.modalId);
    
    // Close modal
    modal.querySelector('.recovery-modal__close').addEventListener('click', () => {
      this.hideModal();
    });
    
    modal.querySelector('.recovery-modal__backdrop').addEventListener('click', () => {
      this.hideModal();
    });
    
    // Method buttons
    modal.querySelectorAll('.recovery-method__button').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this[action]();
      });
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isShowing) {
        this.hideModal();
      }
    });
  }

  // 🤖 Auto Recovery
  async attemptAutoRecovery() {
    this._showStatus('⏳ Đang thực hiện khôi phục tự động...', 'loading');
    
    try {
      if (!window.autoRecovery) {
        throw new Error('Auto-recovery system không khả dụng');
      }
      
      const result = await window.autoRecovery.startAutoRecovery();
      
      if (result.userIdRecovered || result.dataRecovered) {
        this._showStatus(
          `✅ Khôi phục thành công! Tìm thấy ${result.moviesFound} phim đã lưu.`,
          'success'
        );
        
        setTimeout(() => {
          this.hideModal();
          window.location.reload(); // Refresh to show recovered data
        }, 2000);
        
      } else {
        this._showStatus(
          '❌ Khôi phục tự động thất bại. Hãy thử phương pháp khác.',
          'error'
        );
      }
      
    } catch (error) {
      this._showStatus(`❌ Lỗi: ${error.message}`, 'error');
    }
  }

  // 📱 Sync Code Input
  showSyncCodeInput() {
    const form = `
      <div class="recovery-form">
        <h3>📱 Nhập Mã Sync</h3>
        <p>Nhập mã sync 6 số từ thiết bị khác:</p>
        
        <div class="sync-code-input">
          <input type="text" 
                 id="sync-code-field" 
                 placeholder="123456" 
                 maxlength="6" 
                 pattern="[0-9]{6}"
                 autocomplete="off">
          <button id="sync-submit-btn" class="btn btn--primary">
            Đồng bộ
          </button>
        </div>
        
        <div class="sync-help">
          <p>💡 Không có mã sync? <button class="link-btn" onclick="window.recoveryUI.showSyncCodeGeneration()">Tạo mã sync mới</button></p>
        </div>
      </div>
    `;
    
    this._showForm(form);
    
    // Bind sync form events
    document.getElementById('sync-submit-btn').addEventListener('click', () => {
      this.submitSyncCode();
    });
    
    document.getElementById('sync-code-field').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.submitSyncCode();
      }
    });
    
    // Focus input
    document.getElementById('sync-code-field').focus();
  }

  async submitSyncCode() {
    const syncCode = document.getElementById('sync-code-field').value.trim();
    
    if (!syncCode || syncCode.length !== 6) {
      this._showStatus('❌ Vui lòng nhập mã sync 6 số', 'error');
      return;
    }
    
    this._showStatus('⏳ Đang đồng bộ dữ liệu...', 'loading');
    
    try {
      if (!window.movieComments?.useSyncCode) {
        throw new Error('Sync system không khả dụng');
      }
      
      const result = await window.movieComments.useSyncCode(syncCode);
      
      if (result) {
        this._showStatus(
          `✅ Đồng bộ thành công với user: ${result.userName}`,
          'success'
        );
        
        setTimeout(() => {
          this.hideModal();
          window.location.reload();
        }, 2000);
        
      } else {
        this._showStatus('❌ Mã sync không hợp lệ hoặc đã hết hạn', 'error');
      }
      
    } catch (error) {
      this._showStatus(`❌ Lỗi đồng bộ: ${error.message}`, 'error');
    }
  }

  // 🔍 Manual Search
  showManualSearch() {
    const form = `
      <div class="recovery-form">
        <h3>🔍 Tìm Kiếm Thủ Công</h3>
        <p>Nhập thông tin để tìm kiếm dữ liệu của bạn:</p>
        
        <div class="manual-search-form">
          <div class="form-group">
            <label for="search-username">Tên người dùng:</label>
            <input type="text" id="search-username" placeholder="Tên bạn đã sử dụng">
          </div>
          
          <div class="form-group">
            <label for="search-movie">Tên phim đã lưu:</label>
            <input type="text" id="search-movie" placeholder="Tên một bộ phim bạn đã lưu">
          </div>
          
          <button id="manual-search-btn" class="btn btn--primary">
            Tìm kiếm
          </button>
        </div>
        
        <div id="search-results" class="search-results" style="display: none;">
          <!-- Search results will appear here -->
        </div>
      </div>
    `;
    
    this._showForm(form);
    
    document.getElementById('manual-search-btn').addEventListener('click', () => {
      this.performManualSearch();
    });
  }

  async performManualSearch() {
    const username = document.getElementById('search-username').value.trim();
    const movieName = document.getElementById('search-movie').value.trim();
    
    if (!username && !movieName) {
      this._showStatus('❌ Vui lòng nhập ít nhất một thông tin tìm kiếm', 'error');
      return;
    }
    
    this._showStatus('⏳ Đang tìm kiếm...', 'loading');
    
    try {
      const results = await this._searchUserData(username, movieName);
      
      if (results.length > 0) {
        this._showSearchResults(results);
      } else {
        this._showStatus('❌ Không tìm thấy dữ liệu phù hợp', 'error');
      }
      
    } catch (error) {
      this._showStatus(`❌ Lỗi tìm kiếm: ${error.message}`, 'error');
    }
  }

  async _searchUserData(username, movieName) {
    if (!window.movieComments?.db) {
      throw new Error('Firebase không khả dụng');
    }
    
    const results = [];
    
    // Search by username
    if (username) {
      const userQuery = await window.movieComments.db
        .collection('savedMovies')
        .where('userName', '==', username)
        .limit(10)
        .get();
      
      userQuery.forEach(doc => {
        const data = doc.data();
        results.push({
          type: 'user',
          userId: data.userId,
          userName: data.userName,
          movieCount: 1 // This would need aggregation in real implementation
        });
      });
    }
    
    // Search by movie name
    if (movieName) {
      const movieQuery = await window.movieComments.db
        .collection('savedMovies')
        .where('name', '>=', movieName)
        .where('name', '<=', movieName + '\uf8ff')
        .limit(10)
        .get();
      
      movieQuery.forEach(doc => {
        const data = doc.data();
        results.push({
          type: 'movie',
          userId: data.userId,
          userName: data.userName,
          movieName: data.name
        });
      });
    }
    
    return results;
  }

  _showSearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    resultsContainer.innerHTML = `
      <h4>Kết quả tìm kiếm:</h4>
      <div class="search-results-list">
        ${results.map(result => `
          <div class="search-result-item">
            <div class="search-result-info">
              <strong>${result.userName}</strong>
              ${result.movieName ? `- ${result.movieName}` : ''}
            </div>
            <button class="btn btn--small" onclick="window.recoveryUI.recoverFromResult('${result.userId}')">
              Khôi phục
            </button>
          </div>
        `).join('')}
      </div>
    `;
    
    resultsContainer.style.display = 'block';
    this._hideStatus();
  }

  async recoverFromResult(userId) {
    this._showStatus('⏳ Đang khôi phục dữ liệu...', 'loading');
    
    try {
      // Set the recovered user ID
      localStorage.setItem('movie_commenter_id', userId);
      sessionStorage.setItem('movie_commenter_id', userId);
      
      // Verify data access
      const movies = await window.Storage?.getSavedMovies() || [];
      
      if (movies.length > 0) {
        this._showStatus(
          `✅ Khôi phục thành công! Tìm thấy ${movies.length} phim đã lưu.`,
          'success'
        );
        
        setTimeout(() => {
          this.hideModal();
          window.location.reload();
        }, 2000);
        
      } else {
        this._showStatus('❌ Không thể truy cập dữ liệu với user ID này', 'error');
      }
      
    } catch (error) {
      this._showStatus(`❌ Lỗi khôi phục: ${error.message}`, 'error');
    }
  }

  // 🆕 Start Fresh
  startFresh() {
    const confirmation = confirm(
      'Bạn có chắc chắn muốn bắt đầu mới? Điều này sẽ tạo tài khoản mới và không thể khôi phục dữ liệu cũ.'
    );
    
    if (confirmation) {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      this._showStatus('✅ Đã tạo tài khoản mới. Trang sẽ được tải lại...', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  // 📱 Sync Code Generation
  showSyncCodeGeneration() {
    const form = `
      <div class="recovery-form">
        <h3>📱 Tạo Mã Sync Mới</h3>
        <p>Tạo mã sync để đồng bộ với thiết bị khác:</p>
        
        <div class="sync-generation">
          <button id="generate-sync-btn" class="btn btn--primary">
            Tạo mã sync
          </button>
          
          <div id="generated-sync-code" class="generated-sync-code" style="display: none;">
            <div class="sync-code-display">
              <span class="sync-code-value"></span>
              <button class="copy-btn" onclick="window.recoveryUI.copySyncCode()">📋</button>
            </div>
            <p class="sync-code-note">Mã này có hiệu lực trong 24 giờ</p>
          </div>
        </div>
      </div>
    `;
    
    this._showForm(form);
    
    document.getElementById('generate-sync-btn').addEventListener('click', () => {
      this.generateSyncCode();
    });
  }

  async generateSyncCode() {
    this._showStatus('⏳ Đang tạo mã sync...', 'loading');
    
    try {
      if (!window.movieComments?.generateSyncCode) {
        throw new Error('Sync system không khả dụng');
      }
      
      const syncCode = await window.movieComments.generateSyncCode();
      
      document.querySelector('.sync-code-value').textContent = syncCode;
      document.getElementById('generated-sync-code').style.display = 'block';
      
      this._hideStatus();
      
    } catch (error) {
      this._showStatus(`❌ Lỗi tạo mã sync: ${error.message}`, 'error');
    }
  }

  copySyncCode() {
    const syncCode = document.querySelector('.sync-code-value').textContent;
    navigator.clipboard.writeText(syncCode).then(() => {
      this._showStatus('✅ Đã sao chép mã sync', 'success');
      setTimeout(() => this._hideStatus(), 2000);
    });
  }

  // 🎨 UI Helper Methods
  _showForm(formHTML) {
    const formsContainer = document.getElementById('recovery-forms');
    formsContainer.innerHTML = formHTML;
    formsContainer.style.display = 'block';
    
    // Hide methods
    document.querySelector('.recovery-methods').style.display = 'none';
  }

  _showStatus(message, type) {
    const statusContainer = document.getElementById('recovery-status');
    const statusContent = statusContainer.querySelector('.recovery-status__content');
    
    statusContent.innerHTML = `
      <div class="recovery-status__message recovery-status__message--${type}">
        ${message}
      </div>
    `;
    
    statusContainer.style.display = 'block';
  }

  _hideStatus() {
    document.getElementById('recovery-status').style.display = 'none';
  }

  hideModal() {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.remove('recovery-modal--visible');
      setTimeout(() => {
        modal.remove();
        this.isShowing = false;
      }, 300);
    }
  }

  // 🎨 Inject CSS Styles
  _injectStyles() {
    if (document.getElementById('recovery-ui-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'recovery-ui-styles';
    styles.textContent = `
      .recovery-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .recovery-modal--visible {
        opacity: 1;
        visibility: visible;
      }
      
      .recovery-modal__backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
      }
      
      .recovery-modal__container {
        position: relative;
        max-width: 600px;
        margin: 50px auto;
        background: #2d2d2d;
        border-radius: 12px;
        color: #fff;
        max-height: 90vh;
        overflow-y: auto;
      }
      
      .recovery-modal__header {
        padding: 24px;
        border-bottom: 1px solid #444;
        position: relative;
      }
      
      .recovery-modal__header h2 {
        margin: 0 0 8px 0;
        color: #6c5ce7;
      }
      
      .recovery-modal__close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        color: #999;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
      }
      
      .recovery-modal__close:hover {
        color: #fff;
      }
      
      .recovery-modal__content {
        padding: 24px;
      }
      
      .recovery-methods {
        display: grid;
        gap: 16px;
      }
      
      .recovery-method {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: #3d3d3d;
        border-radius: 8px;
        border: 2px solid transparent;
        transition: all 0.2s ease;
      }
      
      .recovery-method:hover {
        border-color: #6c5ce7;
        background: #444;
      }
      
      .recovery-method__icon {
        font-size: 32px;
        min-width: 48px;
        text-align: center;
      }
      
      .recovery-method__content {
        flex: 1;
      }
      
      .recovery-method__content h3 {
        margin: 0 0 4px 0;
        color: #fff;
      }
      
      .recovery-method__content p {
        margin: 0;
        color: #ccc;
        font-size: 14px;
      }
      
      .recovery-method__button {
        background: #6c5ce7;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .recovery-method__button:hover {
        background: #5f3dc4;
      }
      
      .recovery-form {
        background: #3d3d3d;
        padding: 24px;
        border-radius: 8px;
      }
      
      .recovery-form h3 {
        margin: 0 0 16px 0;
        color: #6c5ce7;
      }
      
      .sync-code-input {
        display: flex;
        gap: 12px;
        margin: 16px 0;
      }
      
      .sync-code-input input {
        flex: 1;
        padding: 12px;
        background: #2d2d2d;
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        font-size: 18px;
        text-align: center;
        letter-spacing: 2px;
      }
      
      .btn {
        background: #6c5ce7;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      }
      
      .btn:hover {
        background: #5f3dc4;
      }
      
      .btn--small {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      .recovery-status__message {
        padding: 12px;
        border-radius: 4px;
        margin: 16px 0;
      }
      
      .recovery-status__message--loading {
        background: #74b9ff;
        color: white;
      }
      
      .recovery-status__message--success {
        background: #00b894;
        color: white;
      }
      
      .recovery-status__message--error {
        background: #e17055;
        color: white;
      }
      
      .form-group {
        margin: 16px 0;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 4px;
        color: #ccc;
      }
      
      .form-group input {
        width: 100%;
        padding: 8px 12px;
        background: #2d2d2d;
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
      }
      
      .search-results {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #555;
      }
      
      .search-result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #2d2d2d;
        border-radius: 4px;
        margin: 8px 0;
      }
      
      .link-btn {
        background: none;
        border: none;
        color: #6c5ce7;
        cursor: pointer;
        text-decoration: underline;
      }
      
      .generated-sync-code {
        margin-top: 16px;
        padding: 16px;
        background: #2d2d2d;
        border-radius: 4px;
        text-align: center;
      }
      
      .sync-code-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .sync-code-value {
        font-size: 24px;
        font-weight: bold;
        color: #6c5ce7;
        letter-spacing: 4px;
      }
      
      .copy-btn {
        background: #555;
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .recovery-modal__footer {
        padding: 16px 24px;
        border-top: 1px solid #444;
        background: #3d3d3d;
        border-radius: 0 0 12px 12px;
      }
      
      .recovery-help {
        text-align: center;
        color: #ccc;
        font-size: 14px;
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Global instance
window.recoveryUI = new RecoveryUI();

console.log('🎨 Recovery UI System loaded');
