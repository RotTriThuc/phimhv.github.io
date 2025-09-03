/* Page Renderers - Complete implementation of all page rendering logic */

import { Logger } from './logger.js';
import { Api } from './api.js';
import { 
  createEl, 
  safeRemove, 
  extractItems, 
  showNotification,
  debounce,
  getFromStorage,
  setToStorage 
} from './utils.js';
import { 
  renderLoadingCards,
  createMovieCard,
  listGrid,
  createPagination,
  renderError,
  sectionHeader,
  createSearchForm
} from './ui-components.js';
import { imageLoader } from './image-loader.js';

// Page state management
const PageState = {
  currentPage: 1,
  isLoading: false,
  hasMore: true,
  loadedItems: new Set()
};

// Home Page Renderer
export async function renderHome(root) {
  try {
    root.innerHTML = '';
    
    // Create home page structure
    const homeContainer = createEl('div', 'home-page');
    
    // Hero Banner Section
    const bannerSection = await renderBannerSection();
    homeContainer.appendChild(bannerSection);
    
    // Latest Movies Section
    const latestSection = await renderLatestMoviesSection();
    homeContainer.appendChild(latestSection);
    
    // Categories Section
    const categoriesSection = await renderCategoriesSection();
    homeContainer.appendChild(categoriesSection);
    
    root.appendChild(homeContainer);
    
    // Initialize banner slider if exists
    if (window.BannerSlider) {
      new window.BannerSlider('.banner-slider');
    }
    
    Logger.debug('Home page rendered successfully');
    
  } catch (error) {
    Logger.error('Home page render failed:', error);
    root.appendChild(renderError('Không thể tải trang chủ', () => renderHome(root)));
  }
}

// Banner Section
async function renderBannerSection() {
  const section = createEl('section', 'banner-section');
  
  try {
    // Get featured movies for banner
    const response = await Api.getLatest(1);
    const movies = extractItems(response).slice(0, 5); // Top 5 for banner
    
    if (movies.length > 0) {
      const bannerSlider = createEl('div', 'banner-slider');
      
      movies.forEach((movie, index) => {
        const slide = createBannerSlide(movie, index === 0);
        bannerSlider.appendChild(slide);
      });
      
      // Add navigation
      const nav = createBannerNavigation(movies.length);
      bannerSlider.appendChild(nav);
      
      section.appendChild(bannerSlider);
      
      // Preload banner images
      const bannerImages = movies.map(m => m.poster_url || m.thumb_url).filter(Boolean);
      imageLoader.preloadCritical(bannerImages);
    }
    
  } catch (error) {
    Logger.warn('Banner section failed:', error);
    // Fallback banner
    section.innerHTML = `
      <div class="banner-fallback">
        <h1>Xem Phim Online</h1>
        <p>Thưởng thức hàng ngàn bộ phim chất lượng cao</p>
      </div>
    `;
  }
  
  return section;
}

function createBannerSlide(movie, isActive = false) {
  const slide = createEl('div', `banner-slide ${isActive ? 'banner-slide--active' : ''}`);
  
  const posterUrl = movie.poster_url || movie.thumb_url || '';
  const movieName = movie.name || 'Không có tên';
  const description = movie.content || movie.origin_name || 'Không có mô tả';
  
  slide.innerHTML = `
    <div class="banner-slide__bg">
      <img data-src="${posterUrl}" alt="${movieName}" class="banner-slide__image">
    </div>
    <div class="banner-slide__content">
      <div class="banner-slide__info">
        <h2 class="banner-slide__title">${movieName}</h2>
        <p class="banner-slide__description">${description.substring(0, 200)}...</p>
        <div class="banner-slide__meta">
          ${movie.year ? `<span class="banner-slide__year">${movie.year}</span>` : ''}
          ${movie.quality ? `<span class="banner-slide__quality">${movie.quality}</span>` : ''}
        </div>
        <div class="banner-slide__actions">
          <a href="#/phim/${movie.slug}" class="btn btn--primary banner-btn--primary">
            ▶ Xem ngay
          </a>
          <button class="btn btn--secondary banner-btn--secondary" data-movie-slug="${movie.slug}">
            ❤️ Yêu thích
          </button>
        </div>
      </div>
    </div>
  `;
  
  return slide;
}

