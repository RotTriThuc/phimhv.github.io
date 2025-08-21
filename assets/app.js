/* XemPhim SPA with Secure API Proxy */

// SECURITY: API endpoints are now hidden behind proxy layer
// Real endpoints are protected in api-proxy.js

function buildUrl(path, params = {}) {
  // Use secure proxy endpoints instead of direct API calls
  if (!window.secureAPI) {
    throw new Error('Secure API proxy not initialized');
  }
  
  // Proxy will handle URL building securely
  return { path, params }; // Return data for proxy to handle
}

async function requestJson(url) {
  // DEPRECATED: Direct requests are now handled by secure proxy
  throw new Error('Direct API calls are disabled for security. Use secureAPI methods.');
}

function normalizeImageUrl(u) {
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('//')) return 'https:' + u;
  const path = u.startsWith('/') ? u : '/' + u;
  return 'https://phimimg.com' + path;
}

function imageProxy(originalUrl) {
  if (!originalUrl) return '';
  const absolute = normalizeImageUrl(originalUrl);
  // Use direct URL since image proxy endpoint doesn't exist
  return absolute;
}

function $(selector, parent = document) { return parent.querySelector(selector); }
function createEl(tag, className, html) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

function clearRootCompletely(root) {
  console.log('Clearing root completely - before:', root.children.length);
  
  // Method 1: Remove all children iteratively
  while (root.firstChild) {
    root.removeChild(root.firstChild);
  }
  
  // Method 2: Clear innerHTML as backup
  root.innerHTML = '';
  
  // Method 3: Reset styles and attributes
  root.className = 'container app';
  root.removeAttribute('style');
  
  // Method 4: Clear data attributes except critical ones
  Object.keys(root.dataset).forEach(key => {
    if (!['rendering'].includes(key)) {
      delete root.dataset[key];
    }
  });
  
  // Method 5: Force reflow
  root.offsetHeight;
  
  console.log('Clearing root completely - after:', root.children.length);
}

// Helpers an toàn DOM & dữ liệu
function safeRemove(node) {
  if (node && node.remove) {
    if (node.isConnected) node.remove();
    return;
  }
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
}

function extractItems(payload) {
  // Chuẩn hóa nhiều dạng schema khác nhau từ API
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.paginate?.items)) return payload.paginate.items;
  return [];
}

