/* Internal Linking Optimizer - Improve SEO through strategic internal links */

import { Logger } from './logger.js';

// Internal linking configuration
const LINKING_CONFIG = {
  baseUrl: 'https://phimhv.site',
  
  // Important pages to link to
  importantPages: {
    home: { url: '/', anchor: 'Trang chủ', priority: 10 },
    search: { url: '/#/tim-kiem', anchor: 'Tìm kiếm anime', priority: 8 },
    categories: { url: '/#/the-loai', anchor: 'Thể loại anime', priority: 8 },
    newMovies: { url: '/#/phim-moi', anchor: 'Anime mới nhất', priority: 9 },
    series: { url: '/#/phim-bo', anchor: 'Anime series', priority: 7 },
    movies: { url: '/#/phim-le', anchor: 'Anime movie', priority: 7 },
    animation: { url: '/#/hoat-hinh', anchor: 'Hoạt hình', priority: 9 }
  },
  
  // Popular categories for linking
  popularCategories: [
    { slug: 'hanh-dong', name: 'Anime hành động', priority: 9 },
    { slug: 'phieu-luu', name: 'Anime phiêu lưu', priority: 8 },
    { slug: 'hai-huoc', name: 'Anime hài hước', priority: 8 },
    { slug: 'tinh-cam', name: 'Anime tình cảm', priority: 7 },
    { slug: 'khoa-hoc-vien-tuong', name: 'Anime sci-fi', priority: 7 },
    { slug: 'the-thao', name: 'Anime thể thao', priority: 6 },
    { slug: 'hoc-duong', name: 'Anime học đường', priority: 7 },
    { slug: 'sieu-nhien', name: 'Anime siêu nhiên', priority: 6 }
  ],
  
  // Keywords to automatically link
  autoLinkKeywords: {
    'one piece': { url: '/#/phim/one-piece', priority: 10 },
    'naruto': { url: '/#/phim/naruto', priority: 10 },
    'attack on titan': { url: '/#/phim/attack-on-titan', priority: 10 },
    'demon slayer': { url: '/#/phim/demon-slayer', priority: 9 },
    'my hero academia': { url: '/#/phim/my-hero-academia', priority: 9 },
    'dragon ball': { url: '/#/phim/dragon-ball-super', priority: 9 },
    'anime vietsub': { url: '/#/the-loai', priority: 8 },
    'xem anime': { url: '/', priority: 8 },
    'anime online': { url: '/', priority: 8 }
  }
};

// Internal Linking Optimizer class
export class InternalLinkingOptimizer {
  constructor() {
    this.processedPages = new Set();
    this.linkGraph = new Map();
    this.currentPageLinks = new Set();
    
    this.init();
  }

  init() {
    // Auto-optimize internal links when page loads
    this.optimizeCurrentPage();
    
    // Listen for navigation changes
    window.addEventListener('hashchange', () => {
      setTimeout(() => this.optimizeCurrentPage(), 100);
    });
    
    Logger.debug('🔗 Internal Linking Optimizer initialized');
  }

  // Optimize internal links on current page
  optimizeCurrentPage() {
    try {
      const currentPath = window.location.hash.slice(1) || '/';
      
      if (this.processedPages.has(currentPath)) {
        return; // Already processed
      }
      
      this.currentPageLinks.clear();
      
      // Add contextual links based on page type
      this.addContextualLinks(currentPath);
      
      // Add breadcrumb links
      this.addBreadcrumbLinks(currentPath);
      
      // Add related content links
      this.addRelatedContentLinks(currentPath);
      
      // Add footer navigation links
      this.addFooterNavigationLinks();
      
      // Process existing content for auto-linking
      this.processContentForAutoLinking();
      
      this.processedPages.add(currentPath);
      
      Logger.debug('🔗 Internal links optimized for:', currentPath);
    } catch (error) {
      Logger.error('❌ Failed to optimize internal links', error);
    }
  }