function createBannerNavigation(slideCount) {
  const nav = createEl('div', 'banner-nav');
  
  for (let i = 0; i < slideCount; i++) {
    const dot = createEl('button', `banner-nav__dot ${i === 0 ? 'banner-nav__dot--active' : ''}`);
    dot.setAttribute('data-slide', i);
    nav.appendChild(dot);
  }
  
  return nav;
}

// Latest Movies Section
async function renderLatestMoviesSection() {
  const section = createEl('section', 'latest-section');
  const header = sectionHeader('Phim mới cập nhật', 
    createEl('a', 'section__more', 'Xem tất cả').setAttribute('href', '#/loc') && 
    document.querySelector('.section__more')
  );
  section.appendChild(header);
  
  try {
    // Show loading skeleton
    const loadingGrid = renderLoadingCards(12);
    section.appendChild(loadingGrid);
    
    // Fetch latest movies
    const response = await Api.getLatest(1);
    const movies = extractItems(response).slice(0, 12);
    
    // Remove loading and show movies
    safeRemove(loadingGrid);
    
    if (movies.length > 0) {
      const grid = listGrid(movies, 'grid grid--latest');
      section.appendChild(grid);
    } else {
      section.appendChild(createEl('p', 'empty-message', 'Không có phim mới'));
    }
    
  } catch (error) {
    Logger.error('Latest movies section failed:', error);
    section.appendChild(renderError('Không thể tải phim mới', () => renderLatestMoviesSection()));
  }
  
  return section;
}

// Categories Section
async function renderCategoriesSection() {
  const section = createEl('section', 'categories-section');
  const header = sectionHeader('Thể loại phim');
  section.appendChild(header);
  
  try {
    const response = await Api.getCategories();
    const categories = extractItems(response).slice(0, 12);
    
    if (categories.length > 0) {
      const grid = createEl('div', 'categories-grid');
      
      categories.forEach(category => {
        const categoryCard = createEl('a', 'category-card');
        categoryCard.href = `#/the-loai/${category.slug}`;
        categoryCard.innerHTML = `
          <div class="category-card__icon">${getCategoryIcon(category.slug)}</div>
          <div class="category-card__name">${category.name}</div>
        `;
        grid.appendChild(categoryCard);
      });
      
      section.appendChild(grid);
    }
    
  } catch (error) {
    Logger.warn('Categories section failed:', error);
    section.appendChild(createEl('p', 'error-message', 'Không thể tải danh sách thể loại'));
  }
  
  return section;
}

function getCategoryIcon(slug) {
  const icons = {
    'hanh-dong': '🎬',
    'tinh-cam': '💕',
    'hai-huoc': '😂',
    'kinh-di': '👻',
    'phieu-luu': '🗺️',
    'khoa-hoc-vien-tuong': '🚀',
    'anime': '🎌',
    'chien-tranh': '⚔️'
  };
  return icons[slug] || '🎭';
}

// Search Page Renderer
export async function renderSearch(root, params) {
  try {
    root.innerHTML = '';
    PageState.currentPage = parseInt(params.get('page')) || 1;
    
    const searchContainer = createEl('div', 'search-page');
    
    // Search form
    const searchForm = createSearchForm({
      keyword: params.get('keyword') || '',
      category: params.get('category') || '',
      country: params.get('country') || '',
      year: params.get('year') || '',
      sort_field: params.get('sort_field') || 'modified.time'
    });
    
    searchContainer.appendChild(searchForm);
    
    // Results container
    const resultsContainer = createEl('div', 'search-results');
    searchContainer.appendChild(resultsContainer);
    
    root.appendChild(searchContainer);
    
    // Bind search form
    bindSearchForm(searchForm);
    
    // Load search results if there's a keyword
    const keyword = params.get('keyword');
    if (keyword) {
      await loadSearchResults(resultsContainer, params);
    } else {
      resultsContainer.innerHTML = `
        <div class="search-empty">
          <div class="search-empty__icon">🔍</div>
          <div class="search-empty__message">Nhập từ khóa để tìm kiếm phim</div>
        </div>
      `;
    }
    
    Logger.debug('Search page rendered');
    
  } catch (error) {
    Logger.error('Search page render failed:', error);
    root.appendChild(renderError('Không thể tải trang tìm kiếm', () => renderSearch(root, params)));
  }
}

