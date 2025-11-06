/**
 * Current Episode Helper
 * Helper functions để hiển thị badge "Đang xem tập X" trên movie cards
 */

/**
 * Thêm badge "Đang xem tập X" vào movie card
 * @param {HTMLElement} movieCard - Movie card element
 * @param {Object} movieData - Movie data với currentEpisode info
 */
export function addCurrentEpisodeBadge(movieCard, movieData) {
  if (!movieCard || !movieData) return;
  
  // Remove existing badge if any
  const existingBadge = movieCard.querySelector('.current-episode-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  // Only show badge if there's episode info
  if (!movieData.currentEpisode || !movieData.currentEpisodeName) {
    return;
  }
  
  // Create badge element
  const badge = document.createElement('div');
  badge.className = 'current-episode-badge';
  badge.innerHTML = `
    <span class="badge-icon">▶️</span>
    <span class="badge-text">${movieData.currentEpisodeName}</span>
  `;
  
  // Add CSS if not already added
  if (!document.querySelector('#current-episode-badge-styles')) {
    addBadgeStyles();
  }
  
  // Insert badge (vị trí tùy thuộc vào cấu trúc movie card)
  const posterContainer = movieCard.querySelector('.movie-poster, .poster, .thumb, .movie-thumb');
  if (posterContainer) {
    posterContainer.style.position = 'relative';
    posterContainer.appendChild(badge);
  } else {
    movieCard.style.position = 'relative';
    movieCard.appendChild(badge);
  }
}

/**
 * Add CSS styles for episode badge
 */
function addBadgeStyles() {
  const style = document.createElement('style');
  style.id = 'current-episode-badge-styles';
  style.textContent = `
    .current-episode-badge {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: linear-gradient(135deg, rgba(108, 92, 231, 0.95), rgba(139, 124, 231, 0.95));
      backdrop-filter: blur(10px);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 4px 15px rgba(108, 92, 231, 0.4);
      z-index: 10;
      animation: badge-pulse 2s ease-in-out infinite;
    }
    
    .current-episode-badge .badge-icon {
      font-size: 10px;
      animation: badge-icon-pulse 1.5s ease-in-out infinite;
    }
    
    .current-episode-badge .badge-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }
    
    @keyframes badge-pulse {
      0%, 100% {
        box-shadow: 0 4px 15px rgba(108, 92, 231, 0.4);
      }
      50% {
        box-shadow: 0 4px 20px rgba(108, 92, 231, 0.6);
      }
    }
    
    @keyframes badge-icon-pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
      }
    }
    
    /* Hover effect */
    .movie-card:hover .current-episode-badge {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(108, 92, 231, 0.6);
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .current-episode-badge {
        font-size: 11px;
        padding: 5px 10px;
        bottom: 8px;
        left: 8px;
      }
      
      .current-episode-badge .badge-text {
        max-width: 100px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Lấy text hiển thị cho episode badge
 * @param {Object} movieData - Movie data
 * @returns {string} Episode text
 */
export function getEpisodeBadgeText(movieData) {
  if (!movieData.currentEpisodeName) return '';
  
  // Shorten long episode names
  const name = movieData.currentEpisodeName;
  if (name.length > 15) {
    return name.substring(0, 12) + '...';
  }
  
  return name;
}

/**
 * Update all movie cards với episode badges
 * @param {string} containerSelector - Selector for container with movie cards
 */
export async function updateAllMovieCardsWithEpisodes(containerSelector = '.movie-list, .movies-grid') {
  if (!window.movieComments) {
    console.warn('Firebase not initialized');
    return;
  }
  
  try {
    // Get all saved movies from Firebase
    const savedMovies = await window.movieComments.getSavedMovies();
    
    // Create a map for quick lookup
    const moviesMap = new Map();
    savedMovies.forEach(movie => {
      moviesMap.set(movie.slug, movie);
    });
    
    // Find all movie cards
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const movieCards = container.querySelectorAll('.movie-card, .movie-item, .film-item');
    
    movieCards.forEach(card => {
      // Get movie slug from card (adjust selector based on your HTML structure)
      const link = card.querySelector('a[href*="/phim/"], a[href*="/watch/"]');
      if (!link) return;
      
      // Extract slug from URL
      const href = link.getAttribute('href');
      const slugMatch = href.match(/\/(phim|watch)\/([^/]+)/);
      if (!slugMatch) return;
      
      const slug = slugMatch[2];
      const movieData = moviesMap.get(slug);
      
      if (movieData && movieData.currentEpisode) {
        addCurrentEpisodeBadge(card, movieData);
      }
    });
    
  } catch (error) {
    console.error('Failed to update movie cards with episodes:', error);
  }
}

/**
 * Initialize episode badges cho một trang cụ thể
 * Auto-refresh mỗi 30 giây
 */
export function initEpisodeBadges(containerSelector = '.movie-list, .movies-grid', autoRefresh = true) {
  // Initial update
  updateAllMovieCardsWithEpisodes(containerSelector);
  
  // Auto-refresh nếu được bật
  if (autoRefresh) {
    setInterval(() => {
      updateAllMovieCardsWithEpisodes(containerSelector);
    }, 30000); // 30 seconds
  }
  
  // Listen for Firebase changes (real-time updates)
  if (window.movieComments && window.movieComments.db) {
    // TODO: Implement real-time listener
  }
}

export default {
  addCurrentEpisodeBadge,
  getEpisodeBadgeText,
  updateAllMovieCardsWithEpisodes,
  initEpisodeBadges
};