  // Add contextual links based on page type
  addContextualLinks(currentPath) {
    const container = this.getOrCreateLinkContainer('contextual-links');
    
    if (currentPath === '/') {
      // Homepage - add links to main sections
      this.addLinkToContainer(container, LINKING_CONFIG.importantPages.newMovies);
      this.addLinkToContainer(container, LINKING_CONFIG.importantPages.categories);
      this.addLinkToContainer(container, LINKING_CONFIG.importantPages.search);
    } else if (currentPath.startsWith('/phim/')) {
      // Movie detail page - add related links
      this.addLinkToContainer(container, LINKING_CONFIG.importantPages.categories);
      this.addLinkToContainer(container, LINKING_CONFIG.importantPages.newMovies);
      this.addLinkToContainer(container, LINKING_CONFIG.importantPages.home);
    } else if (currentPath.startsWith('/the-loai/')) {
      // Category page - add links to other categories
      this.addCategoryLinks(container, currentPath);
    } else if (currentPath.startsWith('/tim-kiem')) {
      // Search page - add popular categories
      this.addPopularCategoryLinks(container);
    }
  }

  // Add breadcrumb navigation links
  addBreadcrumbLinks(currentPath) {
    const breadcrumbContainer = this.getOrCreateBreadcrumbContainer();
    
    // Always start with home
    this.addBreadcrumbLink(breadcrumbContainer, 'Trang chủ', '/');
    
    if (currentPath.startsWith('/phim/')) {
      this.addBreadcrumbLink(breadcrumbContainer, 'Anime', '/#/the-loai');
      // Movie name would be added dynamically based on current movie
    } else if (currentPath.startsWith('/the-loai/')) {
      this.addBreadcrumbLink(breadcrumbContainer, 'Thể loại', '/#/the-loai');
      const category = currentPath.split('/')[2];
      if (category) {
        const categoryInfo = LINKING_CONFIG.popularCategories.find(c => c.slug === category);
        if (categoryInfo) {
          this.addBreadcrumbLink(breadcrumbContainer, categoryInfo.name, currentPath);
        }
      }
    } else if (currentPath.startsWith('/tim-kiem')) {
      this.addBreadcrumbLink(breadcrumbContainer, 'Tìm kiếm', currentPath);
    }
  }

  // Add related content links
  addRelatedContentLinks(currentPath) {
    const container = this.getOrCreateLinkContainer('related-links');
    
    // Add "You might also like" section
    const relatedTitle = document.createElement('h3');
    relatedTitle.textContent = 'Có thể bạn quan tâm';
    relatedTitle.className = 'related-links-title';
    container.appendChild(relatedTitle);
    
    // Add popular anime links
    const popularAnime = [
      { name: 'One Piece', url: '/#/phim/one-piece' },
      { name: 'Naruto', url: '/#/phim/naruto' },
      { name: 'Attack on Titan', url: '/#/phim/attack-on-titan' },
      { name: 'Demon Slayer', url: '/#/phim/demon-slayer' }
    ];
    
    popularAnime.forEach(anime => {
      if (!currentPath.includes(anime.url.split('/').pop())) {
        this.addLinkToContainer(container, {
          url: anime.url,
          anchor: anime.name,
          priority: 8
        });
      }
    });
  }

  // Add footer navigation links
  addFooterNavigationLinks() {
    const footer = document.querySelector('footer') || this.createFooter();
    const navContainer = this.getOrCreateLinkContainer('footer-nav', footer);
    
    // Add important page links
    Object.values(LINKING_CONFIG.importantPages).forEach(page => {
      this.addLinkToContainer(navContainer, page);
    });
    
    // Add popular category links
    LINKING_CONFIG.popularCategories.slice(0, 6).forEach(category => {
      this.addLinkToContainer(navContainer, {
        url: `/#/the-loai/${category.slug}`,
        anchor: category.name,
        priority: category.priority
      });
    });
  }