async function loadSearchResults(container, params) {
  try {
    // Show loading
    container.innerHTML = '';
    const loadingGrid = renderLoadingCards(12);
    container.appendChild(loadingGrid);
    
    // Search parameters
    const searchParams = {
      keyword: params.get('keyword'),
      page: parseInt(params.get('page')) || 1,
      category: params.get('category') || '',
      country: params.get('country') || '',
      year: params.get('year') || '',
      sort_field: params.get('sort_field') || 'modified.time',
      limit: 24
    };
    
    // Perform search
    const response = await Api.search(searchParams);
    const movies = extractItems(response);
    const pagination = response?.data?.params || {};
    
    // Remove loading
    safeRemove(loadingGrid);
    
    if (movies.length > 0) {
      // Results header
      const resultsHeader = createEl('div', 'search-results__header');
      resultsHeader.innerHTML = `
        <h2>Kết quả tìm kiếm: "${searchParams.keyword}"</h2>
        <p>Tìm thấy ${pagination.total_items || movies.length} kết quả</p>
      `;
      container.appendChild(resultsHeader);
      
      // Movies grid
      const grid = listGrid(movies, 'grid grid--search');
      container.appendChild(grid);
      
      // Pagination
      if (pagination.total_pages > 1) {
        const paginationEl = createPagination(
          searchParams.page,
          pagination.total_pages,
          `#/tim-kiem?keyword=${encodeURIComponent(searchParams.keyword)}`
        );
        container.appendChild(paginationEl);
      }
      
    } else {
      container.innerHTML = `
        <div class="search-empty">
          <div class="search-empty__icon">😔</div>
          <div class="search-empty__message">Không tìm thấy kết quả nào cho "${searchParams.keyword}"</div>
          <div class="search-empty__suggestion">Thử tìm kiếm với từ khóa khác</div>
        </div>
      `;
    }
    
  } catch (error) {
    Logger.error('Search results failed:', error);
    container.appendChild(renderError('Không thể tải kết quả tìm kiếm', () => loadSearchResults(container, params)));
  }
}

function bindSearchForm(form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    }
    
    window.location.hash = `#/tim-kiem?${params.toString()}`;
  });
  
  // Auto-search on input (debounced)
  const keywordInput = form.querySelector('input[name="keyword"]');
  if (keywordInput) {
    const debouncedSearch = debounce((value) => {
      if (value.length >= 2) {
        const params = new URLSearchParams();
        params.set('keyword', value);
        window.location.hash = `#/tim-kiem?${params.toString()}`;
      }
    }, 500);
    
    keywordInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }
}

// Combined Filter Page Renderer
export async function renderCombinedFilter(root, params) {
  try {
    root.innerHTML = '';
    PageState.currentPage = parseInt(params.get('page')) || 1;
    
    const filterContainer = createEl('div', 'filter-page');
    
    // Filter header
    const filterHeader = createFilterHeader(params);
    filterContainer.appendChild(filterHeader);
    
    // Filter controls
    const filterControls = createFilterControls(params);
    filterContainer.appendChild(filterControls);
    
    // Results container
    const resultsContainer = createEl('div', 'filter-results');
    filterContainer.appendChild(resultsContainer);
    
    root.appendChild(filterContainer);
    
    // Load filtered results
    await loadFilteredResults(resultsContainer, params);
    
    // Bind filter controls
    bindFilterControls(filterControls);
    
    Logger.debug('Filter page rendered');
    
  } catch (error) {
    Logger.error('Filter page render failed:', error);
    root.appendChild(renderError('Không thể tải trang lọc', () => renderCombinedFilter(root, params)));
  }
}

function createFilterHeader(params) {
  const header = createEl('div', 'filter-header');
  
  let title = 'Lọc phim';
  if (params.get('category')) title = `Thể loại: ${params.get('category')}`;
  if (params.get('country')) title = `Quốc gia: ${params.get('country')}`;
  if (params.get('year')) title = `Năm: ${params.get('year')}`;
  
  header.innerHTML = `<h1>${title}</h1>`;
  return header;
}

function createFilterControls(params) {
  const controls = createEl('div', 'filter-controls');
  
  controls.innerHTML = `
    <div class="filter-controls__row">
      <select name="category" class="filter-select">
        <option value="">Tất cả thể loại</option>
      </select>
      <select name="country" class="filter-select">
        <option value="">Tất cả quốc gia</option>
      </select>
      <select name="year" class="filter-select">
        <option value="">Tất cả năm</option>
      </select>
      <select name="sort_field" class="filter-select">
        <option value="modified.time">Mới cập nhật</option>
        <option value="created.time">Mới thêm</option>
        <option value="view">Lượt xem</option>
      </select>
    </div>
  `;
  
  // Set current values
  const categorySelect = controls.querySelector('select[name="category"]');
  const countrySelect = controls.querySelector('select[name="country"]');
  const yearSelect = controls.querySelector('select[name="year"]');
  const sortSelect = controls.querySelector('select[name="sort_field"]');
  
  if (categorySelect) categorySelect.value = params.get('category') || '';
  if (countrySelect) countrySelect.value = params.get('country') || '';
  if (yearSelect) yearSelect.value = params.get('year') || '';
  if (sortSelect) sortSelect.value = params.get('sort_field') || 'modified.time';
  
  return controls;
}

