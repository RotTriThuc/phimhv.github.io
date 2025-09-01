// 🎨 Firebase Primary UI Components
// UI components để hiển thị danh sách phim từ Firebase Primary Storage

class FirebasePrimaryUI {
  constructor() {
    this.isLoading = false;
    this.currentMovies = [];
    this.lastUpdate = null;
  }

  // 🕐 Wait for Firebase Primary Storage to be ready
  async waitForFirebasePrimaryStorage(maxWaitTime = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Check if Firebase Primary Storage is ready
      if (window.FirebasePrimaryStorage?.initialized &&
          window.Storage?.getSavedMovies) {
        console.log('🔥 Firebase Primary Storage is ready for UI');
        return true;
      }

      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.warn(`⚠️ Firebase Primary Storage not ready after ${maxWaitTime}ms, proceeding anyway`);
    return false;
  }

  // 🎬 Render saved movies list
  async renderSavedMoviesList(containerId = 'saved-movies-container') {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`⚠️ Container ${containerId} not found`);
        return;
      }

      this.isLoading = true;
      this.showLoadingState(container);

      // Wait for Firebase Primary Storage to be ready
      await this.waitForFirebasePrimaryStorage();

      // Get movies from Firebase Primary Storage
      const movies = await window.Storage.getSavedMovies();
      this.currentMovies = movies;
      this.lastUpdate = new Date();

      if (movies.length === 0) {
        this.showEmptyState(container);
        return;
      }

      // Render movies
      container.innerHTML = this.generateMoviesHTML(movies);
      
      // Bind event listeners
      this.bindMovieEvents(container);

      console.log(`✅ Rendered ${movies.length} movies from Firebase`);

    } catch (error) {
      console.error('❌ Failed to render saved movies:', error);
      this.showErrorState(container, error.message);
    } finally {
      this.isLoading = false;
    }
  }

  // 🔄 Generate movies HTML
  generateMoviesHTML(movies) {
    const moviesHTML = movies.map(movie => `
      <div class="movie-item" data-slug="${movie.slug}">
        <div class="movie-poster">
          <img src="${movie.poster_url || '/assets/images/no-poster.jpg'}" 
               alt="${movie.name}" 
               loading="lazy"
               onerror="this.src='/assets/images/no-poster.jpg'">
          <div class="movie-overlay">
            <button class="btn-remove-movie" data-slug="${movie.slug}" title="Xóa khỏi danh sách">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-watch-movie" data-slug="${movie.slug}" title="Xem phim">
              <i class="fas fa-play"></i>
            </button>
          </div>
        </div>
        <div class="movie-info">
          <h3 class="movie-title" title="${movie.name}">${movie.name}</h3>
          <div class="movie-meta">
            <span class="movie-year">${movie.year || 'N/A'}</span>
            <span class="movie-quality">${movie.quality || 'HD'}</span>
            <span class="movie-lang">${movie.lang || 'Vietsub'}</span>
          </div>
          <div class="movie-episode">
            ${movie.episode_current || 'Tập 1'}
          </div>
          <div class="movie-saved-date">
            Đã lưu: ${this.formatDate(movie.savedAt)}
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="saved-movies-header">
        <h2>📚 Phim Đã Lưu (${movies.length})</h2>
        <div class="saved-movies-actions">
          <button class="btn btn-refresh" onclick="window.FirebasePrimaryUI.refreshMoviesList()">
            <i class="fas fa-sync-alt"></i> Làm mới
          </button>
          <button class="btn btn-sync" onclick="window.FirebasePrimaryUI.showSyncModal()">
            <i class="fas fa-mobile-alt"></i> Đồng bộ
          </button>
        </div>
      </div>
      <div class="saved-movies-grid">
        ${moviesHTML}
      </div>
      <div class="saved-movies-footer">
        <p>Cập nhật lần cuối: ${this.formatDate(this.lastUpdate)}</p>
        <p>Dữ liệu được lưu trữ an toàn trên Firebase</p>
      </div>
    `;
  }

  // 🔗 Bind event listeners
  bindMovieEvents(container) {
    // Remove movie buttons
    container.querySelectorAll('.btn-remove-movie').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const movieSlug = btn.dataset.slug;
        await this.removeMovie(movieSlug);
      });
    });

    // Watch movie buttons
    container.querySelectorAll('.btn-watch-movie').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const movieSlug = btn.dataset.slug;
        this.watchMovie(movieSlug);
      });
    });

    // Movie item click
    container.querySelectorAll('.movie-item').forEach(item => {
      item.addEventListener('click', () => {
        const movieSlug = item.dataset.slug;
        this.watchMovie(movieSlug);
      });
    });
  }

  // 🗑️ Remove movie
  async removeMovie(movieSlug) {
    try {
      const movie = this.currentMovies.find(m => m.slug === movieSlug);
      const movieName = movie ? movie.name : movieSlug;

      if (!confirm(`Bạn có chắc muốn xóa "${movieName}" khỏi danh sách?`)) {
        return;
      }

      console.log('🗑️ Removing movie:', movieSlug);

      // Remove from Firebase
      const success = await window.movieComments.removeSavedMovie(movieSlug);

      if (success) {
        // Remove from current list
        this.currentMovies = this.currentMovies.filter(m => m.slug !== movieSlug);
        
        // Re-render list
        await this.renderSavedMoviesList();
        
        this.showNotification(`Đã xóa "${movieName}" khỏi danh sách`, 'success');
      } else {
        throw new Error('Failed to remove movie');
      }

    } catch (error) {
      console.error('❌ Remove movie failed:', error);
      this.showNotification(`Lỗi xóa phim: ${error.message}`, 'error');
    }
  }

  // ▶️ Watch movie
  watchMovie(movieSlug) {
    try {
      // Navigate to movie page using hash routing (website uses hash routing)
      const movieUrl = `#/phim/${movieSlug}`;

      // Use navigateTo function if available, otherwise use location.hash
      if (window.navigateTo) {
        window.navigateTo(movieUrl);
      } else {
        window.location.hash = movieUrl;
      }
    } catch (error) {
      console.error('❌ Watch movie failed:', error);
      this.showNotification(`Lỗi mở phim: ${error.message}`, 'error');
    }
  }

  // 🔄 Refresh movies list
  async refreshMoviesList() {
    try {
      console.log('🔄 Refreshing movies list from Firebase...');
      
      // Force refresh from Firebase
      await window.Storage.forceRefresh();
      
      // Re-render
      await this.renderSavedMoviesList();
      
      this.showNotification('Đã làm mới danh sách phim', 'success');
      
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      this.showNotification(`Lỗi làm mới: ${error.message}`, 'error');
    }
  }

  // 📱 Show sync modal
  showSyncModal() {
    const modal = document.createElement('div');
    modal.className = 'sync-modal';
    modal.innerHTML = `
      <div class="sync-modal-backdrop"></div>
      <div class="sync-modal-content">
        <div class="sync-modal-header">
          <h3>📱 Đồng Bộ Thiết Bị</h3>
          <button class="sync-modal-close">&times;</button>
        </div>
        <div class="sync-modal-body">
          <div class="sync-option">
            <h4>Tạo Mã Đồng Bộ</h4>
            <p>Tạo mã để đồng bộ với thiết bị khác</p>
            <button class="btn btn-primary" onclick="window.FirebasePrimaryUI.generateSyncCode()">
              Tạo Mã Sync
            </button>
            <div id="generated-sync-code" style="display: none;">
              <div class="sync-code-display">
                <span class="sync-code"></span>
                <button class="btn-copy" onclick="window.FirebasePrimaryUI.copySyncCode()">📋</button>
              </div>
              <p class="sync-code-note">Mã có hiệu lực trong 24 giờ</p>
            </div>
          </div>
          
          <div class="sync-option">
            <h4>Sử Dụng Mã Đồng Bộ</h4>
            <p>Nhập mã từ thiết bị khác để đồng bộ</p>
            <div class="sync-input-group">
              <input type="text" id="sync-code-input" placeholder="Nhập mã 6 ký tự" maxlength="6">
              <button class="btn btn-primary" onclick="window.FirebasePrimaryUI.useSyncCode()">
                Đồng Bộ
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind close events
    modal.querySelector('.sync-modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('.sync-modal-backdrop').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }

  // 📱 Generate sync code
  async generateSyncCode() {
    try {
      const syncCode = await window.movieComments.generateSyncCode();
      
      if (syncCode) {
        const codeDisplay = document.getElementById('generated-sync-code');
        const codeSpan = codeDisplay.querySelector('.sync-code');
        
        codeSpan.textContent = syncCode;
        codeDisplay.style.display = 'block';
        
        this.showNotification(`Mã sync đã tạo: ${syncCode}`, 'success');
      }
    } catch (error) {
      this.showNotification(`Lỗi tạo mã sync: ${error.message}`, 'error');
    }
  }

  // 📋 Copy sync code
  copySyncCode() {
    const syncCode = document.querySelector('.sync-code').textContent;
    navigator.clipboard.writeText(syncCode).then(() => {
      this.showNotification('Đã sao chép mã sync', 'success');
    });
  }

  // 🔄 Use sync code
  async useSyncCode() {
    try {
      const syncCode = document.getElementById('sync-code-input').value.trim().toUpperCase();
      
      if (!syncCode || syncCode.length !== 6) {
        this.showNotification('Vui lòng nhập mã sync 6 ký tự', 'error');
        return;
      }

      const result = await window.movieComments.useSyncCode(syncCode);
      
      if (result.success) {
        this.showNotification('Đồng bộ thành công!', 'success');
        
        // Close modal
        const modal = document.querySelector('.sync-modal');
        if (modal) {
          document.body.removeChild(modal);
        }
        
        // Refresh page after sync
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      this.showNotification(`Lỗi đồng bộ: ${error.message}`, 'error');
    }
  }

  // 🎨 UI State Methods
  
  showLoadingState(container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Đang khởi tạo Firebase Primary Storage...</p>
        <div style="font-size:12px;margin-top:8px;color:var(--muted);">
          Đang chờ Firebase sẵn sàng...
        </div>
      </div>
    `;
  }

  showEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Chưa có phim nào được lưu</h3>
        <p>Hãy lưu những bộ phim yêu thích để xem sau!</p>
        <button class="btn btn-primary" onclick="window.location.hash='#/'">
          Khám phá phim
        </button>
      </div>
    `;
  }

  showErrorState(container, errorMessage) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">❌</div>
        <h3>Lỗi tải danh sách phim</h3>
        <p>${errorMessage}</p>
        <button class="btn btn-primary" onclick="window.FirebasePrimaryUI.renderSavedMoviesList()">
          Thử lại
        </button>
      </div>
    `;
  }

  // 🔔 Show notification
  showNotification(message, type = 'info') {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      `;

      // Add to page
      document.body.appendChild(notification);

      // Auto remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);

      // Close button
      notification.querySelector('.notification-close').addEventListener('click', () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });

    } catch (error) {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // 🕒 Format date
  formatDate(date) {
    if (!date) return 'N/A';
    
    try {
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  // 📊 Get UI info
  getUIInfo() {
    return {
      isLoading: this.isLoading,
      movieCount: this.currentMovies.length,
      lastUpdate: this.lastUpdate
    };
  }
}

// Global instance
window.FirebasePrimaryUI = new FirebasePrimaryUI();

// Auto-render on page load if container exists
window.addEventListener('load', () => {
  setTimeout(() => {
    const container = document.getElementById('saved-movies-container');
    if (container) {
      window.FirebasePrimaryUI.renderSavedMoviesList();
    }
  }, 3000);
});

// Listen for movie list updates
window.addEventListener('movieListUpdated', () => {
  const container = document.getElementById('saved-movies-container');
  if (container) {
    window.FirebasePrimaryUI.renderSavedMoviesList();
  }
});

console.log('🎨 Firebase Primary UI loaded');
