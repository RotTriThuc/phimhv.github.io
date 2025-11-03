/**
 * Series Navigator Module
 * Tính năng liên kết giữa các phần của cùng một bộ phim
 * 
 * Chức năng:
 * - Nhận diện và nhóm các phần phim cùng series
 * - Tạo UI navigator để chuyển đổi giữa các phần
 * - Tích hợp vào trang chi tiết và xem phim
 */

// Import functions from main app
// Note: These will be available globally when the module is imported

console.log('🚀 Series Navigator Module Loading...');

/**
 * MANUAL/HARDCODED Season Number Extractor
 * Directly extracts season numbers using simple string operations
 * @param {Object} movie - Movie object
 * @returns {Object|null} Series info hoặc null nếu không phải series
 */
export function getSeriesBaseInfo(movie) {
  if (!movie || !movie.name) {
    console.log('❌ MANUAL: Invalid movie or name:', movie);
    return null;
  }

  const movieName = movie.name.trim();
  console.log('🔧 MANUAL: Processing movie name:', movieName);

  // HARDCODED REGEX PATTERNS - Tested and explicit
  const patterns = [
    // Pattern 1: "Tên Phim (Phần X)"
    /^(.+?)\s*\(\s*Phần\s*(\d+)\s*\)$/i,
    // Pattern 2: "Tên Phim (Season X)"
    /^(.+?)\s*\(\s*Season\s*(\d+)\s*\)$/i,
    // Pattern 3: "Tên Phim - Phần X"
    /^(.+?)\s*-\s*Phần\s*(\d+)$/i,
    // Pattern 4: "Tên Phim - Season X"
    /^(.+?)\s*-\s*Season\s*(\d+)$/i
  ];

  // Try each pattern manually
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = movieName.match(pattern);

    console.log(`🎯 MANUAL: Pattern ${i + 1} test:`, {
      pattern: pattern.toString(),
      match: match
    });

    if (match && match.length >= 3) {
      const baseName = match[1].trim();
      const seasonNumber = parseInt(match[2]);

      // Create completely new object with no references
      const result = {
        seriesId: baseName + '_SERIES', // Unique identifier
        season: seasonNumber,
        method: 'manual_pattern_' + (i + 1),
        baseName: baseName,
        // Add timestamp to ensure uniqueness
        _timestamp: Date.now(),
        _movieSlug: movie.slug
      };

      console.log('✅ MANUAL: Success with pattern', i + 1, ':', result);
      return result;
    }
  }

  // FALLBACK: Check origin_name with manual approach
  if (movie.origin_name) {
    console.log('🌐 MANUAL: Checking origin_name:', movie.origin_name);

    const originPatterns = [
      /^(.+?)\s*\(\s*Season\s*(\d+)\s*\)$/i,
      /^(.+?)\s*Season\s*(\d+)$/i
    ];

    for (let i = 0; i < originPatterns.length; i++) {
      const match = movie.origin_name.match(originPatterns[i]);
      if (match && match.length >= 3) {
        const result = {
          seriesId: match[1].trim() + '_ORIGIN_SERIES',
          season: parseInt(match[2]),
          method: 'manual_origin_' + (i + 1),
          baseName: match[1].trim(),
          _timestamp: Date.now(),
          _movieSlug: movie.slug
        };

        console.log('✅ MANUAL: Origin success:', result);
        return result;
      }
    }
  }

  console.log('❌ MANUAL: No pattern matched for:', movieName);
  return null;
}

/**
 * Tìm các phần liên quan của cùng series
 * @param {Object} currentMovie - Movie hiện tại
 * @param {Object} api - Api instance
 * @param {Function} extractItems - Function to extract items from API response
 * @returns {Array} Danh sách các phần liên quan, đã sắp xếp theo season
 */
