/**
 * 🚀 Virtual Scroller
 * Render chỉ những items visible để tối ưu hiệu suất với danh sách lớn
 */

export class VirtualScroller {
  constructor(container, options = {}) {
    this.container = container;
    this.itemHeight = options.itemHeight || 200;
    this.bufferSize = options.bufferSize || 5;
    this.threshold = options.threshold || 200;
    
    this.items = [];
    this.visibleItems = [];
    this.startIndex = 0;
    this.endIndex = 0;
    this.scrollTop = 0;
    this.containerHeight = 0;
    
    this.renderCallback = options.renderCallback || this.defaultRenderCallback;
    this.loadMoreCallback = options.loadMoreCallback || null;
    
    this.isLoading = false;
    this.hasMore = true;
    
    this.init();
  }

  /**
   * Initialize virtual scroller
   */
  init() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    // Create viewport
    this.viewport = document.createElement('div');
    this.viewport.style.position = 'relative';
    this.container.appendChild(this.viewport);
    
    // Create spacer for total height
    this.spacer = document.createElement('div');
    this.spacer.style.position = 'absolute';
    this.spacer.style.top = '0';
    this.spacer.style.left = '0';
    this.spacer.style.right = '0';
    this.spacer.style.pointerEvents = 'none';
    this.viewport.appendChild(this.spacer);
    
    // Bind events
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    
    this.updateContainerHeight();
    this.render();
    
    console.log('🚀 Virtual scroller initialized');
  }

  /**
   * Set items data
   */
  setItems(items) {
    this.items = items;
    this.updateSpacer();
    this.render();
    console.log(`📊 Virtual scroller loaded ${items.length} items`);
  }

  /**
   * Add more items (for infinite scroll)
   */
  addItems(newItems) {
    this.items.push(...newItems);
    this.updateSpacer();
    this.render();
    console.log(`➕ Added ${newItems.length} items, total: ${this.items.length}`);
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    this.scrollTop = this.container.scrollTop;
    this.render();
    
    // Check if need to load more
    if (this.loadMoreCallback && this.hasMore && !this.isLoading) {
      const scrollBottom = this.scrollTop + this.containerHeight;
      const totalHeight = this.items.length * this.itemHeight;
      
      if (scrollBottom >= totalHeight - this.threshold) {
        this.loadMore();
      }
    }
  }

  /**
   * Handle resize event
   */
  handleResize() {
    this.updateContainerHeight();
    this.render();
  }

  /**
   * Update container height
   */
  updateContainerHeight() {
    this.containerHeight = this.container.clientHeight;
  }

  /**
   * Update spacer height
   */
  updateSpacer() {
    const totalHeight = this.items.length * this.itemHeight;
    this.spacer.style.height = `${totalHeight}px`;
  }

  /**
   * Calculate visible range
   */
  calculateVisibleRange() {
    const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    const visibleEnd = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);
    
    // Add buffer
    this.startIndex = Math.max(0, visibleStart - this.bufferSize);
    this.endIndex = Math.min(this.items.length, visibleEnd + this.bufferSize);
  }

  /**
   * Render visible items
   */
  render() {
    this.calculateVisibleRange();
    
    // Clear existing items
    this.visibleItems.forEach(item => {
      if (item.element && item.element.parentNode) {
        item.element.parentNode.removeChild(item.element);
      }
    });
    
    this.visibleItems = [];
    
    // Render visible items
    for (let i = this.startIndex; i < this.endIndex; i++) {
      if (this.items[i]) {
        const element = this.renderItem(this.items[i], i);
        if (element) {
          element.style.position = 'absolute';
          element.style.top = `${i * this.itemHeight}px`;
          element.style.left = '0';
          element.style.right = '0';
          element.style.height = `${this.itemHeight}px`;
          
          this.viewport.appendChild(element);
          
          this.visibleItems.push({
            index: i,
            data: this.items[i],
            element: element
          });
        }
      }
    }
    
    // Debug info
    if (this.visibleItems.length > 0) {
      console.log(`🖼️ Rendered items ${this.startIndex}-${this.endIndex-1} (${this.visibleItems.length} visible)`);
    }
  }

  /**
   * Render single item
   */
  renderItem(item, index) {
    try {
      return this.renderCallback(item, index);
    } catch (error) {
      console.error(`❌ Failed to render item ${index}:`, error);
      return this.createErrorElement(error);
    }
  }

  /**
   * Default render callback
   */
  defaultRenderCallback(item, index) {
    const element = document.createElement('div');
    element.className = 'virtual-item';
    element.style.padding = '10px';
    element.style.borderBottom = '1px solid #333';
    element.innerHTML = `
      <div>Item ${index}</div>
      <div>${JSON.stringify(item).substring(0, 100)}...</div>
    `;
    return element;
  }

  /**
   * Create error element
   */
  createErrorElement(error) {
    const element = document.createElement('div');
    element.className = 'virtual-item error';
    element.style.padding = '10px';
    element.style.background = '#2a1f1f';
    element.style.color = '#e74c3c';
    element.style.borderBottom = '1px solid #333';
    element.innerHTML = `
      <div>❌ Render Error</div>
      <div style="font-size: 12px; opacity: 0.7;">${error.message}</div>
    `;
    return element;
  }

  /**
   * Load more items
   */
  async loadMore() {
    if (!this.loadMoreCallback || this.isLoading || !this.hasMore) {
      return;
    }

    try {
      this.isLoading = true;
      console.log('📥 Loading more items...');
      
      const result = await this.loadMoreCallback(this.items.length);
      
      if (result && result.items && result.items.length > 0) {
        this.addItems(result.items);
        this.hasMore = result.hasMore !== false;
      } else {
        this.hasMore = false;
        console.log('📄 No more items to load');
      }
      
    } catch (error) {
      console.error('❌ Failed to load more items:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Scroll to specific index
   */
  scrollToIndex(index) {
    if (index < 0 || index >= this.items.length) {
      console.warn(`⚠️ Invalid scroll index: ${index}`);
      return;
    }
    
    const targetScrollTop = index * this.itemHeight;
    this.container.scrollTop = targetScrollTop;
    console.log(`📍 Scrolled to item ${index}`);
  }

  /**
   * Scroll to top
   */
  scrollToTop() {
    this.container.scrollTop = 0;
  }

  /**
   * Get visible items
   */
  getVisibleItems() {
    return this.visibleItems.map(item => ({
      index: item.index,
      data: item.data
    }));
  }

  /**
   * Update item height (for dynamic heights)
   */
  updateItemHeight(newHeight) {
    this.itemHeight = newHeight;
    this.updateSpacer();
    this.render();
    console.log(`📏 Updated item height to ${newHeight}px`);
  }

  /**
   * Refresh/re-render all items
   */
  refresh() {
    this.render();
    console.log('🔄 Virtual scroller refreshed');
  }

  /**
   * Destroy virtual scroller
   */
  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    
    if (this.viewport && this.viewport.parentNode) {
      this.viewport.parentNode.removeChild(this.viewport);
    }
    
    console.log('🗑️ Virtual scroller destroyed');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalItems: this.items.length,
      visibleItems: this.visibleItems.length,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      scrollTop: this.scrollTop,
      containerHeight: this.containerHeight,
      itemHeight: this.itemHeight,
      isLoading: this.isLoading,
      hasMore: this.hasMore
    };
  }
}

