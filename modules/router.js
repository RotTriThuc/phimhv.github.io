/* Router Module - Handle navigation and routing */

import { Logger } from './logger.js';
import { parseHash } from './utils.js';
import { imageLoader } from './image-loader.js';

// Import page renderers (these will be defined in pages module)
let pageRenderers = {};

// Router state
let isRouting = false;

// Route definitions
const routes = [
  { path: '/', handler: 'renderHome' },
  { path: '/tim-kiem', handler: 'renderSearch' },
  { path: '/loc', handler: 'renderCombinedFilter' },
  { path: '/the-loai', handler: 'renderAllCategories' },
  { path: '/phim-da-luu', handler: 'renderSavedMovies' },
  { path: '/the-loai/:slug', handler: 'renderCombinedFilter' },
  { path: '/quoc-gia/:slug', handler: 'renderCombinedFilter' },
  { path: '/nam/:year', handler: 'renderCombinedFilter' },
  { path: '/phim/:slug', handler: 'renderDetail' },
  { path: '/xem/:slug', handler: 'renderWatch' }
];

// Register page renderers
export function registerPageRenderers(renderers) {
  pageRenderers = { ...pageRenderers, ...renderers };
  Logger.debug('Registered page renderers:', Object.keys(renderers));
}

// Route matching utility
function matchRoute(path) {
  for (const route of routes) {
    const routePattern = route.path.replace(/:[^/]+/g, '([^/]+)');
    const regex = new RegExp(`^${routePattern}$`);
    const match = path.match(regex);

    if (match) {
      const params = {};
      const paramNames = route.path.match(/:[^/]+/g) || [];

      paramNames.forEach((paramName, index) => {
        const cleanParamName = paramName.slice(1); // Remove ':'
        params[cleanParamName] = decodeURIComponent(match[index + 1]);
      });

      return {
        handler: route.handler,
        params
      };
    }
  }

  return null;
}

// Smart scroll management
function handleScrollOnNavigation() {
  const currentScrollY = window.scrollY;
  if (currentScrollY > 100) {
    // Use smooth scroll for small distances, instant for large distances
    const scrollBehavior = currentScrollY > 800 ? 'instant' : 'smooth';
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: scrollBehavior
    });
  }
}

// Cleanup on navigation
function cleanupOnNavigation() {
  // Clean up old preload links on page navigation
  if (imageLoader && imageLoader.cleanupPreloadLinks) {
    imageLoader.cleanupPreloadLinks();
  }

  // Clear any existing timers or intervals
  // This can be extended as needed
}

