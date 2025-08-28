/**
 * 🚀 Optimized App - Giải quyết vấn đề hiệu suất
 * Thay thế app.js 131KB bằng virtual scrolling và lazy loading
 */

let appState = {
  initialized: false,
  currentRoute: '/',
  movies: [],
  virtualScroller: null,
  dataPagination: null,
  lazyLoader: null,
  totalMovies: 0
};

/**
 * Initialize optimized app
 */
export async function initApp(dependencies) {
  if (appState.initialized) {
    console.warn('⚠️ App already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing optimized PhimHV app...');
    
    // Store dependencies
    appState.dataPagination = dependencies.dataPagination;
    appState.MovieVirtualScroller = dependencies.MovieVirtualScroller;
    appState.lazyLoader = dependencies.lazyLoader;
    
    // Initialize router
    await initRouter();
    
    // Load initial page
    await loadHomePage();
    
    // Setup event listeners
    setupEventListeners();
    
    appState.initialized = true;
    console.log('✅ Optimized app initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize optimized app:', error);
    throw error;
  }
}

/**
 * Initialize router
 */
async function initRouter() {
  // Simple hash-based router
  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('popstate', handleRouteChange);
  
  // Handle initial route
  handleRouteChange();
}

/**
 * Handle route changes
 */
async function handleRouteChange() {
  const hash = window.location.hash.slice(1) || '/';
  const [route, ...params] = hash.split('/').filter(Boolean);
  
  console.log(`🛣️ Navigating to: ${hash}`);
  
  try {
    switch (route) {
      case '':
      case 'home':
        await loadHomePage();
        break;
      case 'phim':
        if (params[0]) {
          await loadMovieDetail(params[0]);
        }
        break;
      case 'the-loai':
        await loadCategoryPage(params[0]);
        break;
      case 'tim-kiem':
        await loadSearchPage();
        break;
      default:
        await loadHomePage();
    }
    
    appState.currentRoute = hash;
    
  } catch (error) {
    console.error(`❌ Failed to load route ${hash}:`, error);
    showErrorPage(error);
  }
}

/**
 * Load home page with virtual scrolling
 */
async function loadHomePage() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('App container not found');
  }

  // Show loading
  appContainer.innerHTML = `
    <div class="loading-container" style="text-align: center; padding: 2rem;">
      <div class="spinner" style="border: 3px solid #333; border-top: 3px solid #6c5ce7; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
      <p>Đang tải danh sách phim...</p>
    </div>
  `;

  try {
    // Load first page of movies
    const firstPage = await appState.dataPagination.loadPage(1);
    
    if (!firstPage || !firstPage.items) {
      throw new Error('No movies data available');
    }

    // Create home page layout
    appContainer.innerHTML = `
      <div class="home-page">
        <!-- Hero Section -->
        <section class="hero-section" style="margin-bottom: 2rem;">
          <div class="hero-slider" id="heroSlider">
            <div class="loading" style="text-align: center; padding: 2rem;">
              <div class="spinner"></div>
              <p>Đang tải phim nổi bật...</p>
            </div>
          </div>
        </section>

        <!-- Movies Grid -->
        <section class="movies-section">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2 style="color: #fff; font-size: 24px;">Tất cả phim</h2>
            <div class="view-controls">
              <button id="gridViewBtn" class="view-btn active" style="background: #6c5ce7; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-left: 8px; cursor: pointer;">
                📱 Grid
              </button>
              <button id="listViewBtn" class="view-btn" style="background: #333; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-left: 8px; cursor: pointer;">
                📋 List
              </button>
            </div>
          </div>
          
          <!-- Virtual Scroller Container -->
          <div id="moviesContainer" style="height: 80vh; overflow: auto; background: #1e1e1e; border-radius: 8px; padding: 1rem;">
            <div class="loading" style="text-align: center; padding: 2rem;">
              <div class="spinner"></div>
              <p>Đang khởi tạo virtual scroller...</p>
            </div>
          </div>
          
          <!-- Stats -->
          <div class="stats-bar" style="margin-top: 1rem; padding: 1rem; background: #2a2a2a; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span id="moviesStats">Đang tải...</span>
            <span id="performanceStats"></span>
          </div>
        </section>
      </div>
    `;

    // Initialize hero slider with featured movies
    await initHeroSlider(firstPage.items.slice(0, 5));

    // Initialize virtual scroller
    await initMoviesVirtualScroller();

    // Setup view controls
    setupViewControls();

    console.log('✅ Home page loaded with virtual scrolling');

  } catch (error) {
    console.error('❌ Failed to load home page:', error);
    appContainer.innerHTML = `
      <div class="error-container" style="text-align: center; padding: 2rem;">
        <h2 style="color: #e74c3c;">❌ Lỗi tải trang</h2>
        <p style="margin: 1rem 0;">${error.message}</p>
        <button onclick="location.reload()" style="background: #6c5ce7; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
          🔄 Thử lại
        </button>
      </div>
    `;
  }
}