async function loadFilteredResults(container, params) {
  try {
    // Show loading
    container.innerHTML = '';
    const loadingGrid = renderLoadingCards(24);
    container.appendChild(loadingGrid);
    
    // Filter parameters
    const filterParams = {
      type_list: 'phim-moi-cap-nhat',
      page: parseInt(params.get('page')) || 1,
      category: params.get('category') || '',
      country: params.get('country') || '',
      year: params.get('year') || '',
      sort_field: params.get('sort_field') || 'modified.time',
      limit: 24
    };
    
    // Fetch filtered movies
    const response = await Api.listByType(filterParams);
    const movies = extractItems(response);
    const pagination = response?.data?.params || {};
    
    // Remove loading
    safeRemove(loadingGrid);
    
    if (movies.length > 0) {
      // Movies grid
      const grid = listGrid(movies, 'grid grid--filter');
      container.appendChild(grid);
      
      // Pagination
      if (pagination.total_pages > 1) {
        const currentParams = new URLSearchParams(params);
        currentParams.delete('page'); // Remove page to build base URL
        const baseUrl = `#/loc?${currentParams.toString()}`;
        
        const paginationEl = createPagination(
          filterParams.page,
          pagination.total_pages,
          baseUrl
        );
        container.appendChild(paginationEl);
      }
      
    } else {
      container.innerHTML = `
        <div class="filter-empty">
          <div class="filter-empty__icon">📽️</div>
          <div class="filter-empty__message">Không tìm thấy phim nào với bộ lọc này</div>
          <div class="filter-empty__suggestion">Thử thay đổi bộ lọc</div>
        </div>
      `;
    }
    
  } catch (error) {
    Logger.error('Filtered results failed:', error);
    container.appendChild(renderError('Không thể tải danh sách phim', () => loadFilteredResults(container, params)));
  }
}

function bindFilterControls(controls) {
  const selects = controls.querySelectorAll('select');

  selects.forEach(select => {
    select.addEventListener('change', () => {
      const params = new URLSearchParams();

      selects.forEach(s => {
        if (s.value) {
          params.set(s.name, s.value);
        }
      });

      window.location.hash = `#/loc?${params.toString()}`;
    });
  });
}

// All Categories Page Renderer
export async function renderAllCategories(root) {
  try {
    root.innerHTML = '';

    const categoriesContainer = createEl('div', 'categories-page');

    // Page header
    const header = createEl('div', 'page-header');
    header.innerHTML = '<h1>Tất cả thể loại</h1>';
    categoriesContainer.appendChild(header);

    // Loading state
    const loadingGrid = createEl('div', 'categories-loading');
    for (let i = 0; i < 12; i++) {
      const skeleton = createEl('div', 'category-skeleton');
      loadingGrid.appendChild(skeleton);
    }
    categoriesContainer.appendChild(loadingGrid);

    root.appendChild(categoriesContainer);

    // Fetch categories
    const response = await Api.getCategories();
    const categories = extractItems(response);

    // Remove loading
    safeRemove(loadingGrid);

    if (categories.length > 0) {
      const grid = createEl('div', 'categories-grid categories-grid--full');

      categories.forEach(category => {
        const categoryCard = createEl('a', 'category-card category-card--large');
        categoryCard.href = `#/the-loai/${category.slug}`;
        categoryCard.innerHTML = `
          <div class="category-card__icon">${getCategoryIcon(category.slug)}</div>
          <div class="category-card__name">${category.name}</div>
          <div class="category-card__description">Khám phá phim ${category.name.toLowerCase()}</div>
        `;
        grid.appendChild(categoryCard);
      });

      categoriesContainer.appendChild(grid);
    } else {
      categoriesContainer.appendChild(createEl('p', 'empty-message', 'Không có thể loại nào'));
    }

    Logger.debug('Categories page rendered');

  } catch (error) {
    Logger.error('Categories page render failed:', error);
    root.appendChild(renderError('Không thể tải danh sách thể loại', () => renderAllCategories(root)));
  }
}

