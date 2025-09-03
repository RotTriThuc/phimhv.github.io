/* UI Components - Reusable UI elements and rendering functions */

import { Logger } from './logger.js';
import { createEl, safeRemove, formatTime, formatDate, sanitizeHtml } from './utils.js';
import { imageLoader } from './image-loader.js';

// Loading Components
export function renderLoadingCards(count = 12) {
  const container = createEl('div', 'grid grid--loading');
  
  for (let i = 0; i < count; i++) {
    const card = createEl('div', 'card card--loading');
    card.innerHTML = `
      <div class="card__image-skeleton"></div>
      <div class="card__content">
        <div class="card__title-skeleton"></div>
        <div class="card__meta-skeleton"></div>
      </div>
    `;
    container.appendChild(card);
  }
  
  return container;
}

export function renderLoadingSpinner(text = 'Đang tải...') {
  const spinner = createEl('div', 'loading-spinner');
  spinner.innerHTML = `
    <div class="spinner"></div>
    <div class="loading-text">${text}</div>
  `;
  return spinner;
}

// Error Components
export function renderError(message, retryCallback) {
  const errorEl = createEl('div', 'error-state');
  errorEl.innerHTML = `
    <div class="error-state__icon">⚠️</div>
    <div class="error-state__message">${message}</div>
    ${retryCallback ? '<button class="btn btn--primary error-state__retry">Thử lại</button>' : ''}
  `;
  
  if (retryCallback) {
    const retryBtn = errorEl.querySelector('.error-state__retry');
    retryBtn.addEventListener('click', retryCallback);
  }
  
  return errorEl;
}

// Header Components
export function sectionHeader(title, actionElement = null) {
  const header = createEl('div', 'section__header');
  const titleEl = createEl('h2', 'section__title', title);
  header.appendChild(titleEl);
  
  if (actionElement) {
    header.appendChild(actionElement);
  }
  
  return header;
}

// Movie Card Component
export function createMovieCard(movie) {
  if (!movie || !movie.slug) {
    Logger.warn('Invalid movie data for card:', movie);
    return createEl('div', 'card card--error', 'Dữ liệu phim không hợp lệ');
  }

  const card = createEl('article', 'card');
  
  // Check if movie is saved and has progress (async)
  let isSaved = false;
  let progress = null;

  try {
    // Async check for saved status and progress
    if (window.Storage) {
      window.Storage.isMovieSaved(movie.slug).then(saved => {
        isSaved = saved;
        if (saved) {
          card.classList.add('card--saved');
          const saveIcon = card.querySelector('.card__save-icon');
          if (saveIcon) {
            saveIcon.textContent = '❤️';
            saveIcon.classList.add('card__save-icon--saved');
          }
        }
      }).catch(error => {
        Logger.warn('Failed to check saved status:', error);
      });

      window.Storage.getWatchProgress(movie.slug).then(prog => {
        progress = prog;
        if (prog && prog.episodeName) {
          const progressEl = card.querySelector('.card__progress');
          if (progressEl) {
            progressEl.textContent = `Đã xem: ${prog.episodeName}`;
            progressEl.style.display = 'block';
          }
        }
      }).catch(error => {
        Logger.warn('Failed to get watch progress:', error);
      });
    }
  } catch (error) {
    Logger.warn('Error in async movie card setup:', error);
  }

  // Build card HTML
  const posterUrl = movie.poster_url || movie.thumb_url || '';
  const movieName = sanitizeHtml(movie.name || 'Không có tên');
  const originalName = movie.origin_name ? sanitizeHtml(movie.origin_name) : '';
  const year = movie.year || '';
  const quality = movie.quality || '';
  const lang = movie.lang || '';
  const episodeCurrent = movie.episode_current || '';

  card.innerHTML = `
    <div class="card__image-container">
      <img class="card__image" data-src="${posterUrl}" alt="${movieName}" loading="lazy">
      <div class="card__overlay">
        <button class="card__play-btn" aria-label="Xem phim">▶</button>
        <button class="card__save-btn" aria-label="Lưu phim">
          <span class="card__save-icon">🤍</span>
        </button>
      </div>
      ${quality ? `<div class="card__quality">${quality}</div>` : ''}
      ${episodeCurrent ? `<div class="card__episode">${episodeCurrent}</div>` : ''}
    </div>
    <div class="card__content">
      <h3 class="card__title">
        <a href="#/phim/${movie.slug}" class="card__link">${movieName}</a>
      </h3>
      ${originalName ? `<div class="card__original-name">${originalName}</div>` : ''}
      <div class="card__meta">
        ${year ? `<span class="card__year">${year}</span>` : ''}
        ${lang ? `<span class="card__lang">${lang}</span>` : ''}
      </div>
      <div class="card__progress" style="display: none;"></div>
    </div>
  `;

  // Setup image loading
  setupCardImageLoading(card, movie);

  // Setup card interactions
  setupCardInteractions(card, movie);

  return card;
}