export async function findRelatedSeasons(currentMovie, api = null, extractItems = null) {
  const seriesInfo = getSeriesBaseInfo(currentMovie);
  if (!seriesInfo) {
    console.debug('Movie is not part of a series:', currentMovie.name);
    return [];
  }

  console.debug('Finding related seasons for:', seriesInfo);

  try {
    // Tìm kiếm bằng tên series
    const searchKeyword = seriesInfo.baseName;

    // Use passed dependencies or fallback to window globals
    const apiInstance = api || window.Api;
    const extractItemsFunc = extractItems || window.extractItems;

    if (!apiInstance || !extractItemsFunc) {
      console.warn('Api or extractItems not available');
      return [];
    }

    const searchData = await apiInstance.search({
      keyword: searchKeyword,
      limit: 50 // Tăng limit để tìm đủ các phần
    });

    const items = extractItemsFunc(searchData);
    if (!items || items.length === 0) {
      console.debug('No search results found for:', searchKeyword);
      return [];
    }

    // Lọc và phân tích các kết quả
    console.log('🔍 Starting to analyze', items.length, 'movies for series:', searchKeyword);

    // MANUAL APPROACH: Process each movie individually with no shared references
    const relatedSeasons = [];

    for (let i = 0; i < items.length; i++) {
      const movie = items[i];
      console.log(`🔧 MANUAL: Processing movie ${i + 1}/${items.length}:`, movie.name);

      // Get series info using manual approach
      const seriesInfo = getSeriesBaseInfo(movie);

      if (seriesInfo) {
        // Create completely isolated object with manual property assignment
        const isolatedMovie = {
          // Copy basic movie properties manually
          name: movie.name,
          slug: movie.slug,
          origin_name: movie.origin_name,
          year: movie.year,
          episode_current: movie.episode_current,
          poster_url: movie.poster_url,

          // Create completely new seriesInfo object with manual assignment
          seriesInfo: {
            seriesId: String(seriesInfo.seriesId), // Force string conversion
            season: Number(seriesInfo.season),     // Force number conversion
            method: String(seriesInfo.method),
            baseName: String(seriesInfo.baseName),
            _uniqueId: `${movie.slug}_${seriesInfo.season}_${Date.now()}_${Math.random()}` // Unique ID
          }
        };

        console.log(`✅ MANUAL: Created isolated object for ${movie.name}:`, {
          name: isolatedMovie.name,
          seasonNumber: isolatedMovie.seriesInfo.season,
          uniqueId: isolatedMovie.seriesInfo._uniqueId
        });

        relatedSeasons.push(isolatedMovie);
      } else {
        console.log(`❌ MANUAL: No series info for ${movie.name}`);
      }
    }

    console.log(`🎬 MANUAL: Total processed movies: ${relatedSeasons.length}`);

    // MANUAL FILTERING: Compare base names directly
    const currentSeriesInfo = getSeriesBaseInfo(currentMovie);
    if (!currentSeriesInfo) {
      console.log('❌ MANUAL: Current movie has no series info');
      return [];
    }

    console.log('🔍 MANUAL: Current series info:', currentSeriesInfo);

    const filteredSeasons = [];
    for (let i = 0; i < relatedSeasons.length; i++) {
      const movie = relatedSeasons[i];

      // MANUAL COMPARISON: Direct string comparison of base names
      const currentBaseName = currentSeriesInfo.baseName.toLowerCase().trim();
      const movieBaseName = movie.seriesInfo.baseName.toLowerCase().trim();

      console.log(`🔍 MANUAL: Comparing "${currentBaseName}" vs "${movieBaseName}"`);

      if (currentBaseName === movieBaseName) {
        console.log(`✅ MANUAL: Match found for ${movie.name} (Season ${movie.seriesInfo.season})`);
        filteredSeasons.push(movie);
      } else {
        console.log(`❌ MANUAL: No match for ${movie.name}`);
      }
    }

    // MANUAL SORTING: Sort by season number
    filteredSeasons.sort((a, b) => {
      const seasonA = Number(a.seriesInfo.season);
      const seasonB = Number(b.seriesInfo.season);
      console.log(`🔢 MANUAL: Sorting ${a.name} (${seasonA}) vs ${b.name} (${seasonB})`);
      return seasonA - seasonB;
    });

    console.log(`🎬 MANUAL: Final filtered seasons: ${filteredSeasons.length}`);
    filteredSeasons.forEach((season, index) => {
      console.log(`📋 MANUAL: Season ${index + 1}: ${season.name} (Phần ${season.seriesInfo.season})`);
    });

    return filteredSeasons;

  } catch (error) {
    console.error('Error finding related seasons:', error);
    return [];
  }
}

