/**
 * Episode Highlighter Module
 * Đánh dấu màu tập phim đang xem trong trang chi tiết phim
 */

import { Logger } from './logger.js';

/**
 * Highlight tập đang xem trong danh sách episodes
 * @param {string} movieSlug - Slug của phim
 * @param {string} episodeContainerSelector - Selector của container chứa episodes
 * @param {Object} options - Options tùy chỉnh
 */
export async function highlightCurrentEpisode(
  movieSlug, 
  episodeContainerSelector = '.episode-list, .episodes, .server-data',
  options = {}
) {
  if (!window.movieComments) {
    Logger.warn('Firebase not initialized');
    return null;
  }

  const defaultOptions = {
    activeClass: 'episode-watching',
    scrollToEpisode: true,
    showBadge: true,
    ...options
  };

  try {
    // Lấy thông tin tập đang xem từ Firebase
    const watchProgress = await window.movieComments.getWatchProgress(movieSlug);
    
    if (!watchProgress || !watchProgress.episodeSlug) {
      Logger.debug('No watch progress found for:', movieSlug);
      return null;
    }

    const currentEpisodeSlug = watchProgress.episodeSlug;
    Logger.info('🎯 Found current episode:', watchProgress.episodeName);

    // Tìm container episodes
    const container = document.querySelector(episodeContainerSelector);
    if (!container) {
      Logger.warn('Episode container not found:', episodeContainerSelector);
      return null;
    }

    // Add CSS styles nếu chưa có
    if (!document.querySelector('#episode-highlighter-styles')) {
      addHighlighterStyles();
    }

    // Tìm tất cả episode buttons/links
    const episodeElements = container.querySelectorAll(
      'a[href*="/watch/"], button[data-episode], .episode-item, .episode-btn, [data-slug]'
    );

    let highlightedElement = null;

    episodeElements.forEach(element => {
      // Remove existing highlight
      element.classList.remove(defaultOptions.activeClass);
      
      // Remove existing badge
      const existingBadge = element.querySelector('.watching-badge');
      if (existingBadge) {
        existingBadge.remove();
      }

      // Check if this is the current episode
      const isCurrentEpisode = checkIfCurrentEpisode(element, currentEpisodeSlug);

      if (isCurrentEpisode) {
        // Add highlight class
        element.classList.add(defaultOptions.activeClass);
        
        // Add badge if enabled
        if (defaultOptions.showBadge) {
          addWatchingBadge(element, watchProgress);
        }

        highlightedElement = element;
        Logger.info('✅ Highlighted episode:', watchProgress.episodeName);
      }
    });

    // Scroll to highlighted episode
    if (highlightedElement && defaultOptions.scrollToEpisode) {
      scrollToElement(highlightedElement);
    }

    return {
      episodeSlug: currentEpisodeSlug,
      episodeName: watchProgress.episodeName,
      element: highlightedElement,
      progress: watchProgress.progress
    };

  } catch (error) {
    Logger.error('❌ Failed to highlight episode:', error);
    return null;
  }
}

/**
 * Check if element is the current episode
 */
function checkIfCurrentEpisode(element, episodeSlug) {
  // Method 1: Check data-slug attribute
  if (element.dataset.slug === episodeSlug) {
    return true;
  }

  // Method 2: Check data-episode attribute
  if (element.dataset.episode === episodeSlug) {
    return true;
  }

  // Method 3: Check href URL
  const href = element.getAttribute('href');
  if (href) {
    // Check if href contains episode slug
    if (href.includes(episodeSlug)) {
      return true;
    }

    // Check if href ends with episode slug
    const urlParts = href.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart === episodeSlug || lastPart.includes(episodeSlug)) {
      return true;
    }
  }

  // Method 4: Check text content (for "Tập 3" format)
  const text = element.textContent.trim();
  const episodeNumber = episodeSlug.match(/\d+/);
  if (episodeNumber && text.includes(episodeNumber[0])) {
    // Additional validation: make sure it's episode text
    if (text.includes('Tập') || text.includes('Episode') || text.includes('Ep')) {
      return true;
    }
  }

  return false;
}

/**
 * Add watching badge to episode element
 */
function addWatchingBadge(element, watchProgress) {
  const badge = document.createElement('span');
  badge.className = 'watching-badge';
  
  // Calculate progress percentage
  const progressPercent = Math.floor((watchProgress.progress || 0) * 100);
  
  if (progressPercent > 0 && progressPercent < 90) {
    // Đang xem dở
    badge.innerHTML = `<span class="badge-icon">▶️</span> ${progressPercent}%`;
  } else if (progressPercent >= 90) {
    // Đã xem xong
    badge.innerHTML = `<span class="badge-icon">✓</span> Đã xem`;
    badge.classList.add('watched');
  } else {
    // Chưa xem hoặc mới bắt đầu
    badge.innerHTML = `<span class="badge-icon">▶️</span> Đang xem`;
  }

  // Insert badge based on element structure
  if (element.querySelector('.episode-number, .episode-name')) {
    element.appendChild(badge);
  } else {
    element.style.position = 'relative';
    element.appendChild(badge);
  }
}