// Saved Movies Page Renderer
export async function renderSavedMovies(root) {
  try {
    root.innerHTML = '';

    const savedContainer = createEl('div', 'saved-movies-page');

    // Page header with actions
    const header = createEl('div', 'page-header page-header--with-actions');
    header.innerHTML = `
      <div class="page-header__content">
        <h1>Phim đã lưu</h1>
        <p class="page-header__subtitle">Danh sách phim yêu thích của bạn</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary sync-btn" title="Đồng bộ với Firebase">
          🔄 Đồng bộ
        </button>
        <button class="btn btn--danger clear-all-btn" title="Xóa tất cả">
          🗑️ Xóa tất cả
        </button>
      </div>
    `;
    savedContainer.appendChild(header);

    // Loading state
    const loadingState = createEl('div', 'saved-loading');
    loadingState.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Đang tải phim đã lưu...</div>
    `;
    savedContainer.appendChild(loadingState);

    root.appendChild(savedContainer);

    // Bind header actions
    bindSavedMoviesActions(header);

    // Load saved movies
    await loadSavedMovies(savedContainer, loadingState);

    Logger.debug('Saved movies page rendered');

  } catch (error) {
    Logger.error('Saved movies page render failed:', error);
    root.appendChild(renderError('Không thể tải danh sách phim đã lưu', () => renderSavedMovies(root)));
  }
}

async function loadSavedMovies(container, loadingState) {
  try {
    // Check if Storage is available
    if (!window.Storage) {
      safeRemove(loadingState);
      container.appendChild(createEl('p', 'error-message', 'Hệ thống lưu trữ không khả dụng'));
      return;
    }

    // Get saved movies
    const savedMovies = await window.Storage.getSavedMovies();

    // Remove loading
    safeRemove(loadingState);

    if (savedMovies.length > 0) {
      // Stats
      const stats = createEl('div', 'saved-stats');
      stats.innerHTML = `
        <div class="saved-stats__item">
          <span class="saved-stats__number">${savedMovies.length}</span>
          <span class="saved-stats__label">Phim đã lưu</span>
        </div>
      `;
      container.appendChild(stats);

      // Movies grid
      const grid = listGrid(savedMovies, 'grid grid--saved');
      container.appendChild(grid);

    } else {
      // Empty state
      const emptyState = createEl('div', 'saved-empty');
      emptyState.innerHTML = `
        <div class="saved-empty__icon">💔</div>
        <div class="saved-empty__title">Chưa có phim nào được lưu</div>
        <div class="saved-empty__message">Hãy thêm những bộ phim yêu thích vào danh sách</div>
        <a href="#/" class="btn btn--primary">Khám phá phim</a>
      `;
      container.appendChild(emptyState);
    }

  } catch (error) {
    Logger.error('Load saved movies failed:', error);
    safeRemove(loadingState);
    container.appendChild(renderError('Không thể tải danh sách phim đã lưu', () => loadSavedMovies(container, loadingState)));
  }
}

function bindSavedMoviesActions(header) {
  // Sync button
  const syncBtn = header.querySelector('.sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.innerHTML = '🔄 Đang đồng bộ...';

      try {
        if (window.refreshSavedMoviesAfterSync) {
          await window.refreshSavedMoviesAfterSync();
          showNotification({
            message: '✅ Đồng bộ thành công',
            type: 'success'
          });
        }
      } catch (error) {
        Logger.error('Sync failed:', error);
        showNotification({
          message: '❌ Đồng bộ thất bại',
          type: 'error'
        });
      } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 Đồng bộ';
      }
    });
  }

  // Clear all button
  const clearBtn = header.querySelector('.clear-all-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn xóa tất cả phim đã lưu?')) return;

      clearBtn.disabled = true;
      clearBtn.innerHTML = '🗑️ Đang xóa...';

      try {
        if (window.Storage && window.Storage.clearSavedMovies) {
          await window.Storage.clearSavedMovies();
          showNotification({
            message: '✅ Đã xóa tất cả phim',
            type: 'success'
          });

          // Reload page
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        Logger.error('Clear all failed:', error);
        showNotification({
          message: '❌ Xóa thất bại',
          type: 'error'
        });
      } finally {
        clearBtn.disabled = false;
        clearBtn.innerHTML = '🗑️ Xóa tất cả';
      }
    });
  }
}
