/* Schema Markup Generator - Rich Snippets for better SERP visibility */

import { Logger } from './logger.js';

// Schema.org configuration
const SCHEMA_CONFIG = {
  baseUrl: 'https://phimhv.site',
  siteName: 'PhimHV',
  organization: {
    name: 'PhimHV',
    url: 'https://phimhv.site',
    logo: 'https://phimhv.site/assets/images/logo.png',
    description: 'Website xem anime online miễn phí chất lượng cao với phụ đề tiếng Việt'
  }
};

// Schema Markup Generator class
export class SchemaMarkupGenerator {
  constructor() {
    this.schemas = new Map();
    this.currentSchemas = new Set();
    
    this.init();
  }

  init() {
    // Add base organization schema
    this.addOrganizationSchema();
    
    // Add website schema
    this.addWebsiteSchema();
    
    Logger.debug('📋 Schema Markup Generator initialized');
  }

  // Organization Schema
  addOrganizationSchema() {
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SCHEMA_CONFIG.organization.name,
      url: SCHEMA_CONFIG.organization.url,
      logo: {
        '@type': 'ImageObject',
        url: SCHEMA_CONFIG.organization.logo,
        width: 512,
        height: 512
      },
      description: SCHEMA_CONFIG.organization.description,
      sameAs: [
        'https://facebook.com/phimhv',
        'https://twitter.com/phimhv',
        'https://youtube.com/phimhv'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: ['Vietnamese', 'English']
      }
    };