/**
 * Initialize hero slider
 */
async function initHeroSlider(featuredMovies) {
  const heroSlider = document.getElementById('heroSlider');
  if (!heroSlider || !featuredMovies.length) return;

  const heroHTML = featuredMovies.map((movie, index) => `
    <div class="hero-slide ${index === 0 ? 'active' : ''}" style="
      display: ${index === 0 ? 'block' : 'none'};
      background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('${movie.poster_url || movie.thumb_url || ''}');
      background-size: cover;
      background-position: center;
      height: 400px;
      border-radius: 8px;
      padding: 2rem;
      display: flex;
      align-items: flex-end;
      color: white;
      position: relative;
      cursor: pointer;
    " onclick="window.location.hash = '#/phim/${movie.slug}'">
      <div class="hero-content">
        <h3 style="font-size: 28px; margin-bottom: 0.5rem;">${movie.name}</h3>
        <p style="font-size: 16px; opacity: 0.9; margin-bottom: 1rem;">${movie.origin_name || ''}</p>
        <div class="hero-meta" style="display: flex; gap: 1rem; font-size: 14px; opacity: 0.8;">
          <span>📅 ${movie.year || 'N/A'}</span>
          <span>🎭 ${movie.category?.[0]?.name || 'N/A'}</span>
          <span>🌍 ${movie.country?.[0]?.name || 'N/A'}</span>
        </div>
      </div>
    </div>
  `).join('');

  heroSlider.innerHTML = heroHTML;

  // Auto-rotate slides
  let currentSlide = 0;
  setInterval(() => {
    const slides = heroSlider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    slides[currentSlide].style.display = 'none';
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].style.display = 'flex';
  }, 5000);

  console.log(`🎬 Hero slider initialized with ${featuredMovies.length} movies`);
}

/**
 * Initialize movies virtual scroller
 */
async function initMoviesVirtualScroller() {
  const container = document.getElementById('moviesContainer');
  if (!container) {
    throw new Error('Movies container not found');
  }

  try {
    // Create virtual scroller
    appState.virtualScroller = new appState.MovieVirtualScroller(container, {
      itemHeight: 280,
      bufferSize: 3,
      threshold: 500,
      loadMoreCallback: async (currentCount) => {
        const nextPage = Math.floor(currentCount / 100) + 1;
        console.log(`📥 Loading page ${nextPage} for virtual scroller...`);
        
        const pageData = await appState.dataPagination.loadPage(nextPage);
        return {
          items: pageData?.items || [],
          hasMore: pageData?.hasNext !== false
        };
      }
    });

    // Load first page
    const firstPage = await appState.dataPagination.loadPage(1);
    appState.virtualScroller.setItems(firstPage.items || []);

    // Update stats
    updateMoviesStats();

    console.log('✅ Virtual scroller initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize virtual scroller:', error);
    container.innerHTML = `
      <div class="error" style="text-align: center; padding: 2rem; color: #e74c3c;">
        <h3>❌ Lỗi khởi tạo virtual scroller</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()" style="background: #6c5ce7; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          🔄 Thử lại
        </button>
      </div>
    `;
  }
}

/**
 * Update movies statistics
 */
function updateMoviesStats() {
  const statsElement = document.getElementById('moviesStats');
  const perfElement = document.getElementById('performanceStats');
  
  if (statsElement && appState.virtualScroller) {
    const stats = appState.virtualScroller.getStats();
    const paginationStats = appState.dataPagination.getCacheStats();
    
    statsElement.textContent = `📊 Hiển thị ${stats.visibleItems}/${stats.totalItems} phim • Trang ${paginationStats.cachedPages.join(', ')} đã cache`;
  }
  
  if (perfElement) {
    const memoryUsage = performance.memory ? 
      `RAM: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB` : 
      'RAM: N/A';
    
    perfElement.textContent = `⚡ ${memoryUsage} • Virtual Scrolling Active`;
  }
}

/**
 * Setup view controls
 */
function setupViewControls() {
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  
  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => {
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
      
      if (appState.virtualScroller) {
        appState.virtualScroller.updateItemHeight(280); // Grid height
      }
    });
    
    listBtn.addEventListener('click', () => {
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
      
      if (appState.virtualScroller) {
        appState.virtualScroller.updateItemHeight(120); // List height
      }
    });
  }
}

/**
 * Load movie detail page
 */