// Setup image loading for card
function setupCardImageLoading(card, movie) {
  const imgEl = card.querySelector('.card__image');
  if (!imgEl || !movie.slug) {
    Logger.warn('No slug found for movie:', movie);
    return;
  }
  
  // Ensure DOM is fully ready before image loading
  requestAnimationFrame(() => {
    // Double-check element is still in DOM
    if (!document.contains(imgEl)) {
      Logger.warn('Image element removed from DOM before loading');
      return;
    }
    
    // Immediate load if likely to be visible
    try {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight + 300) {
        // Likely visible - load immediately
        imageLoader.loadImage(imgEl);
      } else {
        // Use intersection observer for below-fold images
        imageLoader.observe(imgEl);
      }
    } catch (error) {
      Logger.warn('Error in image loading setup:', error);
      // Fallback to intersection observer
      imageLoader.observe(imgEl);
    }
  });
}

// Setup card interactions
function setupCardInteractions(card, movie) {
  // Play button click
  const playBtn = card.querySelector('.card__play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.hash = `#/phim/${movie.slug}`;
    });
  }

  // Save button click
  const saveBtn = card.querySelector('.card__save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      saveBtn.disabled = true;
      
      try {
        if (typeof window.toggleSaveMovie === 'function') {
          await window.toggleSaveMovie(movie.slug);
          
          // Update UI immediately
          const saveIcon = card.querySelector('.card__save-icon');
          const isSaved = await window.Storage.isMovieSaved(movie.slug);
          
          if (isSaved) {
            card.classList.add('card--saved');
            saveIcon.textContent = '❤️';
            saveIcon.classList.add('card__save-icon--saved');
          } else {
            card.classList.remove('card--saved');
            saveIcon.textContent = '🤍';
            saveIcon.classList.remove('card__save-icon--saved');
          }
        }
      } catch (error) {
        Logger.error('Save/remove movie failed:', error);
        showNotification({
          message: 'Có lỗi xảy ra. Vui lòng thử lại.',
          timestamp: new Date().toISOString()
        });
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  // Card hover effects
  card.addEventListener('mouseenter', () => {
    // Preload image if not already loaded
    const img = card.querySelector('.card__image');
    if (img && !img.dataset.loaded) {
      imageLoader.loadImage(img);
    }
  });
}

// Grid Component
export function listGrid(items, className = 'grid') {
  const grid = createEl('div', className);
  
  if (!items || items.length === 0) {
    const emptyState = createEl('div', 'empty-state');
    emptyState.innerHTML = `
      <div class="empty-state__icon">📽️</div>
      <div class="empty-state__message">Không có phim nào</div>
    `;
    grid.appendChild(emptyState);
    return grid;
  }

  items.forEach(item => {
    const card = createMovieCard(item);
    grid.appendChild(card);
  });

  // Batch load visible images after grid is rendered
  requestAnimationFrame(() => {
    try {
      imageLoader.batchLoadVisible();
    } catch (error) {
      Logger.error('Image loading failed:', error);
    }
  });

  return grid;
}

// Pagination Component
export function createPagination(currentPage, totalPages, baseUrl) {
  if (totalPages <= 1) return createEl('div'); // Empty div if no pagination needed

  const pagination = createEl('nav', 'pagination');
  const list = createEl('ul', 'pagination__list');

  // Previous button
  if (currentPage > 1) {
    const prevItem = createEl('li', 'pagination__item');
    const prevLink = createEl('a', 'pagination__link', '‹ Trước');
    prevLink.href = `${baseUrl}&page=${currentPage - 1}`;
    prevItem.appendChild(prevLink);
    list.appendChild(prevItem);
  }

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    const firstItem = createEl('li', 'pagination__item');
    const firstLink = createEl('a', 'pagination__link', '1');
    firstLink.href = `${baseUrl}&page=1`;
    firstItem.appendChild(firstLink);
    list.appendChild(firstItem);

    if (startPage > 2) {
      const ellipsis = createEl('li', 'pagination__item pagination__item--ellipsis');
      ellipsis.textContent = '...';
      list.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const item = createEl('li', 'pagination__item');
    const link = createEl('a', 'pagination__link', i.toString());
    
    if (i === currentPage) {
      item.classList.add('pagination__item--current');
      link.setAttribute('aria-current', 'page');
    } else {
      link.href = `${baseUrl}&page=${i}`;
    }
    
    item.appendChild(link);
    list.appendChild(item);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = createEl('li', 'pagination__item pagination__item--ellipsis');
      ellipsis.textContent = '...';
      list.appendChild(ellipsis);
    }

    const lastItem = createEl('li', 'pagination__item');
    const lastLink = createEl('a', 'pagination__link', totalPages.toString());
    lastLink.href = `${baseUrl}&page=${totalPages}`;
    lastItem.appendChild(lastLink);
    list.appendChild(lastItem);
  }

  // Next button
  if (currentPage < totalPages) {
    const nextItem = createEl('li', 'pagination__item');
    const nextLink = createEl('a', 'pagination__link', 'Sau ›');
    nextLink.href = `${baseUrl}&page=${currentPage + 1}`;
    nextItem.appendChild(nextLink);
    list.appendChild(nextItem);
  }

  pagination.appendChild(list);
  return pagination;
}