/**
 * Tạo UI component navigator cho series
 * @param {Object} currentMovie - Movie hiện tại
 * @param {Array} relatedSeasons - Danh sách các phần liên quan
 * @param {Function} createEl - Function to create DOM elements
 * @returns {HTMLElement|null} Navigator element hoặc null nếu chỉ có 1 phần
 */
export function createSeriesNavigator(currentMovie, relatedSeasons, createEl = null) {
  // Chỉ hiển thị khi có từ 2 phần trở lên
  if (!relatedSeasons || relatedSeasons.length <= 1) {
    console.debug('Not enough seasons to show navigator');
    return null;
  }

  // Use passed createEl or fallback to window global
  const createElement = createEl || window.createEl;
  if (!createElement) {
    console.warn('createEl function not available');
    return null;
  }

  const navigator = createElement('div', 'series-navigator');

  // Header với title và refresh button
  const header = createElement('div', 'series-navigator__header');

  // Title
  const title = createElement('h3', 'series-navigator__title', '🎬 Các phần trong series');
  header.appendChild(title);

  // Refresh button
  const refreshBtn = createElement('button', 'series-navigator__refresh-btn', '🔄');
  refreshBtn.title = 'Kiểm tra phần mới';
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⏳';

    try {
      // Force refresh related seasons
      const api = window.Api;
      const extractItems = window.extractItems;
      const newSeasons = await getCachedRelatedSeasons(currentMovie, api, extractItems, true);

      // Re-render navigator
      const newNavigator = createSeriesNavigator(currentMovie, newSeasons, createElement);
      if (newNavigator && navigator.parentNode) {
        navigator.parentNode.replaceChild(newNavigator, navigator);
      }

      // Show notification
      if (window.showNotification) {
        window.showNotification({
          message: '✅ Đã cập nhật danh sách phần phim',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error refreshing series:', error);
      if (window.showNotification) {
        window.showNotification({
          message: '❌ Lỗi khi cập nhật: ' + error.message,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄';
    }
  });

  header.appendChild(refreshBtn);
  navigator.appendChild(header);

  // Series name
  const currentSeriesInfo = getSeriesBaseInfo(currentMovie);
  if (currentSeriesInfo?.baseName) {
    const seriesName = createElement('div', 'series-navigator__series-name', currentSeriesInfo.baseName);
    navigator.appendChild(seriesName);
  }

  // List container
  const list = createElement('div', 'series-navigator__list');
  
  console.log('🎬 Creating navigator with', relatedSeasons.length, 'seasons');

  // MANUAL UI RENDERING: Process each season individually
  for (let i = 0; i < relatedSeasons.length; i++) {
    const season = relatedSeasons[i];

    // MANUAL SEASON NUMBER EXTRACTION: Direct from object
    const seasonNum = Number(season.seriesInfo.season);
    const movieName = String(season.name);
    const movieSlug = String(season.slug);

    console.log(`🎭 MANUAL RENDER ${i + 1}/${relatedSeasons.length}:`, {
      name: movieName,
      seasonNumber: seasonNum,
      slug: movieSlug,
      uniqueId: season.seriesInfo._uniqueId
    });

    // Create UI elements manually
    const item = createElement('div', 'series-navigator__item');
    const isCurrent = movieSlug === currentMovie.slug;

    if (isCurrent) {
      item.classList.add('series-navigator__item--current');
      console.log(`🎯 MANUAL: Marking ${movieName} as current`);
    }

    // Link element
    const link = createElement('a', 'series-navigator__link');
    link.href = `#/phim/${movieSlug}`;

    // MANUAL SEASON NUMBER DISPLAY: Direct string creation
    const seasonNumber = createElement('div', 'series-navigator__season');
    const seasonText = `Phần ${seasonNum}`;
    seasonNumber.textContent = seasonText;

    console.log(`🏷️ MANUAL: Setting text "${seasonText}" for ${movieName}`);

    link.appendChild(seasonNumber);

    // Episode info
    if (season.episode_current) {
      const episodeInfo = createElement('div', 'series-navigator__episode');
      episodeInfo.textContent = season.episode_current;
      link.appendChild(episodeInfo);
    }

    // Year info
    if (season.year) {
      const yearInfo = createElement('div', 'series-navigator__year');
      yearInfo.textContent = season.year;
      link.appendChild(yearInfo);
    }

    // Current indicator
    if (isCurrent) {
      const currentIndicator = createElement('div', 'series-navigator__current-indicator');
      currentIndicator.textContent = '● Đang xem';
      link.appendChild(currentIndicator);
    }
    
    item.appendChild(link);
    list.appendChild(item);
  }

  navigator.appendChild(list);

  console.debug('Created series navigator with', relatedSeasons.length, 'seasons');
  return navigator;
}

/**
 * Tạo navigator cho trang xem phim (compact version)
 * @param {Object} currentMovie - Movie hiện tại
 * @param {Array} relatedSeasons - Danh sách các phần liên quan
 * @param {Function} createEl - Function to create DOM elements
 * @returns {HTMLElement|null} Navigator element hoặc null
 */
export function createWatchSeriesNavigator(currentMovie, relatedSeasons, createEl = null) {
  if (!relatedSeasons || relatedSeasons.length <= 1) return null;

  // Use passed createEl or fallback to window global
  const createElement = createEl || window.createEl;
  if (!createElement) {
    console.warn('createEl function not available for watch navigator');
    return null;
  }

  const navigator = createElement('div', 'watch-series-navigator');

  const title = createElement('div', 'watch-series-navigator__title', 'Các phần khác:');
  navigator.appendChild(title);

  const list = createElement('div', 'watch-series-navigator__list');
  
  relatedSeasons.forEach(season => {
    const isCurrent = season.slug === currentMovie.slug;
    if (isCurrent) return; // Không hiển thị phần hiện tại trong watch page

    const item = createElement('a', 'watch-series-navigator__item');
    item.href = `#/phim/${season.slug}`;
    item.textContent = `Phần ${season.seriesInfo.season}`;

    if (season.episode_current) {
      item.title = `${season.name} - ${season.episode_current}`;
    }

    list.appendChild(item);
  });
  
  if (list.children.length > 0) {
    navigator.appendChild(list);
    return navigator;
  }
  
  return null;
}

/**
 * Cache cho related seasons để tránh gọi API nhiều lần
 */
const relatedSeasonsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Enhanced cache với smart invalidation
 * @param {string} cacheKey - Cache key
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Object|null} Cached data hoặc null
 */
function getSmartCache(cacheKey, forceRefresh = false) {
  if (forceRefresh) {
    relatedSeasonsCache.delete(cacheKey);
    return null;
  }

  const cached = relatedSeasonsCache.get(cacheKey);
  if (!cached) return null;

  // Check cache expiry
  if (Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }

  // Cache expired
  relatedSeasonsCache.delete(cacheKey);
  return null;
}

/**
 * Lấy related seasons với caching và auto-update support
 * @param {Object} currentMovie - Movie hiện tại
 * @param {Object} api - Api instance
 * @param {Function} extractItems - Function to extract items from API response
 * @param {boolean} forceRefresh - Force refresh từ API
 * @returns {Array} Cached hoặc fresh data
 */
export async function getCachedRelatedSeasons(currentMovie, api = null, extractItems = null, forceRefresh = false) {
  console.log('🚀 getCachedRelatedSeasons called for:', currentMovie.name, forceRefresh ? '(force refresh)' : '');

  const cacheKey = currentMovie.slug;
  const cached = getSmartCache(cacheKey, forceRefresh);

  if (cached && !forceRefresh) {
    console.log('💾 Using cached related seasons for:', currentMovie.name);
    return cached.data;
  }

  const relatedSeasons = await findRelatedSeasons(currentMovie, api, extractItems);
  relatedSeasonsCache.set(cacheKey, {
    data: relatedSeasons,
    timestamp: Date.now()
  });

  // Auto-track series nếu có Series Update Manager
  try {
    const seriesInfo = getSeriesBaseInfo(currentMovie);
    if (seriesInfo && window.seriesUpdateManager) {
      window.seriesUpdateManager.trackSeries(seriesInfo, currentMovie, async (newSeasons) => {
        // Callback khi có update - invalidate cache
        console.log('🔄 Series updated, invalidating cache for:', currentMovie.name);
        relatedSeasonsCache.delete(cacheKey);

        // Trigger UI update event
        const event = new CustomEvent('seriesNavigatorUpdate', {
          detail: { currentMovie, newSeasons }
        });
        window.dispatchEvent(event);
      });
    }
  } catch (error) {
    console.warn('Could not setup auto-tracking:', error);
  }

  return relatedSeasons;
}
