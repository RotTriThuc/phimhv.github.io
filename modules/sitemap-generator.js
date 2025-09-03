/* Sitemap Generator - Dynamic XML sitemap generation for SEO */

import { Logger } from './logger.js';

// Sitemap configuration
const SITEMAP_CONFIG = {
  baseUrl: 'https://phimhv.site',
  defaultChangefreq: 'weekly',
  defaultPriority: '0.5',
  
  // Page priorities and change frequencies
  pageConfig: {
    '/': { priority: '1.0', changefreq: 'daily' },
    '/tim-kiem': { priority: '0.8', changefreq: 'weekly' },
    '/the-loai': { priority: '0.8', changefreq: 'weekly' },
    '/phim-da-luu': { priority: '0.6', changefreq: 'monthly' },
    '/phim-moi': { priority: '0.9', changefreq: 'daily' },
    '/phim-bo': { priority: '0.8', changefreq: 'weekly' },
    '/phim-le': { priority: '0.8', changefreq: 'weekly' },
    '/hoat-hinh': { priority: '0.9', changefreq: 'daily' }
  },
  
  // Categories and their priorities
  categories: [
    'hanh-dong', 'phieu-luu', 'hai-huoc', 'tinh-cam', 'kinh-di',
    'bi-an', 'khoa-hoc-vien-tuong', 'the-thao', 'am-nhac', 'hoc-duong',
    'sieu-nhien', 'lich-su', 'chien-tranh', 'drama', 'slice-of-life'
  ]
};

// Sitemap Generator class
export class SitemapGenerator {
  constructor() {
    this.urls = new Set();
    this.lastGenerated = null;
    this.movieData = null;
    
    this.init();
  }

  init() {
    Logger.debug('🗺️ Sitemap Generator initialized');
  }

  // Generate complete sitemap
  async generateSitemap(movieData = null) {
    try {
      this.movieData = movieData;
      this.urls.clear();
      
      // Add static pages
      this.addStaticPages();
      
      // Add category pages
      this.addCategoryPages();
      
      // Add movie pages
      if (movieData) {
        this.addMoviePages(movieData);
      }
      
      // Generate XML
      const sitemapXml = this.generateXML();
      
      // Save sitemap
      await this.saveSitemap(sitemapXml);
      
      this.lastGenerated = new Date();
      Logger.info('✅ Sitemap generated successfully', { urlCount: this.urls.size });
      
      return sitemapXml;
    } catch (error) {
      Logger.error('❌ Failed to generate sitemap', error);
      throw error;
    }
  }