function setTheme(theme) {
  const body = document.body;
  body.classList.remove('theme-light', 'theme-dark');
  body.classList.add(theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'theme-dark';
  setTheme(current === 'theme-dark' ? 'theme-light' : 'theme-dark');
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  setTheme(saved || 'theme-dark');
}

function renderLoadingCards(count = 10) {
  const container = createEl('div', 'loading');
  for (let i = 0; i < count; i++) {
    const card = createEl('div', 'loading__card');
    card.appendChild(createEl('div', 'loading__shimmer'));
    container.appendChild(card);
  }
  return container;
}

function renderError(message, onRetry) {
  const wrap = createEl('div', '', `
    <p>${message}</p>
  `);
  const btn = createEl('button', 'btn btn--ghost', 'Thử lại');
  btn.addEventListener('click', onRetry);
  wrap.appendChild(btn);
  return wrap;
}

function movieCard(movie) {
  const poster = movie.poster_url || movie.thumb_url || '';
  const languages = movie.lang || movie.language || '';
  const title = movie.name || movie.origin_name || 'Không tên';
  const year = movie.year || '';
  const slug = movie.slug;

  const card = createEl('article', 'card');
  const badge = languages ? `<span class="card__badge">${languages}</span>` : '';
  card.innerHTML = `
    ${badge}
    <img class="card__img" loading="lazy" alt="${title}">
    <div class="card__meta">
      <h3 class="card__title">${title}</h3>
      <div class="card__sub">${year || ''}</div>
    </div>
  `;
  const imgEl = card.querySelector('.card__img');
  if (imgEl) {
    const proxied = imageProxy(poster);
    const absolute = normalizeImageUrl(poster);
    imgEl.referrerPolicy = 'no-referrer';
    imgEl.src = proxied;
    imgEl.addEventListener('error', () => {
      if (imgEl.dataset.fallbackApplied === '1') return;
      imgEl.dataset.fallbackApplied = '1';
      imgEl.src = absolute;
    });
  }
  card.addEventListener('click', () => {
    if (slug) navigateTo(`#/phim/${slug}`);
  });
  return card;
}

function listGrid(movies, className = '') {
  const safe = Array.isArray(movies) ? movies : [];
  const grid = createEl('div', 'grid');
  if (className) grid.className = className;
  for (const item of safe) {
    grid.appendChild(movieCard(item));
  }
  return grid;
}

/* Secure API Layer - Uses proxy for all requests */
const Api = {
  async getLatest(page = 1) {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.getLatestMovies({ page });
  },
  async getMovie(slug) {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.getMovieDetail(slug);
  },
  async search({ keyword, page = 1, sort_field, sort_type, sort_lang, category, country, year, limit }) {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.searchMovies(keyword, { page, sort_field, sort_type, sort_lang, category, country, year, limit });
  },
  async listByType({ type_list, page = 1, sort_field, sort_type, sort_lang, category, country, year, limit = 24 }) {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.secureRequest('/api/movies', { type_list, page, sort_field, sort_type, sort_lang, category, country, year, limit });
  },
  async getCategories() {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.getCategories();
  },
  async getCountries() {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.secureRequest('/api/countries');
  },
  async listByCategory({ slug, page = 1, sort_field, sort_type, sort_lang, country, year, limit = 24 }) {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.getMoviesByCategory(slug, { page, sort_field, sort_type, sort_lang, country, year, limit });
  },
  async listByCountry({ slug, page = 1, sort_field, sort_type, sort_lang, category, year, limit = 24 }) {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.secureRequest('/api/countries', { slug, page, sort_field, sort_type, sort_lang, category, year, limit });
  },
  async listByYear({ year, page = 1, sort_field, sort_type, sort_lang, category, country, limit = 24 }) {
    if (!window.secureAPI) throw new Error('Secure API not initialized');
    return window.secureAPI.secureRequest('/api/years', { year, page, sort_field, sort_type, sort_lang, category, country, limit });
  }
};

/* Routing */
function parseHash() {
  const raw = location.hash || '#/';
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.replace('#', '') || '/';
  const params = new URLSearchParams(queryPart || '');
  return { path, params };
}

function navigateTo(hash) {
  if (location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = hash;
  }
}

async function renderHome(root) {
  root.innerHTML = '';
  
  // Section 1: Phim mới cập nhật (chính)
  root.appendChild(sectionHeader('🎬 Phim mới cập nhật'));
  const loading1 = renderLoadingCards(8);
  root.appendChild(loading1);
  
  try {
    const data = await Api.getLatest(1);
    const items = extractItems(data).slice(0, 8);
    safeRemove(loading1);
    root.appendChild(listGrid(items));
    
    // Button "Xem thêm" cho phim mới
    const moreNewBtn = createEl('button', 'btn btn--more', 'Xem thêm phim mới');
    moreNewBtn.addEventListener('click', () => {
      renderMoreMovies(root, 'latest');
    });
    root.appendChild(moreNewBtn);
    
  } catch (e) {
    console.error(e);
    safeRemove(loading1);
    root.appendChild(createEl('p', 'error-msg', 'Không thể tải phim mới'));
  }
  
  // Section 2: Phim bộ hot
  await addSimpleSection(root, 'Phim bộ hot', 'phim-bo', 6);
  
  // Section 3: Hoạt hình
  await addSimpleSection(root, 'Hoạt hình', 'hoat-hinh', 6);
}

async function addSimpleSection(root, title, type, limit = 6) {
  const more = createEl('button', 'section__more', 'Xem tất cả');
  more.addEventListener('click', () => navigateTo(`#/loc?type_list=${encodeURIComponent(type)}`));
  
  root.appendChild(sectionHeader(title, more));
  const loading = renderLoadingCards(limit);
  root.appendChild(loading);
  
  try {
    const data = await Api.listByType({ type_list: type, page: 1, limit });
    const items = extractItems(data).slice(0, limit);
    safeRemove(loading);
    root.appendChild(listGrid(items, 'grid--simple'));
  } catch (err) {
    console.warn('Không tải được', type, err);
    safeRemove(loading);
    root.appendChild(createEl('p', 'error-msg', `Không tải được ${title.toLowerCase()}`));
  }
}

async function renderMoreMovies(root, type) {
  // Clear current content
  root.innerHTML = '';
  
  // Header với nút back
  const header = createEl('div', 'page-header');
  const backBtn = createEl('button', 'btn btn--back', '← Quay lại');
  backBtn.addEventListener('click', () => navigateTo('#/'));
  
  const title = createEl('h2', 'page-title', 'Tất cả phim mới');
  header.appendChild(backBtn);
  header.appendChild(title);
  root.appendChild(header);
  
  // Movies grid với pagination
  let currentPage = 1;
  const moviesContainer = createEl('div', 'movies-container');
  root.appendChild(moviesContainer);
  
  async function loadPage(page) {
    const loading = renderLoadingCards(16);
    moviesContainer.appendChild(loading);
    
    try {
      const data = await Api.getLatest(page);
      const items = extractItems(data);
      safeRemove(loading);
      
      if (items.length > 0) {
        moviesContainer.appendChild(listGrid(items));
        
        // Load more button
        const loadMoreBtn = createEl('button', 'btn btn--load-more', 'Tải thêm');
        loadMoreBtn.addEventListener('click', async () => {
          loadMoreBtn.disabled = true;
          loadMoreBtn.textContent = 'Đang tải...';
          currentPage++;
          await loadPage(currentPage);
          loadMoreBtn.remove();
        });
        moviesContainer.appendChild(loadMoreBtn);
      }
    } catch (e) {
      console.error(e);
      safeRemove(loading);
      moviesContainer.appendChild(createEl('p', 'error-msg', 'Không thể tải thêm phim'));
    }
  }
  
  await loadPage(currentPage);
}

function sectionHeader(title, trailing) {
  const wrap = createEl('div', 'section');
  wrap.appendChild(createEl('h2', 'section__title', title));
  if (trailing) wrap.appendChild(trailing);
  return wrap;
}

async function renderSearch(root, params) {
  const keyword = params.get('keyword') || '';
  const pageParam = Number(params.get('page') || '1');

  root.innerHTML = '';
  root.appendChild(sectionHeader(`Kết quả tìm kiếm: "${keyword}"`));
  const loading = renderLoadingCards(12);
  root.appendChild(loading);

  try {
    const data = await Api.search({ keyword, page: pageParam });
    safeRemove(loading);
    const items = extractItems(data);
    if (!items.length) {
      root.appendChild(createEl('p', '', 'Không tìm thấy kết quả.'));
      return;
    }
    root.appendChild(listGrid(items));

    const totalPages = data?.paginate?.totalPages || data?.totalPages || 1;
    const pager = buildPager(pageParam, totalPages, (nextPage) => {
      params.set('page', String(nextPage));
      navigateTo(`#/tim-kiem?${params.toString()}`);
    });
    root.appendChild(pager);
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được kết quả tìm kiếm.', () => renderSearch(root, params)));
  }
}

function buildPager(current, total, onGo) {
  const pager = createEl('div', 'pager');
  const prev = createEl('button', '', 'Trước');
  const next = createEl('button', '', 'Sau');
  prev.disabled = current <= 1;
  next.disabled = current >= total;
  prev.addEventListener('click', () => onGo(Math.max(1, current - 1)));
  next.addEventListener('click', () => onGo(Math.min(total, current + 1)));
  pager.appendChild(prev);
  pager.appendChild(createEl('span', '', `${current}/${total}`));
  pager.appendChild(next);
  return pager;
}

// Nạp script bên ngoài
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Failed to load ' + src));
    (document.head || document.body).appendChild(s);
  });
}