async function loadMovieDetail(slug) {
  const appContainer = document.getElementById('app');
  
  appContainer.innerHTML = `
    <div class="loading-container" style="text-align: center; padding: 2rem;">
      <div class="spinner"></div>
      <p>Đang tải thông tin phim...</p>
    </div>
  `;

  try {
    // Search for movie in cached pages first
    let movie = null;
    const cacheStats = appState.dataPagination.getCacheStats();
    
    for (const pageNum of cacheStats.cachedPages) {
      const pageData = await appState.dataPagination.loadPage(pageNum);
      movie = pageData.items.find(m => m.slug === slug);
      if (movie) break;
    }

    // If not found in cache, search all pages
    if (!movie) {
      console.log(`🔍 Searching for movie: ${slug}`);
      const searchResults = await appState.dataPagination.search(slug, { maxResults: 1 });
      movie = searchResults[0];
    }

    if (!movie) {
      throw new Error(`Không tìm thấy phim: ${slug}`);
    }

    // Render movie detail
    appContainer.innerHTML = `
      <div class="movie-detail">
        <button onclick="history.back()" style="background: #333; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 1rem;">
          ← Quay lại
        </button>
        
        <div class="movie-info" style="display: flex; gap: 2rem; margin-bottom: 2rem;">
          <img src="${movie.poster_url || movie.thumb_url || ''}" alt="${movie.name}" 
               style="width: 300px; height: 450px; object-fit: cover; border-radius: 8px;"
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDMwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjI1IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+'">
          
          <div class="movie-details" style="flex: 1;">
            <h1 style="color: #fff; font-size: 32px; margin-bottom: 0.5rem;">${movie.name}</h1>
            <h2 style="color: #888; font-size: 20px; margin-bottom: 1rem;">${movie.origin_name || ''}</h2>
            
            <div class="movie-meta" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
              <div><strong>Năm:</strong> ${movie.year || 'N/A'}</div>
              <div><strong>Quốc gia:</strong> ${movie.country?.map(c => c.name).join(', ') || 'N/A'}</div>
              <div><strong>Thể loại:</strong> ${movie.category?.map(c => c.name).join(', ') || 'N/A'}</div>
              <div><strong>Tập hiện tại:</strong> ${movie.episode_current || 'N/A'}</div>
            </div>
            
            <div class="movie-description" style="color: #ccc; line-height: 1.6;">
              <p>${movie.content || 'Chưa có mô tả.'}</p>
            </div>
            
            <div class="movie-actions" style="margin-top: 2rem;">
              <button onclick="alert('Chức năng xem phim sẽ được thêm sau')" 
                      style="background: #6c5ce7; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-right: 1rem;">
                ▶️ Xem phim
              </button>
              <button onclick="alert('Đã thêm vào danh sách yêu thích')" 
                      style="background: #e74c3c; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px;">
                ❤️ Yêu thích
              </button>
            </div>
          </div>
        </div>
        
        <!-- Comments section placeholder -->
        <div class="comments-section" style="background: #1e1e1e; padding: 2rem; border-radius: 8px;">
          <h3 style="color: #fff; margin-bottom: 1rem;">💬 Bình luận</h3>
          <p style="color: #888;">Hệ thống bình luận sẽ được tích hợp sau.</p>
        </div>
      </div>
    `;

    console.log(`✅ Movie detail loaded: ${movie.name}`);

  } catch (error) {
    console.error('❌ Failed to load movie detail:', error);
    appContainer.innerHTML = `
      <div class="error-container" style="text-align: center; padding: 2rem;">
        <h2 style="color: #e74c3c;">❌ Lỗi tải phim</h2>
        <p style="margin: 1rem 0;">${error.message}</p>
        <button onclick="history.back()" style="background: #6c5ce7; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
          ← Quay lại
        </button>
      </div>
    `;
  }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  // Update stats periodically
  setInterval(updateMoviesStats, 5000);
  
  // Handle search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        handleSearch(e.target.value);
      }, 300);
    });
  }
  
  console.log('✅ Event listeners setup complete');
}

/**
 * Handle search
 */
async function handleSearch(query) {
  if (!query.trim()) return;
  
  console.log(`🔍 Searching for: ${query}`);
  
  try {
    const results = await appState.dataPagination.search(query, { maxResults: 20 });
    
    if (appState.virtualScroller) {
      appState.virtualScroller.setItems(results);
      updateMoviesStats();
    }
    
    console.log(`🔍 Search completed: ${results.length} results`);
    
  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

/**
 * Show error page
 */
function showErrorPage(error) {
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = `
    <div class="error-page" style="text-align: center; padding: 4rem 2rem;">
      <h1 style="color: #e74c3c; font-size: 48px; margin-bottom: 1rem;">❌</h1>
      <h2 style="color: #fff; margin-bottom: 1rem;">Oops! Có lỗi xảy ra</h2>
      <p style="color: #888; margin-bottom: 2rem;">${error.message}</p>
      <div>
        <button onclick="location.reload()" style="background: #6c5ce7; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin-right: 1rem;">
          🔄 Tải lại trang
        </button>
        <button onclick="window.location.hash = '#/'" style="background: #333; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;">
          🏠 Về trang chủ
        </button>
      </div>
    </div>
  `;
}

// Export for global access
if (typeof window !== 'undefined') {
  window.optimizedApp = { initApp };
}