/**
 * Movie Virtual Scroller - Specialized for movie items
 */
export class MovieVirtualScroller extends VirtualScroller {
  constructor(container, options = {}) {
    super(container, {
      itemHeight: 280, // Height for movie cards
      bufferSize: 3,
      threshold: 500,
      ...options
    });
  }

  /**
   * Render movie item
   */
  renderItem(movie, index) {
    const element = document.createElement('div');
    element.className = 'movie-card virtual-item';
    element.style.padding = '10px';
    element.style.display = 'flex';
    element.style.background = '#1e1e1e';
    element.style.borderRadius = '8px';
    element.style.margin = '5px';
    element.style.cursor = 'pointer';
    
    // Lazy load poster
    const posterUrl = movie.poster_url || movie.thumb_url || '';
    const posterImg = posterUrl ? 
      `<img src="${posterUrl}" alt="${movie.name}" style="width: 120px; height: 180px; object-fit: cover; border-radius: 4px;" loading="lazy">` :
      `<div style="width: 120px; height: 180px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">No Image</div>`;
    
    element.innerHTML = `
      <div style="flex-shrink: 0; margin-right: 15px;">
        ${posterImg}
      </div>
      <div style="flex: 1; min-width: 0;">
        <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 16px; line-height: 1.3;">
          ${movie.name || 'Unknown Title'}
        </h3>
        <p style="margin: 0 0 8px 0; color: #888; font-size: 14px;">
          ${movie.origin_name || ''}
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px;">
          ${(movie.category || []).slice(0, 3).map(cat => 
            `<span style="background: #333; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${cat.name}</span>`
          ).join('')}
        </div>
        <div style="color: #666; font-size: 12px;">
          <span>${movie.year || 'N/A'}</span>
          ${movie.country && movie.country.length > 0 ? ` • ${movie.country[0].name}` : ''}
          ${movie.episode_current ? ` • ${movie.episode_current}` : ''}
        </div>
      </div>
    `;
    
    // Add click handler
    element.addEventListener('click', () => {
      if (movie.slug) {
        window.location.hash = `#/phim/${movie.slug}`;
      }
    });
    
    return element;
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.VirtualScroller = VirtualScroller;
  window.MovieVirtualScroller = MovieVirtualScroller;
}