    this.addSchema('organization', organizationSchema);
  }

  // Website Schema with Search Action
  addWebsiteSchema() {
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SCHEMA_CONFIG.siteName,
      url: SCHEMA_CONFIG.baseUrl,
      description: 'Xem anime online miễn phí chất lượng HD với phụ đề tiếng Việt',
      inLanguage: 'vi-VN',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SCHEMA_CONFIG.baseUrl}/#/tim-kiem?keyword={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: SCHEMA_CONFIG.organization.name,
        url: SCHEMA_CONFIG.organization.url
      }
    };

    this.addSchema('website', websiteSchema);
  }

  // Movie/TV Series Schema for Anime
  addAnimeSchema(anime) {
    if (!anime || !anime.slug) return;

    const animeSchema = {
      '@context': 'https://schema.org',
      '@type': anime.type === 'series' ? 'TVSeries' : 'Movie',
      name: anime.name,
      alternateName: anime.origin_name,
      description: anime.content || `Xem ${anime.name} vietsub online chất lượng HD`,
      url: `${SCHEMA_CONFIG.baseUrl}/#/phim/${anime.slug}`,
      image: {
        '@type': 'ImageObject',
        url: anime.poster_url || anime.thumb_url,
        width: 300,
        height: 450
      },
      datePublished: anime.year ? `${anime.year}-01-01` : undefined,
      dateModified: anime.modified?.time || new Date().toISOString(),
      inLanguage: 'ja-JP',
      subtitleLanguage: 'vi-VN',
      
      // Genre information
      genre: anime.category?.map(cat => cat.name) || [],
      
      // Creator information
      creator: anime.director?.map(director => ({
        '@type': 'Person',
        name: director
      })) || [],
      
      // Actor information
      actor: anime.actor?.map(actor => ({
        '@type': 'Person',
        name: actor
      })) || [],
      
      // Country of origin
      countryOfOrigin: {
        '@type': 'Country',
        name: 'Japan'
      },
      
      // Content rating
      contentRating: this.getContentRating(anime),
      
      // Aggregate rating
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: anime.rating || '8.5',
        ratingCount: anime.ratingCount || '1000',
        bestRating: '10',
        worstRating: '1'
      },
      
      // Episode information for series
      ...(anime.type === 'series' && {
        numberOfEpisodes: anime.episode_total || anime.episode_current,
        numberOfSeasons: 1
      }),
      
      // Duration for movies
      ...(anime.type === 'single' && anime.time && {
        duration: this.convertTimeToISO8601(anime.time)
      }),
      
      // Production company
      productionCompany: {
        '@type': 'Organization',
        name: anime.studio || 'Unknown Studio'
      },
      
      // Distribution
      distribution: {
        '@type': 'Organization',
        name: SCHEMA_CONFIG.siteName
      }
    };

    this.addSchema(`anime-${anime.slug}`, animeSchema);
    return animeSchema;
  }

  // Episode Schema for individual episodes
  addEpisodeSchema(anime, episode) {
    if (!anime || !episode) return;

    const episodeSchema = {
      '@context': 'https://schema.org',
      '@type': 'TVEpisode',
      name: `${anime.name} - Tập ${episode.name}`,
      description: `Xem ${anime.name} tập ${episode.name} vietsub online HD`,
      url: `${SCHEMA_CONFIG.baseUrl}/#/xem-phim/${anime.slug}/${episode.slug}`,
      episodeNumber: episode.name,
      partOfSeries: {
        '@type': 'TVSeries',
        name: anime.name,
        url: `${SCHEMA_CONFIG.baseUrl}/#/phim/${anime.slug}`
      },
      datePublished: new Date().toISOString(),
      inLanguage: 'ja-JP',
      subtitleLanguage: 'vi-VN',
      thumbnailUrl: anime.thumb_url || anime.poster_url,
      
      // Video object
      video: {
        '@type': 'VideoObject',
        name: `${anime.name} - Tập ${episode.name}`,
        description: `Xem ${anime.name} tập ${episode.name} vietsub`,
        thumbnailUrl: anime.thumb_url,
        uploadDate: new Date().toISOString(),
        duration: 'PT24M', // Default 24 minutes for anime episode
        contentUrl: `${SCHEMA_CONFIG.baseUrl}/#/xem-phim/${anime.slug}/${episode.slug}`,
        embedUrl: `${SCHEMA_CONFIG.baseUrl}/#/xem-phim/${anime.slug}/${episode.slug}`,
        inLanguage: 'ja-JP',
        subtitleLanguage: 'vi-VN'
      }
    };

    this.addSchema(`episode-${anime.slug}-${episode.slug}`, episodeSchema);
    return episodeSchema;
  }

  // Breadcrumb Schema
  addBreadcrumbSchema(breadcrumbs) {
    if (!breadcrumbs || !Array.isArray(breadcrumbs)) return;

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${SCHEMA_CONFIG.baseUrl}${crumb.url}`
      }))
    };

    this.addSchema('breadcrumb', breadcrumbSchema);
    return breadcrumbSchema;
  }

  // Collection Page Schema (for category pages)
  addCollectionPageSchema(category, animes) {
    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Anime ${category} - PhimHV`,
      description: `Tuyển tập anime ${category} hay nhất với phụ đề tiếng Việt`,
      url: `${SCHEMA_CONFIG.baseUrl}/#/the-loai/${category}`,
      mainEntity: {
        '@type': 'ItemList',
        name: `Danh sách anime ${category}`,
        numberOfItems: animes?.length || 0,
        itemListElement: animes?.slice(0, 10).map((anime, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Movie',
            name: anime.name,
            url: `${SCHEMA_CONFIG.baseUrl}/#/phim/${anime.slug}`,
            image: anime.thumb_url || anime.poster_url
          }
        })) || []
      },
      isPartOf: {
        '@type': 'WebSite',
        name: SCHEMA_CONFIG.siteName,
        url: SCHEMA_CONFIG.baseUrl
      }
    };

    this.addSchema(`collection-${category}`, collectionSchema);
    return collectionSchema;
  }

  // Search Results Page Schema
  addSearchResultsSchema(keyword, results) {
    const searchSchema = {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: `Kết quả tìm kiếm: "${keyword}"`,
      description: `Tìm thấy ${results?.length || 0} anime phù hợp với từ khóa "${keyword}"`,
      url: `${SCHEMA_CONFIG.baseUrl}/#/tim-kiem?keyword=${encodeURIComponent(keyword)}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: results?.length || 0,
        itemListElement: results?.slice(0, 10).map((anime, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Movie',
            name: anime.name,
            url: `${SCHEMA_CONFIG.baseUrl}/#/phim/${anime.slug}`,
            image: anime.thumb_url || anime.poster_url
          }
        })) || []
      }
    };

    this.addSchema('search-results', searchSchema);
    return searchSchema;
  }

  // FAQ Schema for common questions
  addFAQSchema() {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'PhimHV có miễn phí không?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Có, PhimHV hoàn toàn miễn phí. Bạn có thể xem anime với phụ đề tiếng Việt mà không cần đăng ký tài khoản.'
          }
        },
        {
          '@type': 'Question',
          name: 'Anime trên PhimHV có phụ đề tiếng Việt không?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Có, tất cả anime trên PhimHV đều có phụ đề tiếng Việt chất lượng cao, được dịch thuật cẩn thận.'
          }
        },
        {
          '@type': 'Question',
          name: 'Tôi có thể xem anime trên điện thoại không?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Có, PhimHV tương thích với mọi thiết bị: điện thoại, máy tính bảng, laptop và smart TV.'
          }
        },
        {
          '@type': 'Question',
          name: 'PhimHV cập nhật anime mới như thế nào?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PhimHV cập nhật anime mới hàng ngày, bao gồm các tập mới và anime mới phát sóng.'
          }
        }
      ]
    };

    this.addSchema('faq', faqSchema);
    return faqSchema;
  }

  // Review Schema for anime ratings
  addReviewSchema(anime, review) {
    const reviewSchema = {
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Movie',
        name: anime.name,
        image: anime.poster_url || anime.thumb_url
      },
      author: {
        '@type': 'Person',
        name: review.author || 'PhimHV User'
      },
      datePublished: review.date || new Date().toISOString(),
      reviewBody: review.content,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: '10',
        worstRating: '1'
      }
    };

    this.addSchema(`review-${anime.slug}`, reviewSchema);
    return reviewSchema;
  }

  // Add schema to page
  addSchema(type, schemaData) {
    // Remove existing schema of same type
    this.removeSchema(type);

    // Create script element
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData, null, 2);
    script.dataset.schemaType = type;

    // Add to head
    document.head.appendChild(script);
    
    // Track schema
    this.schemas.set(type, script);
    this.currentSchemas.add(type);

    Logger.debug(`📋 Added ${type} schema markup`);
  }

  // Remove schema from page
  removeSchema(type) {
    if (this.schemas.has(type)) {
      const script = this.schemas.get(type);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      this.schemas.delete(type);
      this.currentSchemas.delete(type);
    }
  }

  // Clear all dynamic schemas (keep base schemas)
  clearDynamicSchemas() {
    const baseSchemas = ['organization', 'website', 'faq'];
    
    this.schemas.forEach((script, type) => {
      if (!baseSchemas.includes(type)) {
        this.removeSchema(type);
      }
    });
  }

  // Utility methods
  getContentRating(anime) {
    // Determine content rating based on categories
    const categories = anime.category?.map(cat => cat.name.toLowerCase()) || [];
    
    if (categories.some(cat => ['kinh dị', 'bạo lực', 'máu me'].includes(cat))) {
      return 'R';
    } else if (categories.some(cat => ['tình cảm', 'romance'].includes(cat))) {
      return 'PG-13';
    } else {
      return 'PG';
    }
  }

  convertTimeToISO8601(timeString) {
    // Convert time format like "120 phút" to ISO 8601 duration
    const match = timeString.match(/(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      return `PT${minutes}M`;
    }
    return 'PT90M'; // Default 90 minutes
  }

  // Auto-generate schemas based on current page
  autoGenerateSchemas() {
    const path = window.location.hash.slice(1) || '/';
    
    // Clear previous dynamic schemas
    this.clearDynamicSchemas();
    
    if (path === '/') {
      // Homepage - add FAQ schema
      this.addFAQSchema();
    } else if (path.startsWith('/phim/')) {
      // Anime detail page - schemas will be added when anime data loads
    } else if (path.startsWith('/the-loai/')) {
      // Category page - schema will be added when category data loads
    } else if (path.startsWith('/tim-kiem')) {
      // Search page - schema will be added when search results load
    }
  }

  // Validate schema markup
  validateSchemas() {
    const issues = [];
    
    this.schemas.forEach((script, type) => {
      try {
        const data = JSON.parse(script.textContent);
        
        // Basic validation
        if (!data['@context'] || !data['@type']) {
          issues.push(`${type}: Missing @context or @type`);
        }
        
        // Specific validations
        if (type === 'anime' && !data.name) {
          issues.push(`${type}: Missing required name property`);
        }
        
        if (type === 'organization' && !data.url) {
          issues.push(`${type}: Missing required url property`);
        }
        
      } catch (error) {
        issues.push(`${type}: Invalid JSON structure`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  // Get schema statistics
  getSchemaStats() {
    return {
      totalSchemas: this.schemas.size,
      activeSchemas: Array.from(this.currentSchemas),
      schemaTypes: Array.from(this.schemas.keys())
    };
  }

  // Export schemas for testing
  exportSchemas() {
    const exported = {};
    this.schemas.forEach((script, type) => {
      exported[type] = JSON.parse(script.textContent);
    });
    return exported;
  }
}

// Global schema markup generator instance
export const schemaMarkupGenerator = new SchemaMarkupGenerator();

// Auto-generate schemas on navigation
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    setTimeout(() => schemaMarkupGenerator.autoGenerateSchemas(), 100);
  });
  
  window.addEventListener('load', () => {
    schemaMarkupGenerator.autoGenerateSchemas();
  });
}

// Export functions for manual use
export function addAnimeSchema(anime) {
  return schemaMarkupGenerator.addAnimeSchema(anime);
}

export function addEpisodeSchema(anime, episode) {
  return schemaMarkupGenerator.addEpisodeSchema(anime, episode);
}

export function addBreadcrumbSchema(breadcrumbs) {
  return schemaMarkupGenerator.addBreadcrumbSchema(breadcrumbs);
}

export function addCollectionPageSchema(category, animes) {
  return schemaMarkupGenerator.addCollectionPageSchema(category, animes);
}

export function addSearchResultsSchema(keyword, results) {
  return schemaMarkupGenerator.addSearchResultsSchema(keyword, results);
}