  // Process content for automatic keyword linking
  processContentForAutoLinking() {
    const contentElements = document.querySelectorAll('p, div.description, div.content');
    
    contentElements.forEach(element => {
      let html = element.innerHTML;
      let modified = false;
      
      Object.entries(LINKING_CONFIG.autoLinkKeywords).forEach(([keyword, linkInfo]) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const currentUrl = window.location.hash.slice(1) || '/';
        
        // Don't link to current page
        if (linkInfo.url.includes(currentUrl) || currentUrl.includes(linkInfo.url)) {
          return;
        }
        
        // Don't link if already linked
        if (html.toLowerCase().includes(`href="${linkInfo.url.toLowerCase()}"`)) {
          return;
        }
        
        const replacement = `<a href="${linkInfo.url}" class="auto-link" title="Xem ${keyword}">${keyword}</a>`;
        const newHtml = html.replace(regex, replacement);
        
        if (newHtml !== html) {
          html = newHtml;
          modified = true;
        }
      });
      
      if (modified) {
        element.innerHTML = html;
      }
    });
  }

  // Add category links
  addCategoryLinks(container, currentPath) {
    const currentCategory = currentPath.split('/')[2];
    
    LINKING_CONFIG.popularCategories.forEach(category => {
      if (category.slug !== currentCategory) {
        this.addLinkToContainer(container, {
          url: `/#/the-loai/${category.slug}`,
          anchor: category.name,
          priority: category.priority
        });
      }
    });
  }

  // Add popular category links
  addPopularCategoryLinks(container) {
    LINKING_CONFIG.popularCategories.slice(0, 8).forEach(category => {
      this.addLinkToContainer(container, {
        url: `/#/the-loai/${category.slug}`,
        anchor: category.name,
        priority: category.priority
      });
    });
  }

  // Utility methods
  getOrCreateLinkContainer(className, parent = document.body) {
    let container = parent.querySelector(`.${className}`);
    if (!container) {
      container = document.createElement('div');
      container.className = className;
      parent.appendChild(container);
    }
    return container;
  }

  getOrCreateBreadcrumbContainer() {
    let container = document.querySelector('.breadcrumb-nav');
    if (!container) {
      container = document.createElement('nav');
      container.className = 'breadcrumb-nav';
      container.setAttribute('aria-label', 'Breadcrumb');
      
      // Insert after header or at top of main content
      const header = document.querySelector('header');
      const main = document.querySelector('main') || document.body;
      
      if (header && header.nextSibling) {
        header.parentNode.insertBefore(container, header.nextSibling);
      } else {
        main.insertBefore(container, main.firstChild);
      }
    }
    return container;
  }

  createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    document.body.appendChild(footer);
    return footer;
  }

  addLinkToContainer(container, linkInfo) {
    const linkKey = linkInfo.url;
    if (this.currentPageLinks.has(linkKey)) {
      return; // Avoid duplicate links
    }
    
    const link = document.createElement('a');
    link.href = linkInfo.url;
    link.textContent = linkInfo.anchor;
    link.className = 'internal-link';
    link.setAttribute('data-priority', linkInfo.priority || 5);
    
    // Add SEO attributes
    link.setAttribute('title', linkInfo.anchor);
    
    container.appendChild(link);
    this.currentPageLinks.add(linkKey);
  }

  addBreadcrumbLink(container, text, url) {
    const item = document.createElement('span');
    item.className = 'breadcrumb-item';
    
    if (url && url !== window.location.hash.slice(1)) {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = text;
      link.className = 'breadcrumb-link';
      item.appendChild(link);
    } else {
      item.textContent = text;
      item.className += ' current';
    }
    
    // Add separator
    if (container.children.length > 0) {
      const separator = document.createElement('span');
      separator.textContent = ' › ';
      separator.className = 'breadcrumb-separator';
      container.appendChild(separator);
    }
    
    container.appendChild(item);
  }

  // Analytics and reporting
  getLinkingStats() {
    return {
      processedPages: this.processedPages.size,
      currentPageLinks: this.currentPageLinks.size,
      totalKeywords: Object.keys(LINKING_CONFIG.autoLinkKeywords).length,
      totalCategories: LINKING_CONFIG.popularCategories.length
    };
  }

  // Generate internal linking report
  generateLinkingReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.getLinkingStats(),
      linkGraph: Array.from(this.linkGraph.entries()),
      recommendations: this.generateRecommendations()
    };
    
    console.table(report.stats);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Check for orphaned pages
    if (this.processedPages.size < 5) {
      recommendations.push('Tăng số lượng trang được liên kết nội bộ');
    }
    
    // Check for link density
    if (this.currentPageLinks.size < 3) {
      recommendations.push('Thêm nhiều liên kết nội bộ hơn trên trang hiện tại');
    }
    
    return recommendations;
  }
}

// Global internal linking optimizer instance
export const internalLinkingOptimizer = new InternalLinkingOptimizer();

// Auto-optimize function
export function optimizeInternalLinks() {
  internalLinkingOptimizer.optimizeCurrentPage();
}

// Manual optimization trigger
if (typeof window !== 'undefined') {
  window.optimizeInternalLinks = optimizeInternalLinks;
}
