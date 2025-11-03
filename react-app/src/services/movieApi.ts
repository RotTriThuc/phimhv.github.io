/**
 * Movie API Service
 * 
 * Service để tương tác với KKPhim/PhimAPI
 * Documentation: https://kkphim.com/tai-lieu-api
 * 
 * Features:
 * - Danh sách phim với filters
 * - Tìm kiếm phim
 * - Chi tiết phim & episodes
 * - Image optimization (WebP)
 * - Full TypeScript support
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Base URLs
const API_BASE_URL = 'https://phimapi.com';
const API_V1_URL = `${API_BASE_URL}/v1/api`;

// Types
export interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  content: string;
  type: string;
  status: string;
  poster_url: string;
  thumb_url: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string;
  showtimes: string;
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: Array<{ id: string; name: string; slug: string }>;
  country: Array<{ id: string; name: string; slug: string }>;
  modified: {
    time: string;
  };
}

export interface Episode {
  server_name: string;
  server_data: Array<{
    name: string;
    slug: string;
    filename: string;
    link_embed: string;
    link_m3u8: string;
  }>;
}

export interface MovieDetail extends Movie {
  episodes: Episode[];
}

export interface ApiResponse<T> {
  status: boolean;
  msg: string;
  data: {
    seoOnPage: {
      titleHead: string;
      descriptionHead: string;
      og_type: string;
      og_image: string[];
    };
    breadCrumb: Array<{
      name: string;
      slug?: string;
      isCurrent?: boolean;
      position: number;
    }>;
    titlePage: string;
    items: T[];
    params: {
      type_slug: string;
      filterCategory: string[];
      filterCountry: string[];
      filterYear: string;
      filterType: string;
      sortField: string;
      sortType: string;
      pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        totalPages: number;
      };
    };
    type_list: string;
    APP_DOMAIN_FRONTEND: string;
    APP_DOMAIN_CDN_IMAGE: string;
  };
}

// Direct API Response (for V1 endpoints like phim-moi-cap-nhat)
export interface DirectApiResponse<T> {
  status: boolean;
  msg: string;
  items: T[];
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface SearchParams {
  keyword?: string;
  page?: number;
  limit?: number;
  sort_field?: 'modified.time' | '_id' | 'year';
  sort_type?: 'desc' | 'asc';
  sort_lang?: 'vietsub' | 'thuyet-minh' | 'long-tieng';
  category?: string;
  country?: string;
  year?: number;
}

class MovieApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Optimize image URL to WebP format
   * Documentation: https://kkphim.com/tai-lieu-api#chuyen-doi-anh
   */
  optimizeImage(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // If already optimized or is a data URL, return as-is
    if (imageUrl.includes('image.php') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    // Ensure we have full URL for the optimization API
    let fullUrl = imageUrl;
    
    // If it's a relative path, prepend the CDN domain
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      // Remove leading slash if present
      const cleanPath = imageUrl.replace(/^\//, '');
      fullUrl = `https://phimimg.com/${cleanPath}`;
    }

    // Optimize to WebP with full URL
    return `${API_BASE_URL}/image.php?url=${encodeURIComponent(fullUrl)}`;
  }

  /**
   * Build query params for API calls
   */
  private buildQueryParams(params: SearchParams): string {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort_field) queryParams.append('sort_field', params.sort_field);
    if (params.sort_type) queryParams.append('sort_type', params.sort_type);
    if (params.sort_lang) queryParams.append('sort_lang', params.sort_lang);
    if (params.category) queryParams.append('category', params.category);
    if (params.country) queryParams.append('country', params.country);
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.keyword) queryParams.append('keyword', params.keyword);

    return queryParams.toString();
  }

  /**
   * Lấy danh sách phim mới cập nhật
   * Documentation: https://kkphim.com/tai-lieu-api#phim-moi-cap-nhat
   * 
   * Note: This endpoint returns DirectApiResponse (items at root level)
   */
  async getNewMovies(page: number = 1): Promise<DirectApiResponse<Movie>> {
    const response = await this.api.get(`/danh-sach/phim-moi-cap-nhat?page=${page}`);
    return response.data;
  }

  /**
   * Lấy danh sách phim theo loại
   * Documentation: https://kkphim.com/tai-lieu-api#tong-hop-danh-sach
   */
  async getMoviesByType(
    type: 'phim-bo' | 'phim-le' | 'tv-shows' | 'hoat-hinh' | 'phim-vietsub' | 'phim-thuyet-minh' | 'phim-long-tieng',
    params?: SearchParams
  ): Promise<ApiResponse<Movie>> {
    const queryString = this.buildQueryParams(params || {});
    const url = `${API_V1_URL}/danh-sach/${type}${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  /**
   * Tìm kiếm phim
   * Documentation: https://kkphim.com/tai-lieu-api#tim-kiem
   */
  async searchMovies(params: SearchParams): Promise<ApiResponse<Movie>> {
    const queryString = this.buildQueryParams(params);
    const response = await this.api.get(`${API_V1_URL}/tim-kiem?${queryString}`);
    return response.data;
  }

  /**
   * Lấy chi tiết phim theo slug
   * Documentation: https://kkphim.com/tai-lieu-api#thong-tin-phim
   * 
   * Note: API returns episodes OUTSIDE movie object:
   * { status, msg, movie: {...}, episodes: [...] }
   */
  async getMovieDetail(slug: string): Promise<{ status: boolean; msg: string; movie: Movie; episodes: Episode[] }> {
    const response = await this.api.get(`/phim/${slug}`);
    return response.data;
  }

  /**
   * Lấy phim theo thể loại
   * Documentation: https://kkphim.com/tai-lieu-api#the-loai
   */
  async getMoviesByCategory(categorySlug: string, params?: SearchParams): Promise<ApiResponse<Movie>> {
    const queryString = this.buildQueryParams(params || {});
    const url = `${API_V1_URL}/the-loai/${categorySlug}${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  /**
   * Lấy phim theo quốc gia
   * Documentation: https://kkphim.com/tai-lieu-api#quoc-gia
   */
  async getMoviesByCountry(countrySlug: string, params?: SearchParams): Promise<ApiResponse<Movie>> {
    const queryString = this.buildQueryParams(params || {});
    const url = `${API_V1_URL}/quoc-gia/${countrySlug}${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  /**
   * Lấy phim theo năm
   * Documentation: https://kkphim.com/tai-lieu-api#nam
   */
  async getMoviesByYear(year: number, params?: SearchParams): Promise<ApiResponse<Movie>> {
    const queryString = this.buildQueryParams(params || {});
    const url = `${API_V1_URL}/nam/${year}${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  /**
   * Lấy danh sách thể loại
   */
  async getCategories(): Promise<any> {
    const response = await this.api.get('/the-loai');
    return response.data;
  }

  /**
   * Lấy danh sách quốc gia
   */
  async getCountries(): Promise<any> {
    const response = await this.api.get('/quoc-gia');
    return response.data;
  }
}

// Export singleton instance
export const movieApi = new MovieApiService();

export default movieApi;

