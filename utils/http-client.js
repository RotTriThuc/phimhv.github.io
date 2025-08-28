/**
 * 🌐 HTTP Client Utility
 * Centralized HTTP request handling với retry logic và error handling
 */

import https from 'https';
import { API_CONFIG, ERROR_MESSAGES } from '../config/constants.js';

export class HttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || API_CONFIG.BASE_URL;
    this.timeout = options.timeout || API_CONFIG.TIMEOUT;
    this.retryAttempts = options.retryAttempts || API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Thực hiện HTTP GET request với retry logic
   * @param {string} path - API endpoint path
   * @param {Object} params - Query parameters
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(path, params = {}, options = {}) {
    const url = this.buildUrl(path, params);
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * Thực hiện HTTP POST request
   * @param {string} path - API endpoint path  
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(path, data = {}, options = {}) {
    const url = this.buildUrl(path);
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  /**
   * Build URL với query parameters
   * @param {string} path - API path
   * @param {Object} params - Query parameters
   * @returns {string} Complete URL
   */
  buildUrl(path, params = {}) {
    const url = new URL(path, this.baseURL);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    
    return url.toString();
  }

  /**
   * Thực hiện HTTP request với retry logic
   * @param {string} url - Complete URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🌐 HTTP Request (attempt ${attempt}/${this.retryAttempts}): ${url}`);
        
        const response = await this.makeRequest(url, options);
        
        console.log(`✅ HTTP Success: ${response.status} ${response.statusText}`);
        return response.data;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ HTTP Request failed (attempt ${attempt}/${this.retryAttempts}):`, error.message);
        
        // Không retry cho client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          break;
        }
        
        // Delay trước khi retry
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    console.error(`❌ HTTP Request failed after ${this.retryAttempts} attempts:`, lastError.message);
    throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} (${lastError.message})`);
  }

  /**
   * Thực hiện HTTP request thực tế
   * @param {string} url - Complete URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response object
   */
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MovieApp/1.0)',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: this.timeout
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = data ? JSON.parse(data) : {};
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                status: res.statusCode,
                statusText: res.statusMessage,
                data: parsedData,
                headers: res.headers
              });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          } catch (parseError) {
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      });

      // Send request body for POST requests
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  /**
   * Delay utility for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch multiple URLs concurrently với rate limiting
   * @param {Array<string>} urls - Array of URLs to fetch
   * @param {number} concurrency - Max concurrent requests
   * @returns {Promise<Array>} Array of responses
   */
  async fetchMultiple(urls, concurrency = 5) {
    const results = [];
    const executing = [];
    
    for (const url of urls) {
      const promise = this.get(url).then(data => ({ url, data, error: null }))
        .catch(error => ({ url, data: null, error: error.message }));
      
      results.push(promise);
      
      if (urls.length >= concurrency) {
        executing.push(promise);
        
        if (executing.length >= concurrency) {
          await Promise.race(executing);
          executing.splice(executing.findIndex(p => p === promise), 1);
        }
      }
    }
    
    return Promise.all(results);
  }
}

// Export singleton instance
export const httpClient = new HttpClient();

// Export class for custom instances
export default HttpClient;
