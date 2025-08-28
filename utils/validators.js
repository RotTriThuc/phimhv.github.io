/**
 * 🔍 Validation Utility
 * Input validation và sanitization để improve security
 */

import { VALIDATION_RULES, ERROR_MESSAGES } from '../config/constants.js';

export class Validators {
  /**
   * Validate movie slug
   * @param {string} slug - Movie slug to validate
   * @returns {Object} Validation result
   */
  static validateMovieSlug(slug) {
    if (!slug || typeof slug !== 'string') {
      return { isValid: false, error: 'Slug is required and must be a string' };
    }

    if (slug.length < 2 || slug.length > 100) {
      return { isValid: false, error: 'Slug must be between 2 and 100 characters' };
    }

    if (!VALIDATION_RULES.MOVIE_SLUG.test(slug)) {
      return { isValid: false, error: 'Slug contains invalid characters' };
    }

    return { isValid: true, sanitized: slug.toLowerCase().trim() };
  }

  /**
   * Validate search keyword
   * @param {string} keyword - Search keyword
   * @returns {Object} Validation result
   */
  static validateSearchKeyword(keyword) {
    if (!keyword || typeof keyword !== 'string') {
      return { isValid: false, error: 'Keyword is required' };
    }

    const trimmed = keyword.trim();
    if (trimmed.length < 1) {
      return { isValid: false, error: 'Keyword cannot be empty' };
    }

    if (trimmed.length > 100) {
      return { isValid: false, error: 'Keyword too long (max 100 characters)' };
    }

    // Remove potentially dangerous characters
    const sanitized = trimmed
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' '); // Normalize whitespace

    return { isValid: true, sanitized };
  }

  /**
   * Validate comment content
   * @param {string} content - Comment content
   * @returns {Object} Validation result
   */
  static validateCommentContent(content) {
    if (!content || typeof content !== 'string') {
      return { isValid: false, error: ERROR_MESSAGES.COMMENT_TOO_SHORT };
    }

    const trimmed = content.trim();
    
    if (trimmed.length < 3) {
      return { isValid: false, error: ERROR_MESSAGES.COMMENT_TOO_SHORT };
    }

    if (trimmed.length > 500) {
      return { isValid: false, error: ERROR_MESSAGES.COMMENT_TOO_LONG };
    }

    // Basic content filtering
    const sanitized = this.sanitizeText(trimmed);
    
    // Check for spam patterns
    if (this.isSpamContent(sanitized)) {
      return { isValid: false, error: 'Content appears to be spam' };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate user name
   * @param {string} name - User name
   * @returns {Object} Validation result
   */
  static validateUserName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: ERROR_MESSAGES.NAME_REQUIRED };
    }

    const trimmed = name.trim();
    
    if (trimmed.length < 1) {
      return { isValid: false, error: ERROR_MESSAGES.NAME_REQUIRED };
    }

    if (trimmed.length > 30) {
      return { isValid: false, error: 'Name too long (max 30 characters)' };
    }

    // Remove HTML tags and dangerous characters
    const sanitized = trimmed
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"]/g, '') // Remove dangerous characters
      .substring(0, 30);

    if (sanitized.length < 1) {
      return { isValid: false, error: 'Name contains only invalid characters' };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate year
   * @param {string|number} year - Year value
   * @returns {Object} Validation result
   */
  static validateYear(year) {
    const yearStr = String(year).trim();
    
    if (!VALIDATION_RULES.YEAR.test(yearStr)) {
      return { isValid: false, error: 'Invalid year format' };
    }

    const yearNum = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();
    
    if (yearNum < 1900 || yearNum > currentYear + 2) {
      return { isValid: false, error: `Year must be between 1900 and ${currentYear + 2}` };
    }

    return { isValid: true, sanitized: yearNum };
  }

  /**
   * Validate page number
   * @param {string|number} page - Page number
   * @returns {Object} Validation result
   */
  static validatePageNumber(page) {
    const pageStr = String(page).trim();
    
    if (!/^\d+$/.test(pageStr)) {
      return { isValid: false, error: 'Page must be a positive integer' };
    }

    const pageNum = parseInt(pageStr, 10);
    
    if (pageNum < 1 || pageNum > 1000) {
      return { isValid: false, error: 'Page must be between 1 and 1000' };
    }

    return { isValid: true, sanitized: pageNum };
  }

  /**
   * Validate sync code
   * @param {string} code - Sync code
   * @returns {Object} Validation result
   */
  static validateSyncCode(code) {
    if (!code || typeof code !== 'string') {
      return { isValid: false, error: 'Sync code is required' };
    }

    const trimmed = code.trim();
    
    if (!VALIDATION_RULES.SYNC_CODE.test(trimmed)) {
      return { isValid: false, error: 'Sync code must be 6 digits' };
    }

    return { isValid: true, sanitized: trimmed };
  }

  /**
   * Sanitize text content
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  static sanitizeText(text) {
    if (typeof text !== 'string') return '';
    
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Check if content is spam
   * @param {string} content - Content to check
   * @returns {boolean} True if spam
   */
  static isSpamContent(content) {
    const spamPatterns = [
      /(.)\1{10,}/i, // Repeated characters
      /(https?:\/\/[^\s]+){3,}/i, // Multiple URLs
      /\b(buy|sale|discount|offer|deal|free|win|prize|money|cash|loan|credit)\b.*\b(now|today|click|visit|call)\b/i,
      /\b(viagra|cialis|pharmacy|casino|poker|lottery|bitcoin|crypto)\b/i
    ];

    return spamPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  static validateURL(url) {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
      }

      return { isValid: true, sanitized: urlObj.toString() };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate object against schema
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  static validateObject(obj, schema) {
    const errors = {};
    const sanitized = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = obj[key];
      
      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[key] = `${key} is required`;
        continue;
      }

      // Skip validation if field is optional and empty
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors[key] = `${key} must be of type ${rules.type}`;
        continue;
      }

      // Custom validator
      if (rules.validator) {
        const result = rules.validator(value);
        if (!result.isValid) {
          errors[key] = result.error;
          continue;
        }
        sanitized[key] = result.sanitized;
      } else {
        sanitized[key] = value;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Rate limiting validation
   * @param {string} identifier - Unique identifier (IP, user ID, etc.)
   * @param {number} maxRequests - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} Rate limit result
   */
  static checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create request log for identifier
    let requests = this.rateLimitStore.get(identifier) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: requests[0] + windowMs
      };
    }

    // Add current request
    requests.push(now);
    this.rateLimitStore.set(identifier, requests);

    return {
      allowed: true,
      remaining: maxRequests - requests.length,
      resetTime: now + windowMs
    };
  }
}

export default Validators;