// Main router function
export async function router() {
  if (isRouting) {
    Logger.debug('Router already running, skipping...');
    return;
  }

  isRouting = true;

  try {
    // Handle scroll and cleanup
    handleScrollOnNavigation();
    cleanupOnNavigation();

    const root = document.getElementById('app');
    const { path, params } = parseHash();

    if (!root) {
      Logger.error('App root element not found');
      isRouting = false;
      return;
    }

    Logger.debug(
      'Routing to:',
      path,
      'with params:',
      Object.fromEntries(params)
    );

    // Handle root path
    if (path === '/' || path === '') {
      if (pageRenderers.renderHome) {
        await pageRenderers.renderHome(root);
      } else {
        Logger.error('renderHome not registered');
        root.textContent = 'Trang chủ không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle search
    if (path.startsWith('/tim-kiem')) {
      if (pageRenderers.renderSearch) {
        await pageRenderers.renderSearch(root, params);
      } else {
        Logger.error('renderSearch not registered');
        root.textContent = 'Trang tìm kiếm không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle filter
    if (path.startsWith('/loc')) {
      if (pageRenderers.renderCombinedFilter) {
        await pageRenderers.renderCombinedFilter(root, params);
      } else {
        Logger.error('renderCombinedFilter not registered');
        root.textContent = 'Trang lọc không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle categories
    if (path === '/the-loai' || path === '/the-loai/') {
      if (pageRenderers.renderAllCategories) {
        await pageRenderers.renderAllCategories(root);
      } else {
        Logger.error('renderAllCategories not registered');
        root.textContent = 'Trang thể loại không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle saved movies
    if (path === '/phim-da-luu' || path === '/phim-da-luu/') {
      if (pageRenderers.renderSavedMovies) {
        await pageRenderers.renderSavedMovies(root);
      } else {
        Logger.error('renderSavedMovies not registered');
        root.textContent = 'Trang phim đã lưu không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle category filter
    if (path.startsWith('/the-loai/')) {
      const slug = decodeURIComponent(path.split('/')[2] || '');
      const newParams = new URLSearchParams(params);
      newParams.set('category', slug);
      if (pageRenderers.renderCombinedFilter) {
        await pageRenderers.renderCombinedFilter(root, newParams);
      } else {
        Logger.error('renderCombinedFilter not registered');
        root.textContent = 'Trang thể loại không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle country filter
    if (path.startsWith('/quoc-gia/')) {
      const slug = decodeURIComponent(path.split('/')[2] || '');
      const newParams = new URLSearchParams(params);
      newParams.set('country', slug);
      if (pageRenderers.renderCombinedFilter) {
        await pageRenderers.renderCombinedFilter(root, newParams);
      } else {
        Logger.error('renderCombinedFilter not registered');
        root.textContent = 'Trang quốc gia không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle year filter
    if (path.startsWith('/nam/')) {
      const year = decodeURIComponent(path.split('/')[2] || '');
      const newParams = new URLSearchParams(params);
      newParams.set('year', year);
      if (pageRenderers.renderCombinedFilter) {
        await pageRenderers.renderCombinedFilter(root, newParams);
      } else {
        Logger.error('renderCombinedFilter not registered');
        root.textContent = 'Trang năm không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle movie detail
    if (path.startsWith('/phim/')) {
      const slug = decodeURIComponent(path.split('/')[2] || '');
      if (pageRenderers.renderDetail) {
        await pageRenderers.renderDetail(root, slug);
      } else {
        Logger.error('renderDetail not registered');
        root.textContent = 'Trang chi tiết phim không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // Handle watch
    if (path.startsWith('/xem/')) {
      const slug = decodeURIComponent(path.split('/')[2] || '');
      if (pageRenderers.renderWatch) {
        await pageRenderers.renderWatch(root, slug, params);
      } else {
        Logger.error('renderWatch not registered');
        root.textContent = 'Trang xem phim không khả dụng.';
      }
      isRouting = false;
      return;
    }

    // 404 - Page not found
    root.innerHTML = `
      <div class="error-page">
        <div class="error-page__code">404</div>
        <div class="error-page__message">Trang không tồn tại</div>
        <a href="#/" class="btn btn--primary">Về trang chủ</a>
      </div>
    `;
  } catch (error) {
    Logger.error('Router error:', error);
    const root = document.getElementById('app');
    if (root) {
      root.innerHTML = `
        <div class="error-page">
          <div class="error-page__code">500</div>
          <div class="error-page__message">Có lỗi xảy ra khi tải trang</div>
          <button class="btn btn--primary" onclick="location.reload()">Tải lại</button>
        </div>
      `;
    }
  } finally {
    isRouting = false;
  }
}

// Navigation utilities
export function navigateTo(hash) {
  window.location.hash = hash;
}

export function goBack() {
  window.history.back();
}

export function goForward() {
  window.history.forward();
}

// Initialize router
export function initRouter() {
  // Handle hash changes
  window.addEventListener('hashchange', router);

  // Handle initial load
  window.addEventListener('load', router);

  // Handle browser back/forward
  window.addEventListener('popstate', router);

  // Initial route
  router();

  Logger.info('Router initialized');
}

// Get current route info
export function getCurrentRoute() {
  const { path, params } = parseHash();
  return { path, params: Object.fromEntries(params) };
}

// Check if currently routing
export function isCurrentlyRouting() {
  return isRouting;
}