// Search Form Component
export function createSearchForm(initialValues = {}) {
  const form = createEl('form', 'search-form');
  form.innerHTML = `
    <div class="search-form__row">
      <div class="search-form__field">
        <input type="text" name="keyword" placeholder="Tìm kiếm phim..." 
               value="${initialValues.keyword || ''}" class="search-form__input">
      </div>
      <div class="search-form__field">
        <button type="submit" class="btn btn--primary search-form__submit">Tìm kiếm</button>
      </div>
    </div>
    <div class="search-form__filters">
      <select name="category" class="search-form__select">
        <option value="">Tất cả thể loại</option>
      </select>
      <select name="country" class="search-form__select">
        <option value="">Tất cả quốc gia</option>
      </select>
      <select name="year" class="search-form__select">
        <option value="">Tất cả năm</option>
      </select>
      <select name="sort_field" class="search-form__select">
        <option value="modified.time">Mới cập nhật</option>
        <option value="created.time">Mới thêm</option>
        <option value="view">Lượt xem</option>
      </select>
    </div>
  `;
  
  return form;
}

// Modal Component
export function createModal(title, content) {
  const modal = createEl('div', 'modal');
  modal.innerHTML = `
    <div class="modal__backdrop"></div>
    <div class="modal__container">
      <div class="modal__header">
        <h2 class="modal__title">${title}</h2>
        <button class="modal__close" aria-label="Đóng">×</button>
      </div>
      <div class="modal__content">
        ${content}
      </div>
    </div>
  `;
  
  // Close handlers
  const closeBtn = modal.querySelector('.modal__close');
  const backdrop = modal.querySelector('.modal__backdrop');
  
  const closeModal = () => {
    modal.classList.add('modal--closing');
    setTimeout(() => modal.remove(), 300);
  };
  
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  
  // ESC key handler
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  return modal;
}