/**
 * Scroll to element smoothly
 */
function scrollToElement(element) {
  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }, 300);
}

/**
 * Add CSS styles for highlighting
 */
function addHighlighterStyles() {
  const style = document.createElement('style');
  style.id = 'episode-highlighter-styles';
  style.textContent = `
    /* Highlight style for current episode */
    .episode-watching {
      background: linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(139, 124, 231, 0.2)) !important;
      border: 2px solid #6c5ce7 !important;
      box-shadow: 0 0 15px rgba(108, 92, 231, 0.3) !important;
      position: relative;
      animation: episode-pulse 2s ease-in-out infinite;
    }

    /* Watching badge */
    .watching-badge {
      position: absolute;
      top: 5px;
      right: 5px;
      background: linear-gradient(135deg, #6c5ce7, #8b7ce7);
      color: white;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 3px;
      z-index: 10;
      box-shadow: 0 2px 8px rgba(108, 92, 231, 0.4);
      white-space: nowrap;
    }

    .watching-badge.watched {
      background: linear-gradient(135deg, #00b894, #00d2a0);
    }

    .watching-badge .badge-icon {
      font-size: 9px;
    }

    /* Pulse animation */
    @keyframes episode-pulse {
      0%, 100% {
        box-shadow: 0 0 15px rgba(108, 92, 231, 0.3);
        border-color: #6c5ce7;
      }
      50% {
        box-shadow: 0 0 25px rgba(108, 92, 231, 0.5);
        border-color: #8b7ce7;
      }
    }

    /* Hover effect */
    .episode-watching:hover {
      background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(139, 124, 231, 0.3)) !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4) !important;
    }

    /* Styles for different episode button layouts */
    .episode-watching a,
    .episode-watching button {
      color: #6c5ce7 !important;
      font-weight: 600;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .watching-badge {
        font-size: 9px;
        padding: 2px 6px;
        top: 3px;
        right: 3px;
      }

      .episode-watching {
        border-width: 1.5px !important;
      }
    }

    /* Progress bar (optional - inside episode button) */
    .episode-watching::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #6c5ce7, #8b7ce7);
      width: var(--progress, 0%);
      border-radius: 0 0 4px 4px;
      transition: width 0.3s ease;
    }
  `;

  document.head.appendChild(style);
}

/**
 * Set progress bar width for highlighted episode
 */
export function setEpisodeProgress(element, progress) {
  if (!element) return;
  
  const progressPercent = Math.floor(progress * 100);
  element.style.setProperty('--progress', `${progressPercent}%`);
}

/**
 * Auto-highlight on page load
 * Call this function when movie detail page loads
 */
export async function initEpisodeHighlighter(movieSlug, options = {}) {
  if (!movieSlug) {
    Logger.warn('Movie slug not provided');
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      highlightCurrentEpisode(movieSlug, undefined, options);
    });
  } else {
    // DOM already loaded
    await highlightCurrentEpisode(movieSlug, undefined, options);
  }

  Logger.info('📺 Episode highlighter initialized for:', movieSlug);
}

/**
 * Update highlight when episode changes
 * Call this after switching to new episode
 */
export async function updateEpisodeHighlight(movieSlug, newEpisodeSlug) {
  if (!window.movieComments) return;

  try {
    // Get current watch progress
    const progress = await window.movieComments.getWatchProgress(movieSlug);
    
    if (progress && progress.episodeSlug === newEpisodeSlug) {
      // Re-highlight
      await highlightCurrentEpisode(movieSlug);
    }
  } catch (error) {
    Logger.error('Failed to update highlight:', error);
  }
}

/**
 * Helper: Get current episode info from Firebase
 */
export async function getCurrentEpisodeInfo(movieSlug) {
  if (!window.movieComments) return null;

  try {
    const progress = await window.movieComments.getWatchProgress(movieSlug);
    return progress ? {
      episodeSlug: progress.episodeSlug,
      episodeName: progress.episodeName,
      progress: progress.progress,
      currentTime: progress.currentTime,
      duration: progress.duration
    } : null;
  } catch (error) {
    Logger.error('Failed to get episode info:', error);
    return null;
  }
}

export default {
  highlightCurrentEpisode,
  initEpisodeHighlighter,
  updateEpisodeHighlight,
  getCurrentEpisodeInfo,
  setEpisodeProgress
};
