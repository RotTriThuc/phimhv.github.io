/**
 * 🚨 Error Handler Utility
 * Centralized error handling với logging và user-friendly messages
 */

import { ERROR_MESSAGES } from '../config/constants.js';

export class ErrorHandler {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'error';
    this.enableConsoleLog = options.enableConsoleLog !== false;
    this.enableUserNotification = options.enableUserNotification !== false;
    this.errorLog = [];
    this.maxLogSize = options.maxLogSize || 100;
  }

  /**
   * Handle error với logging và user notification
   * @param {Error|string} error - Error object hoặc error message
   * @param {Object} context - Additional context information
   * @param {string} userMessage - User-friendly message
   * @returns {Object} Processed error object
   */
  handle(error, context = {}, userMessage = null) {
    const processedError = this.processError(error, context);
    
    // Log error
    this.logError(processedError);
    
    // Show user notification if enabled
    if (this.enableUserNotification && userMessage) {
      this.showUserNotification(userMessage, 'error');
    }
    
    return processedError;
  }

  /**
   * Process error object
   * @param {Error|string} error - Raw error
   * @param {Object} context - Context information
   * @returns {Object} Processed error
   */
  processError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();
    
    let processedError = {
      id: errorId,
      timestamp,
      context,
      stack: null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
    };

    if (error instanceof Error) {
      processedError = {
        ...processedError,
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code || null
      };
    } else if (typeof error === 'string') {
      processedError = {
        ...processedError,
        name: 'CustomError',
        message: error,
        code: null
      };
    } else {
      processedError = {
        ...processedError,
        name: 'UnknownError',
        message: 'An unknown error occurred',
        originalError: error,
        code: null
      };
    }

    return processedError;
  }

  /**
   * Log error to console và internal log
   * @param {Object} processedError - Processed error object
   */
  logError(processedError) {
    // Add to internal log
    this.errorLog.unshift(processedError);
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging
    if (this.enableConsoleLog) {
      const logMessage = `[${processedError.timestamp}] ${processedError.name}: ${processedError.message}`;
      
      if (processedError.context && Object.keys(processedError.context).length > 0) {
        console.error(logMessage, processedError.context);
      } else {
        console.error(logMessage);
      }
      
      if (processedError.stack && this.logLevel === 'debug') {
        console.error('Stack trace:', processedError.stack);
      }
    }
  }

  /**
   * Show user notification
   * @param {string} message - User message
   * @param {string} type - Notification type
   */
  showUserNotification(message, type = 'error') {
    // Browser environment
    if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification(message, type);
      return;
    }

    // Console fallback
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  /**
   * Generate unique error ID
   * @returns {string} Error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get error statistics
   * @returns {Object} Error stats
   */
  getStats() {
    const now = Date.now();
    const last24h = this.errorLog.filter(err => 
      now - new Date(err.timestamp).getTime() < 24 * 60 * 60 * 1000
    );
    
    const errorTypes = {};
    this.errorLog.forEach(err => {
      errorTypes[err.name] = (errorTypes[err.name] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsLast24h: last24h.length,
      errorTypes,
      oldestError: this.errorLog[this.errorLog.length - 1]?.timestamp,
      newestError: this.errorLog[0]?.timestamp
    };
  }

  /**
   * Get recent errors
   * @param {number} limit - Number of errors to return
   * @returns {Array} Recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(0, limit).map(err => ({
      id: err.id,
      timestamp: err.timestamp,
      name: err.name,
      message: err.message,
      context: err.context
    }));
  }

  /**
   * Clear error log
   * @returns {number} Number of errors cleared
   */
  clearLog() {
    const count = this.errorLog.length;
    this.errorLog = [];
    console.log(`🧹 Cleared ${count} errors from log`);
    return count;
  }

  /**
   * Handle network errors specifically
   * @param {Error} error - Network error
   * @param {string} url - Failed URL
   * @returns {Object} Processed error
   */
  handleNetworkError(error, url) {
    const context = { url, type: 'network' };
    let userMessage = ERROR_MESSAGES.NETWORK_ERROR;
    
    if (error.code === 'ENOTFOUND') {
      userMessage = 'Không thể kết nối đến server. Kiểm tra kết nối mạng.';
    } else if (error.code === 'ETIMEDOUT') {
      userMessage = 'Kết nối timeout. Vui lòng thử lại.';
    } else if (error.message.includes('404')) {
      userMessage = 'Không tìm thấy tài nguyên yêu cầu.';
    } else if (error.message.includes('500')) {
      userMessage = 'Lỗi server. Vui lòng thử lại sau.';
    }
    
    return this.handle(error, context, userMessage);
  }

  /**
   * Handle validation errors
   * @param {string} field - Field name
   * @param {string} value - Invalid value
   * @param {string} rule - Validation rule
   * @returns {Object} Processed error
   */
  handleValidationError(field, value, rule) {
    const error = new Error(`Validation failed for ${field}: ${rule}`);
    const context = { field, value, rule, type: 'validation' };
    const userMessage = ERROR_MESSAGES.VALIDATION_ERROR;
    
    return this.handle(error, context, userMessage);
  }

  /**
   * Handle Firebase errors
   * @param {Error} error - Firebase error
   * @param {string} operation - Operation that failed
   * @returns {Object} Processed error
   */
  handleFirebaseError(error, operation) {
    const context = { operation, type: 'firebase' };
    let userMessage = ERROR_MESSAGES.FIREBASE_ERROR;
    
    if (error.code === 'permission-denied') {
      userMessage = ERROR_MESSAGES.PERMISSION_DENIED;
    } else if (error.code === 'unavailable') {
      userMessage = 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại.';
    } else if (error.code === 'quota-exceeded') {
      userMessage = 'Đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.';
    }
    
    return this.handle(error, context, userMessage);
  }

  /**
   * Create error handler middleware for async functions
   * @param {Function} fn - Async function to wrap
   * @param {Object} options - Handler options
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, options = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const context = { 
          function: fn.name || 'anonymous',
          args: options.logArgs ? args : '[hidden]',
          type: 'async'
        };
        
        this.handle(error, context, options.userMessage);
        
        if (options.rethrow !== false) {
          throw error;
        }
        
        return options.fallbackValue || null;
      }
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler({
  logLevel: 'error',
  enableConsoleLog: true,
  enableUserNotification: true
});

export default ErrorHandler;