  // Add static pages to sitemap
  addStaticPages() {
    Object.entries(SITEMAP_CONFIG.pageConfig).forEach(([path, config]) => {
      this.addUrl({
        loc: `${SITEMAP_CONFIG.baseUrl}${path === '/' ? '' : '/#' + path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: config.changefreq,
        priority: config.priority
      });
    });
  }

  // Add category pages to sitemap
  addCategoryPages() {
    SITEMAP_CONFIG.categories.forEach(category => {
      this.addUrl({
        loc: `${SITEMAP_CONFIG.baseUrl}/#/the-loai/${category}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      });
    });
  }

  // Add movie pages to sitemap
  addMoviePages(movieData) {
    if (!movieData || !Array.isArray(movieData)) {
      Logger.warn('⚠️ No movie data provided for sitemap');
      return;
    }

    movieData.forEach(movie => {
      if (!movie.slug) return;
      
      // Main movie page
      this.addUrl({
        loc: `${SITEMAP_CONFIG.baseUrl}/#/phim/${movie.slug}`,
        lastmod: this.getMovieLastMod(movie),
        changefreq: movie.episode_current ? 'daily' : 'weekly',
        priority: this.getMoviePriority(movie),
        image: movie.poster_url || movie.thumb_url
      });
      
      // Episode pages (if series)
      if (movie.episodes && Array.isArray(movie.episodes)) {
        movie.episodes.forEach(episode => {
          if (episode.server_data && Array.isArray(episode.server_data)) {
            episode.server_data.forEach(ep => {
              this.addUrl({
                loc: `${SITEMAP_CONFIG.baseUrl}/#/xem-phim/${movie.slug}/${ep.slug}`,
                lastmod: this.getMovieLastMod(movie),
                changefreq: 'monthly',
                priority: '0.6'
              });
            });
          }
        });
      }
    });
  }

  // Add URL to sitemap
  addUrl(urlData) {
    // Validate URL data
    if (!urlData.loc) return;
    
    // Avoid duplicates
    const urlKey = urlData.loc;
    if ([...this.urls].some(url => url.loc === urlKey)) return;
    
    this.urls.add({
      loc: urlData.loc,
      lastmod: urlData.lastmod || new Date().toISOString().split('T')[0],
      changefreq: urlData.changefreq || SITEMAP_CONFIG.defaultChangefreq,
      priority: urlData.priority || SITEMAP_CONFIG.defaultPriority,
      image: urlData.image || null
    });
  }

  // Get movie last modification date
  getMovieLastMod(movie) {
    if (movie.modified && movie.modified.time) {
      return new Date(movie.modified.time).toISOString().split('T')[0];
    }
    if (movie.year) {
      return `${movie.year}-01-01`;
    }
    return new Date().toISOString().split('T')[0];
  }

  // Calculate movie priority based on popularity and recency
  getMoviePriority(movie) {
    let priority = 0.5;
    
    // Boost for recent movies
    const currentYear = new Date().getFullYear();
    if (movie.year && movie.year >= currentYear - 1) {
      priority += 0.2;
    }
    
    // Boost for ongoing series
    if (movie.episode_current && movie.episode_total && 
        movie.episode_current < movie.episode_total) {
      priority += 0.1;
    }
    
    // Boost for popular categories
    if (movie.category) {
      const popularCategories = ['hanh-dong', 'phieu-luu', 'hai-huoc', 'tinh-cam'];
      const hasPopularCategory = movie.category.some(cat => 
        popularCategories.includes(cat.slug)
      );
      if (hasPopularCategory) {
        priority += 0.1;
      }
    }
    
    // Cap at 0.9 (reserve 1.0 for homepage)
    return Math.min(priority, 0.9).toFixed(1);
  }

  // Generate XML sitemap
  generateXML() {
    const urlsArray = Array.from(this.urls);
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
    
    urlsArray.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      
      // Add image if available
      if (url.image) {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${this.escapeXml(url.image)}</image:loc>\n`;
        xml += '    </image:image>\n';
      }
      
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    return xml;
  }

  // Escape XML special characters
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Save sitemap to file (for static hosting)
  async saveSitemap(xml) {
    try {
      // For client-side, we'll create a downloadable blob
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Store in localStorage for later use
      localStorage.setItem('sitemap_xml', xml);
      localStorage.setItem('sitemap_generated', new Date().toISOString());
      
      // Also expose globally for manual download
      window.sitemapXML = xml;
      window.downloadSitemap = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.click();
      };
      
      Logger.info('💾 Sitemap saved to localStorage and available for download');
    } catch (error) {
      Logger.error('❌ Failed to save sitemap', error);
    }
  }

  // Generate sitemap index for large sites
  generateSitemapIndex() {
    const sitemaps = [
      { loc: `${SITEMAP_CONFIG.baseUrl}/sitemap-main.xml`, lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITEMAP_CONFIG.baseUrl}/sitemap-movies.xml`, lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${SITEMAP_CONFIG.baseUrl}/sitemap-categories.xml`, lastmod: new Date().toISOString().split('T')[0] }
    ];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    sitemaps.forEach(sitemap => {
      xml += '  <sitemap>\n';
      xml += `    <loc>${sitemap.loc}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      xml += '  </sitemap>\n';
    });
    
    xml += '</sitemapindex>';
    
    return xml;
  }

  // Auto-update sitemap when movie data changes
  scheduleAutoUpdate() {
    // Update sitemap every 6 hours
    setInterval(() => {
      if (this.movieData) {
        this.generateSitemap(this.movieData);
      }
    }, 6 * 60 * 60 * 1000);
  }

  // Get sitemap stats
  getSitemapStats() {
    return {
      totalUrls: this.urls.size,
      lastGenerated: this.lastGenerated,
      categories: SITEMAP_CONFIG.categories.length,
      staticPages: Object.keys(SITEMAP_CONFIG.pageConfig).length
    };
  }

  // Validate sitemap
  validateSitemap() {
    const issues = [];
    
    // Check URL count (Google limit: 50,000)
    if (this.urls.size > 50000) {
      issues.push('Sitemap exceeds Google\'s 50,000 URL limit');
    }
    
    // Check for duplicate URLs
    const urlsArray = Array.from(this.urls);
    const uniqueUrls = new Set(urlsArray.map(url => url.loc));
    if (uniqueUrls.size !== urlsArray.length) {
      issues.push('Duplicate URLs found in sitemap');
    }
    
    // Check for invalid URLs
    urlsArray.forEach(url => {
      try {
        new URL(url.loc);
      } catch {
        issues.push(`Invalid URL: ${url.loc}`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
}

// Global sitemap generator instance
export const sitemapGenerator = new SitemapGenerator();

// Auto-generate sitemap when movie data is available
export function autoGenerateSitemap(movieData) {
  if (movieData && Array.isArray(movieData)) {
    sitemapGenerator.generateSitemap(movieData);
  }
}

// Manual sitemap generation function
export function generateSitemapManual() {
  // Try to get movie data from global scope or localStorage
  const movieData = window.movieData || 
                   JSON.parse(localStorage.getItem('movieData') || '[]');
  
  return sitemapGenerator.generateSitemap(movieData);
}