async function ensureHls() {
  if (window.Hls) return true;
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js');
    return !!window.Hls;
  } catch {
    return false;
  }
}

async function renderFilterList(root, params) {
  const type_list = params.get('type_list') || 'phim-bo';
  const page = Number(params.get('page') || '1');
  const sort_field = params.get('sort_field') || '_id';
  const sort_type = params.get('sort_type') || 'desc';
  const sort_lang = params.get('sort_lang') || '';
  const category = params.get('category') || '';
  const country = params.get('country') || '';
  const year = params.get('year') || '';

  // Tên hiển thị cho type_list
  const typeNames = {
    'phim-bo': 'Phim Bộ',
    'phim-le': 'Phim Lẻ', 
    'hoat-hinh': 'Hoạt Hình',
    'tv-shows': 'TV Shows',
    'phim-vietsub': 'Phim Vietsub',
    'phim-thuyet-minh': 'Phim Thuyết Minh',
    'phim-long-tieng': 'Phim Lồng Tiếng'
  };
  
  const typeName = typeNames[type_list] || type_list;

  root.innerHTML = '';
  const more = createEl('button', 'section__more', 'Đặt lại lọc');
  more.addEventListener('click', () => navigateTo(`#/loc?type_list=${type_list}`));
  root.appendChild(sectionHeader(`Danh sách ${typeName}`, more));

  const loading = renderLoadingCards(24);
  root.appendChild(loading);

  try {
    const data = await Api.listByType({ type_list, page, sort_field, sort_type, sort_lang, category, country, year, limit: 24 });
    safeRemove(loading);
    const items = extractItems(data);
    
    // Hiển thị thông tin số lượng
    const totalItems = data?.data?.params?.pagination?.totalItems || data?.paginate?.totalItems || data?.totalItems || data?.pagination?.totalItems;
    const currentPage = data?.data?.params?.pagination?.currentPage || page;
    const totalPages = data?.data?.params?.pagination?.totalPages || data?.paginate?.totalPages || data?.totalPages || data?.pagination?.totalPages || 1;
    
    if (totalItems) {
      const countInfo = createEl('div', '', `Tìm thấy ${totalItems} ${typeName.toLowerCase()} - Trang ${currentPage}/${totalPages}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    } else if (items.length > 0) {
      const countInfo = createEl('div', '', `Hiển thị ${items.length} ${typeName.toLowerCase()} - Trang ${currentPage}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    }
    
    if (items.length === 0) {
      const noMovies = createEl('div', '', `Không tìm thấy ${typeName.toLowerCase()} nào.`);
      noMovies.style.cssText = 'text-align:center;padding:40px;color:var(--muted);';
      root.appendChild(noMovies);
      return;
    }
    
    root.appendChild(listGrid(items));

    if (totalPages > 1) {
      const pager = buildPager(page, totalPages, (nextPage) => {
        // Tạo URL mới với tất cả params
        const newParams = new URLSearchParams();
        newParams.set('type_list', type_list);
        newParams.set('page', String(nextPage));
        if (sort_field) newParams.set('sort_field', sort_field);
        if (sort_type) newParams.set('sort_type', sort_type);
        if (sort_lang) newParams.set('sort_lang', sort_lang);
        if (category) newParams.set('category', category);
        if (country) newParams.set('country', country);
        if (year) newParams.set('year', year);
        navigateTo(`#/loc?${newParams.toString()}`);
      });
      root.appendChild(pager);
    }
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách lọc.', () => renderFilterList(root, params)));
  }
}

async function renderDetail(root, slug) {
  root.innerHTML = '';
  const loading = renderLoadingCards(6);
  root.appendChild(loading);
  try {
    const data = await Api.getMovie(slug);
    safeRemove(loading);

    const movie = data?.movie || {};
    const episodes = data?.episodes || [];

    const wrap = createEl('div', 'detail');

    const posterUrl = movie.poster_url || movie.thumb_url;
    const poster = createEl('img', 'detail__poster');
    poster.loading = 'lazy';
    poster.referrerPolicy = 'no-referrer';
    poster.src = imageProxy(posterUrl);
    poster.alt = movie.name || 'Poster';
    poster.addEventListener('error', () => {
      if (poster.dataset.fallbackApplied === '1') return;
      poster.dataset.fallbackApplied = '1';
      poster.src = normalizeImageUrl(posterUrl);
    });

    const meta = createEl('div', 'detail__meta');
    const title = createEl('h1', 'detail__title', movie.name || 'Không tên');
    const countriesHtml = (movie.country || [])
      .map(c => `<a href="#/quoc-gia/${encodeURIComponent(c.slug || '')}">${c.name}</a>`)
      .join(', ') || '—';
    const categoriesHtml = (movie.category || movie.categories || [])
      .map(c => `<a href="#/the-loai/${encodeURIComponent(c.slug || '')}">${c.name}</a>`)
      .join(', ') || '—';
    const info = createEl('div', '', `
      <div class="detail__line">Năm: <a href="#/nam/${movie.year || ''}"><strong>${movie.year || '—'}</strong></a></div>
      <div class="detail__line">Trạng thái: <strong>${movie.status || '—'}</strong></div>
      <div class="detail__line">Ngôn ngữ: <strong>${movie.lang || '—'}</strong></div>
      <div class="detail__line">Quốc gia: ${countriesHtml}</div>
      <div class="detail__line">Thể loại: ${categoriesHtml}</div>
    `);

    const actions = createEl('div', 'detail__actions');
    const firstTarget = findFirstEpisode(episodes);
    if (firstTarget) {
      const watchBtn = createEl('button', 'btn', 'Xem ngay');
      watchBtn.addEventListener('click', () => {
        const q = new URLSearchParams({ server: String(firstTarget.serverIndex), ep: firstTarget.episode.slug || firstTarget.episode.name || '1' });
        navigateTo(`#/xem/${movie.slug}?${q.toString()}`);
      });
      actions.appendChild(watchBtn);
    }
    const shareBtn = createEl('button', 'btn btn--ghost', 'Sao chép liên kết');
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        shareBtn.textContent = 'Đã sao chép!';
        setTimeout(() => (shareBtn.textContent = 'Sao chép liên kết'), 1200);
      } catch {}
    });
    actions.appendChild(shareBtn);

    const metaWrap = createEl('div');
    metaWrap.appendChild(title);
    metaWrap.appendChild(info);
    metaWrap.appendChild(actions);

    wrap.appendChild(poster);
    wrap.appendChild(metaWrap);

    const eps = createEl('section', 'episodes');
    const tabs = createEl('div', 'server-tabs');
    const list = createEl('div', 'ep-list');

    let activeServer = 0;
    function renderServerTabs() {
      tabs.innerHTML = '';
      episodes.forEach((s, idx) => {
        const tab = createEl('button', 'server-tab' + (idx === activeServer ? ' active' : ''), s?.server_name || `Server ${idx+1}`);
        tab.addEventListener('click', () => { activeServer = idx; renderEpisodeList(); renderServerTabs(); });
        tabs.appendChild(tab);
      });
    }

    function renderEpisodeList() {
      list.innerHTML = '';
      const dataList = episodes?.[activeServer]?.server_data || [];
      dataList.forEach(ep => {
        const btn = createEl('button', 'ep-item', ep.name || ep.slug || 'Tập');
        btn.addEventListener('click', () => {
          const q = new URLSearchParams({ server: String(activeServer), ep: ep.slug || ep.name || '1' });
          navigateTo(`#/xem/${movie.slug}?${q.toString()}`);
        });
        list.appendChild(btn);
      });
    }

    renderServerTabs();
    renderEpisodeList();
    eps.appendChild(tabs);
    eps.appendChild(list);

    const desc = createEl('section', 'detail__meta');
    desc.appendChild(createEl('h3', '', 'Nội dung'));
    desc.appendChild(createEl('p', '', movie.content || movie.description || 'Chưa có nội dung.'));

    root.appendChild(wrap);
    root.appendChild(eps);
    root.appendChild(desc);
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được chi tiết phim.', () => renderDetail(root, slug)));
  }
}

