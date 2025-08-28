/**
 * 📊 Data Pagination System
 * Giải quyết vấn đề kho-phim.json 14.5MB bằng cách chia nhỏ và lazy loading
 */

export class DataPagination {
  constructor(options = {}) {
    this.itemsPerPage = options.itemsPerPage || 100;
    this.cacheSize = options.cacheSize || 5; // Cache 5 pages
    this.baseUrl = options.baseUrl || './data/chunks/';
    
    this.cache = new Map();
    this.loadingPages = new Set();
    this.totalPages = 0;
    this.totalItems = 0;
    this.metadata = null;
    
    this.observers = new Set();
  }

  /**
   * Initialize pagination system
   */
  async init() {
    try {
      console.log('📊 Initializing data pagination...');
      
      // Load metadata first (small file with index info)
      this.metadata = await this.loadMetadata();
      this.totalItems = this.metadata.totalItems;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      
      console.log(`📊 Loaded metadata: ${this.totalItems} items, ${this.totalPages} pages`);
      
      // Preload first page
      await this.loadPage(1);
      
      return {
        totalItems: this.totalItems,
        totalPages: this.totalPages,
        itemsPerPage: this.itemsPerPage
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize pagination:', error);
      throw error;
    }
  }

  /**
   * Load metadata file
   */
  async loadMetadata() {
    try {
      const response = await fetch(`${this.baseUrl}metadata.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('⚠️ Metadata not found, falling back to legacy data...');
      return await this.createMetadataFromLegacy();
    }
  }

  /**
   * Create metadata from legacy kho-phim.json (fallback)
   */
  async createMetadataFromLegacy() {
    try {
      const response = await fetch('./data/kho-phim.json');
      const data = await response.json();
      
      return {
        totalItems: data.length,
        version: '1.0.0',
        lastUpdated: Date.now(),
        categories: this.extractCategories(data),
        years: this.extractYears(data),
        countries: this.extractCountries(data)
      };
    } catch (error) {
      console.error('❌ Failed to load legacy data:', error);
      throw error;
    }
  }

  /**
   * Load specific page
   */
  async loadPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    // Return cached page if available
    if (this.cache.has(pageNumber)) {
      console.log(`📄 Page ${pageNumber} loaded from cache`);
      return this.cache.get(pageNumber);
    }

    // Prevent duplicate loading
    if (this.loadingPages.has(pageNumber)) {
      console.log(`⏳ Page ${pageNumber} already loading, waiting...`);
      return await this.waitForPageLoad(pageNumber);
    }

    try {
      this.loadingPages.add(pageNumber);
      console.log(`📥 Loading page ${pageNumber}...`);

      const response = await fetch(`${this.baseUrl}page-${pageNumber}.json`);
      
      if (!response.ok) {
        // Fallback to legacy data
        console.warn(`⚠️ Page ${pageNumber} not found, using legacy fallback`);
        return await this.loadPageFromLegacy(pageNumber);
      }

      const pageData = await response.json();
      
      // Cache the page
      this.cache.set(pageNumber, pageData);
      this.cleanupCache();
      
      console.log(`✅ Page ${pageNumber} loaded: ${pageData.items?.length || 0} items`);
      
      // Notify observers
      this.notifyObservers('page-loaded', { pageNumber, data: pageData });
      
      return pageData;
      
    } catch (error) {
      console.error(`❌ Failed to load page ${pageNumber}:`, error);
      throw error;
    } finally {
      this.loadingPages.delete(pageNumber);
    }
  }

  /**
   * Load page from legacy kho-phim.json (fallback)
   */
  async loadPageFromLegacy(pageNumber) {
    try {
      if (!this.legacyData) {
        const response = await fetch('./data/kho-phim.json');
        this.legacyData = await response.json();
      }

      const startIndex = (pageNumber - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const items = this.legacyData.slice(startIndex, endIndex);

      const pageData = {
        page: pageNumber,
        items: items,
        totalItems: this.legacyData.length,
        hasNext: endIndex < this.legacyData.length,
        hasPrev: pageNumber > 1
      };

      // Cache the page
      this.cache.set(pageNumber, pageData);
      this.cleanupCache();

      return pageData;
      
    } catch (error) {
      console.error(`❌ Failed to load legacy page ${pageNumber}:`, error);
      throw error;
    }
  }

  /**
   * Wait for page to finish loading
   */
  async waitForPageLoad(pageNumber) {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (this.cache.has(pageNumber)) {
          resolve(this.cache.get(pageNumber));
        } else if (!this.loadingPages.has(pageNumber)) {
          // Loading failed
          resolve(null);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  /**
   * Get items for specific range
   */
  async getItems(startIndex, count) {
    const startPage = Math.floor(startIndex / this.itemsPerPage) + 1;
    const endPage = Math.floor((startIndex + count - 1) / this.itemsPerPage) + 1;
    
    const items = [];
    
    for (let page = startPage; page <= endPage; page++) {
      const pageData = await this.loadPage(page);
      if (pageData && pageData.items) {
        const pageStartIndex = (page - 1) * this.itemsPerPage;
        const relativeStart = Math.max(0, startIndex - pageStartIndex);
        const relativeEnd = Math.min(pageData.items.length, startIndex + count - pageStartIndex);
        
        if (relativeStart < relativeEnd) {
          items.push(...pageData.items.slice(relativeStart, relativeEnd));
        }
      }
    }
    
    return items;
  }

  /**
   * Preload adjacent pages
   */
  async preloadAdjacent(currentPage) {
    const preloadPromises = [];
    
    // Preload previous page
    if (currentPage > 1) {
      preloadPromises.push(this.loadPage(currentPage - 1));
    }
    
    // Preload next page
    if (currentPage < this.totalPages) {
      preloadPromises.push(this.loadPage(currentPage + 1));
    }
    
    try {
      await Promise.all(preloadPromises);
      console.log(`📦 Preloaded adjacent pages for page ${currentPage}`);
    } catch (error) {
      console.warn('⚠️ Failed to preload some adjacent pages:', error);
    }
  }

  /**
   * Search across all pages
   */
  async search(query, options = {}) {
    const results = [];
    const maxResults = options.maxResults || 50;
    const searchFields = options.fields || ['name', 'slug', 'origin_name'];
    
    console.log(`🔍 Searching for "${query}" across ${this.totalPages} pages...`);
    
    for (let page = 1; page <= this.totalPages && results.length < maxResults; page++) {
      try {
        const pageData = await this.loadPage(page);
        if (pageData && pageData.items) {
          const pageResults = pageData.items.filter(item => {
            return searchFields.some(field => {
              const value = item[field];
              return value && value.toLowerCase().includes(query.toLowerCase());
            });
          });
          
          results.push(...pageResults.slice(0, maxResults - results.length));
        }
      } catch (error) {
        console.warn(`⚠️ Failed to search page ${page}:`, error);
      }
    }
    
    console.log(`🔍 Search completed: ${results.length} results found`);
    return results;
  }

  /**
   * Clean up cache to prevent memory leaks
   */
  cleanupCache() {
    if (this.cache.size > this.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      console.log(`🧹 Cleaned up cache, removed page ${oldestKey}`);
    }
  }

  /**
   * Extract categories from data
   */
  extractCategories(data) {
    const categories = new Set();
    data.forEach(item => {
      if (item.category) {
        item.category.forEach(cat => categories.add(cat.name));
      }
    });
    return Array.from(categories).sort();
  }

  /**
   * Extract years from data
   */
  extractYears(data) {
    const years = new Set();
    data.forEach(item => {
      if (item.year) {
        years.add(item.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  /**
   * Extract countries from data
   */
  extractCountries(data) {
    const countries = new Set();
    data.forEach(item => {
      if (item.country) {
        item.country.forEach(country => countries.add(country.name));
      }
    });
    return Array.from(countries).sort();
  }

  /**
   * Subscribe to pagination events
   */
  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Notify observers of events
   */
  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Observer error:', error);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedPages: Array.from(this.cache.keys()).sort(),
      cacheSize: this.cache.size,
      maxCacheSize: this.cacheSize,
      loadingPages: Array.from(this.loadingPages)
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }
}

// Export singleton instance
export const dataPagination = new DataPagination({
  itemsPerPage: 100,
  cacheSize: 5,
  baseUrl: './data/chunks/'
});

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  window.DataPagination = DataPagination;
  window.dataPagination = dataPagination;
}