function findFirstEpisode(episodes) {
  for (let i = 0; i < (episodes || []).length; i++) {
    const server = episodes[i];
    if (server?.server_data?.length) {
      return { serverIndex: i, episode: server.server_data[0] };
    }
  }
  return null;
}

async function renderWatch(root, slug, params) {
  const serverIndex = Number(params.get('server') || '0');
  const epSlug = params.get('ep') || '';

  root.innerHTML = '';
  const loading = renderLoadingCards(4);
  root.appendChild(loading);

  try {
    const data = await Api.getMovie(slug);
    safeRemove(loading);

    const movie = data?.movie || {};
    const episodes = data?.episodes || [];
    const server = episodes?.[serverIndex];
    const ep = server?.server_data?.find(x => (x.slug || x.name) === epSlug) || server?.server_data?.[0];

    const player = createEl('section', 'player');

    async function renderHls(url, fallbackEmbed) {
      const video = createEl('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';

      const hasNative = video.canPlayType('application/vnd.apple.mpegurl');
      const hasHls = await ensureHls();

      if (hasNative) {
        video.src = url;
        player.appendChild(video);
        return true;
      }
      if (hasHls && window.Hls?.isSupported()) {
        const HlsClass = window.Hls;
        const hls = new HlsClass({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(HlsClass.Events.ERROR, (_evt, data) => {
          if (data.fatal && fallbackEmbed) {
            player.innerHTML = '';
            fallbackEmbed();
          }
        });
        player.appendChild(video);
        return true;
      }
      return false;
    }

    function renderEmbed(url) {
      const iframe = createEl('iframe');
      iframe.src = url;
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'no-referrer';
      iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-presentation');
      iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
      player.appendChild(iframe);
    }

    let played = false;
    if (ep?.link_m3u8) {
      played = await renderHls(ep.link_m3u8, () => {
        if (ep?.link_embed) renderEmbed(ep.link_embed);
        else player.appendChild(createEl('p', '', 'Không tìm thấy nguồn phát khả dụng.'));
      });
    }
    if (!played) {
      if (ep?.link_embed) renderEmbed(ep.link_embed);
      else if (ep?.link_m3u8) await renderHls(ep.link_m3u8);
      else player.appendChild(createEl('p', '', 'Không tìm thấy nguồn phát cho tập này.'));
    }

    const h1 = createEl('h1', '', movie.name || 'Đang xem');
    const sub = createEl('div', 'detail__line', `Tập: <strong>${ep?.name || epSlug || ''}</strong> — Server: <strong>${server?.server_name || serverIndex+1}</strong>`);

    const eps = createEl('section', 'episodes');
    const tabs = createEl('div', 'server-tabs');
    const list = createEl('div', 'ep-list');

    let activeServer = serverIndex;
    
    // Tái sử dụng logic tạo server tabs và episode list
    const createServerControls = (episodes, activeServerIndex, movieSlug) => {
      const renderTabs = () => {
        tabs.innerHTML = '';
        episodes.forEach((s, idx) => {
          const tab = createEl('button', 'server-tab' + (idx === activeServerIndex ? ' active' : ''), s?.server_name || `Server ${idx+1}`);
          tab.addEventListener('click', () => { 
            activeServerIndex = idx; 
            renderList(); 
            renderTabs(); 
          });
          tabs.appendChild(tab);
        });
      };
      
      const renderList = () => {
        list.innerHTML = '';
        const dataList = episodes?.[activeServerIndex]?.server_data || [];
        dataList.forEach(one => {
          const btn = createEl('button', 'ep-item', one.name || one.slug || 'Tập');
          btn.addEventListener('click', () => {
            const q = new URLSearchParams({ server: String(activeServerIndex), ep: one.slug || one.name || '1' });
            navigateTo(`#/xem/${movieSlug}?${q.toString()}`);
          });
          list.appendChild(btn);
        });
      };
      
      return { renderTabs, renderList };
    };
    
    const { renderTabs, renderList } = createServerControls(episodes, activeServer, movie.slug);
    renderTabs();
    renderList();
    eps.appendChild(tabs);
    eps.appendChild(list);

    root.appendChild(h1);
    root.appendChild(sub);
    root.appendChild(player);
    root.appendChild(eps);
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được dữ liệu phát.', () => renderWatch(root, slug, params)));
  }
}

async function renderCategory(root, slug, params) {
  const page = Number(params.get('page') || '1');
  root.innerHTML = '';
  
  const category = Categories.findBySlug(slug);
  const categoryName = category ? category.name : slug;
  
  root.appendChild(sectionHeader(`Thể loại: ${categoryName}`));
  
  const loading = renderLoadingCards(12);
  root.appendChild(loading);
  
  try {
    const data = await Api.listByCategory({ slug, page, limit: 24 });
    safeRemove(loading);
    const items = extractItems(data);
    
    if (items.length === 0) {
      const noMovies = createEl('div', '', 'Chưa có phim nào trong thể loại này.');
      noMovies.style.cssText = 'text-align:center;padding:40px;color:var(--muted);';
      root.appendChild(noMovies);
      return;
    }
    
    // Hiển thị số lượng phim
    const totalItems = data?.data?.params?.pagination?.totalItems || data?.paginate?.totalItems || data?.totalItems || data?.pagination?.totalItems;
    const currentPage = data?.data?.params?.pagination?.currentPage || page;
    const totalPages = data?.data?.params?.pagination?.totalPages || data?.paginate?.totalPages || data?.totalPages || data?.pagination?.totalPages || 1;
    
    if (totalItems) {
      const countInfo = createEl('div', '', `Tìm thấy ${totalItems} phim ${categoryName} - Trang ${currentPage}/${totalPages}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    } else if (items.length > 0) {
      const countInfo = createEl('div', '', `Hiển thị ${items.length} phim - Trang ${currentPage}`);
      countInfo.style.cssText = 'margin-bottom:16px;color:var(--muted);font-size:14px;';
      root.appendChild(countInfo);
    }
    
    root.appendChild(listGrid(items));
    
    if (totalPages > 1) {
      const pager = buildPager(page, totalPages, (nextPage) => {
        params.set('page', String(nextPage));
        navigateTo(`#/the-loai/${slug}?${params.toString()}`);
      });
      root.appendChild(pager);
    }
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách thể loại.', () => renderCategory(root, slug, params)));
  }
}

async function renderCountry(root, slug, params) {
  const page = Number(params.get('page') || '1');
  root.innerHTML = '';
  root.appendChild(sectionHeader(`Quốc gia: ${slug}`));
  const loading = renderLoadingCards(12);
  root.appendChild(loading);
  try {
    const data = await Api.listByCountry({ slug, page });
    safeRemove(loading);
    const items = extractItems(data);
    root.appendChild(listGrid(items));
    const totalPages = data?.paginate?.totalPages || data?.totalPages || page;
    const pager = buildPager(page, totalPages, (nextPage) => {
      params.set('page', String(nextPage));
      navigateTo(`#/quoc-gia/${slug}?${params.toString()}`);
    });
    root.appendChild(pager);
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách quốc gia.', () => renderCountry(root, slug, params)));
  }
}

async function renderYear(root, year, params) {
  const page = Number(params.get('page') || '1');
  root.innerHTML = '';
  root.appendChild(sectionHeader(`Năm: ${year}`));
  const loading = renderLoadingCards(12);
  root.appendChild(loading);
  try {
    const data = await Api.listByYear({ year, page });
    safeRemove(loading);
    const items = extractItems(data);
    root.appendChild(listGrid(items));
    const totalPages = data?.paginate?.totalPages || data?.totalPages || page;
    const pager = buildPager(page, totalPages, (nextPage) => {
      params.set('page', String(nextPage));
      navigateTo(`#/nam/${year}?${params.toString()}`);
    });
    root.appendChild(pager);
  } catch (e) {
    console.error(e);
    root.innerHTML = '';
    root.appendChild(renderError('Không tải được danh sách theo năm.', () => renderYear(root, year, params)));
  }
}

/* Bind header controls */
function bindHeader() {
  const homeBtn = $('#homeBtn');
  homeBtn?.addEventListener('click', () => navigateTo('#/'));

  document.querySelectorAll('.nav__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-quick');
      navigateTo(`#/loc?type_list=${encodeURIComponent(type)}`);
    });
  });

  const form = $('#searchForm');
  const input = $('#searchInput');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input?.value || '').trim();
    if (!q) return;
    const params = new URLSearchParams({ keyword: q, page: '1' });
    navigateTo(`#/tim-kiem?${params.toString()}`);
  });

  $('#themeToggle')?.addEventListener('click', toggleTheme);
}

async function populateFilters() {
  const countrySelect = $('#countrySelect');
  const yearSelect = $('#yearSelect');

  try {
    const countries = await Api.getCountries().catch(() => []);

    if (Array.isArray(countries)) {
      countries.forEach(c => {
        const opt = createEl('option');
        opt.value = c.slug || c.id || '';
        opt.textContent = c.name || c.title || '';
        countrySelect?.appendChild(opt);
      });
    }

    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1970; y--) {
      const opt = createEl('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect?.appendChild(opt);
    }

    countrySelect?.addEventListener('change', () => {
      const v = countrySelect.value;
      if (v) navigateTo(`#/quoc-gia/${encodeURIComponent(v)}`);
    });
    yearSelect?.addEventListener('change', () => {
      const v = yearSelect.value;
      if (v) navigateTo(`#/nam/${encodeURIComponent(v)}`);
    });
  } catch (e) {
    console.warn('Không tải được bộ lọc', e);
  }
}

// Categories từ KKPhim
const Categories = {
  list: [
    { name: 'Hành Động', slug: 'hanh-dong' },
    { name: 'Cổ Trang', slug: 'co-trang' },
    { name: 'Chiến Tranh', slug: 'chien-tranh' },
    { name: 'Viễn Tưởng', slug: 'vien-tuong' },
    { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Tài Liệu', slug: 'tai-lieu' },
    { name: 'Bí Ẩn', slug: 'bi-an' },
    { name: 'Phim 18+', slug: 'phim-18' },
    { name: 'Tình Cảm', slug: 'tinh-cam' },
    { name: 'Tâm Lý', slug: 'tam-ly' },
    { name: 'Thể Thao', slug: 'the-thao' },
    { name: 'Phiêu Lưu', slug: 'phieu-luu' },
    { name: 'Âm Nhạc', slug: 'am-nhac' },
    { name: 'Gia Đình', slug: 'gia-dinh' },
    { name: 'Học Đường', slug: 'hoc-duong' },
    { name: 'Hài Hước', slug: 'hai-huoc' },
    { name: 'Hình Sự', slug: 'hinh-su' },
    { name: 'Võ Thuật', slug: 'vo-thuat' },
    { name: 'Khoa Học', slug: 'khoa-hoc' },
    { name: 'Thần Thoại', slug: 'than-thoai' },
    { name: 'Chính Kịch', slug: 'chinh-kich' },
    { name: 'Kinh Điển', slug: 'kinh-dien' }
  ],

  // Tìm thể loại theo slug
  findBySlug(slug) {
    return this.list.find(cat => cat.slug === slug);
  },

  // Lọc phim theo thể loại từ danh sách
  filterMoviesByCategory(movies, categorySlug) {
    if (!categorySlug || !Array.isArray(movies)) return movies;
    
    return movies.filter(movie => {
      const categories = movie.category || [];
      return categories.some(cat => cat.slug === categorySlug);
    });
  },

  // Nhóm phim theo thể loại
  groupMoviesByCategory(movies) {
    const grouped = {};
    
    // Khởi tạo các thể loại
    this.list.forEach(cat => {
      grouped[cat.slug] = {
        name: cat.name,
        slug: cat.slug,
        movies: []
      };
    });

    // Phân loại phim
    if (Array.isArray(movies)) {
      movies.forEach(movie => {
        const categories = movie.category || [];
        categories.forEach(cat => {
          if (grouped[cat.slug]) {
            grouped[cat.slug].movies.push(movie);
          }
        });
      });
    }

    return grouped;
  }
};

// Render trang tất cả thể loại
async function renderAllCategories(root) {
  console.log('renderAllCategories called', root, 'children:', root.children.length, 'innerHTML length:', root.innerHTML.length);
  
  // Debug: log any existing content
  if (root.children.length > 0) {
    console.log('Existing children before cleanup:', Array.from(root.children).map(el => el.tagName + '.' + el.className));
  }
  
  // Check if already rendering this page to prevent duplicates
  if (root.dataset.rendering === 'categories') {
    console.log('Already rendering categories, skipping...');
    return;
  }
  
  // Use utility function for complete DOM cleanup
  clearRootCompletely(root);
  
  // Set rendering flag after cleanup
  root.dataset.rendering = 'categories';
  
  // Add a small delay to ensure DOM is fully cleared
  await new Promise(resolve => setTimeout(resolve, 20));
  
  // Debug: verify cleanup
  console.log('After cleanup - children:', root.children.length, 'innerHTML length:', root.innerHTML.length);
  if (root.children.length > 0) {
    console.log('WARNING: Still has children after cleanup:', Array.from(root.children).map(el => el.tagName + '.' + el.className));
  }
  
  root.appendChild(sectionHeader('Tất cả thể loại'));
  
  const categoryGrid = createEl('div', 'category-grid');
  categoryGrid.className = 'category-grid';
  categoryGrid.style.cssText = 'display:grid !important;grid-template-columns:repeat(auto-fill,minmax(200px,1fr)) !important;gap:16px !important;margin-top:20px !important;padding:0 !important;';
  
  Categories.list.forEach(category => {
    const categoryCard = createEl('a', 'category-card');
    categoryCard.className = 'category-card';
    categoryCard.href = `#/the-loai/${category.slug}`;
    categoryCard.style.cssText = `
      display:block !important;
      padding:20px !important;
      background:var(--card) !important;
      border:1px solid var(--border) !important;
      border-radius:12px !important;
      text-decoration:none !important;
      color:var(--text) !important;
      transition:all 0.2s ease !important;
      text-align:center !important;
      width:auto !important;
      height:auto !important;
      position:relative !important;
    `;
    
    categoryCard.innerHTML = `
      <div style="font-size:24px;margin-bottom:8px;">🎬</div>
      <div style="font-weight:500;margin-bottom:4px;">${category.name}</div>
      <div style="font-size:12px;color:var(--muted);">Khám phá ngay</div>
    `;
    
    categoryGrid.appendChild(categoryCard);
  });
  
  root.appendChild(categoryGrid);
  
  // Clear the rendering flag
  delete root.dataset.rendering;
}

/* App bootstrap */
let isRouting = false;
async function router() {
  if (isRouting) {
    console.log('Router already running, skipping...');
    return;
  }
  isRouting = true;
  
  const root = document.getElementById('app');
  const { path, params } = parseHash();

  if (!root) {
    isRouting = false;
    return;
  }
  if (path === '/' || path === '') {
    await renderHome(root);
    isRouting = false;
    return;
  }
  if (path.startsWith('/tim-kiem')) {
    await renderSearch(root, params);
    isRouting = false;
    return;
  }
  if (path.startsWith('/loc')) {
    await renderFilterList(root, params);
    isRouting = false;
    return;
  }
  if (path === '/the-loai' || path === '/the-loai/') {
    await renderAllCategories(root);
    isRouting = false;
    return;
  }
  if (path.startsWith('/the-loai/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    await renderCategory(root, slug, params);
    isRouting = false;
    return;
  }
  if (path.startsWith('/quoc-gia/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    await renderCountry(root, slug, params);
    isRouting = false;
    return;
  }
  if (path.startsWith('/nam/')) {
    const year = decodeURIComponent(path.split('/')[2] || '');
    await renderYear(root, year, params);
    isRouting = false;
    return;
  }
  if (path.startsWith('/phim/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    await renderDetail(root, slug);
    isRouting = false;
    return;
  }
  if (path.startsWith('/xem/')) {
    const slug = decodeURIComponent(path.split('/')[2] || '');
    await renderWatch(root, slug, params);
    isRouting = false;
    return;
  }
  root.textContent = 'Trang không tồn tại.';
  isRouting = false;
}

(function main() {
  initTheme();
  bindHeader();
  populateFilters();
  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
  router();
  
  // Khởi động notification system
  initNotificationSystem();
})();

// Notification System
function initNotificationSystem() {
  createNotificationContainer();
  checkForUpdates();
  
  // Kiểm tra cập nhật mỗi 2 phút
  setInterval(checkForUpdates, 2 * 60 * 1000);
}

function createNotificationContainer() {
  if (document.getElementById('notification-container')) return;
  
  const container = createEl('div', 'notification-container');
  container.id = 'notification-container';
  document.body.appendChild(container);
}

async function checkForUpdates() {
  try {
    const response = await fetch('./data/latest-notification.json');
    if (!response.ok) return;
    
    const notification = await response.json();
    
    // Kiểm tra xem đã hiển thị notification này chưa
    const lastShown = localStorage.getItem('last-notification-timestamp');
    if (lastShown === notification.timestamp) return;
    
    if (notification.hasUpdates) {
      showNotification(notification);
      localStorage.setItem('last-notification-timestamp', notification.timestamp);
    }
    
  } catch (error) {
    // Silent fail - file có thể chưa tồn tại
  }
}

function showNotification(notification) {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notificationEl = createEl('div', 'notification notification--success');
  
  notificationEl.innerHTML = `
    <div class="notification__icon">🔔</div>
    <div class="notification__content">
      <div class="notification__title">Cập nhật mới!</div>
      <div class="notification__message">${notification.message}</div>
      <div class="notification__time">${new Date(notification.timestamp).toLocaleString('vi-VN')}</div>
    </div>
    <button class="notification__close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(notificationEl);
  
  // Tự động ẩn sau 10 giây
  setTimeout(() => {
    if (notificationEl.parentNode) {
      notificationEl.classList.add('notification--fade-out');
      setTimeout(() => notificationEl.remove(), 300);
    }
  }, 10000);
  
  // Hiệu ứng slide in
  setTimeout(() => notificationEl.classList.add('notification--show'), 100);
} 