/* Error Boundaries - React-style error handling for vanilla JS */

import { Logger } from './logger.js';
import { createEl, showNotification } from './utils.js';

// Error boundary class
export class ErrorBoundary {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      fallbackComponent: options.fallbackComponent || this.defaultFallback,
      onError: options.onError || this.defaultErrorHandler,
      retryCallback: options.retryCallback || null,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    };
    
    this.errorCount = 0;
    this.lastError = null;
    this.retryCount = 0;
    
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    // Wrap container to catch errors
    this.originalContent = this.container.innerHTML;
    
    // Add error event listener to container
    this.container.addEventListener('error', this.handleError.bind(this), true);
    
    // Add unhandled promise rejection listener
    this.container.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this), true);
  }

  handleError(event) {
    this.errorCount++;
    this.lastError = event.error || event;
    
    Logger.error('Error boundary caught error:', this.lastError);
    
    // Call custom error handler
    this.options.onError(this.lastError, this.errorCount);
    
    // Show fallback UI
    this.showFallback();
    
    // Prevent error from bubbling up
    event.preventDefault();
    event.stopPropagation();
  }

  handlePromiseRejection(event) {
    this.errorCount++;
    this.lastError = event.reason;
    
    Logger.error('Error boundary caught promise rejection:', this.lastError);
    
    // Call custom error handler
    this.options.onError(this.lastError, this.errorCount);
    
    // Show fallback UI
    this.showFallback();
    
    // Prevent unhandled rejection
    event.preventDefault();
  }

  showFallback() {
    // Clear container
    this.container.innerHTML = '';
    
    // Show fallback component
    const fallbackElement = this.options.fallbackComponent(this.lastError, this.retryCount);
    this.container.appendChild(fallbackElement);
  }

  defaultFallback(error, retryCount) {
    const fallback = createEl('div', 'error-boundary');
    
    fallback.innerHTML = `
      <div class="error-boundary__content">
        <div class="error-boundary__icon">⚠️</div>
        <div class="error-boundary__title">Có lỗi xảy ra</div>
        <div class="error-boundary__message">
          ${error?.message || 'Không thể tải nội dung này'}
        </div>
        <div class="error-boundary__details">
          <details>
            <summary>Chi tiết lỗi</summary>
            <pre class="error-boundary__stack">${error?.stack || 'Không có thông tin chi tiết'}</pre>
          </details>
        </div>
        <div class="error-boundary__actions">
          <button class="btn btn--primary error-boundary__retry">
            Thử lại ${retryCount > 0 ? `(${retryCount})` : ''}
          </button>
          <button class="btn btn--secondary error-boundary__reload">
            Tải lại trang
          </button>
        </div>
      </div>
    `;
    
    // Bind retry button
    const retryBtn = fallback.querySelector('.error-boundary__retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.retry());
    }
    
    // Bind reload button
    const reloadBtn = fallback.querySelector('.error-boundary__reload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => window.location.reload());
    }
    
    return fallback;
  }

  defaultErrorHandler(error, errorCount) {
    // Log error details
    Logger.error('Error boundary details:', {
      error: error.message,
      stack: error.stack,
      errorCount,
      timestamp: new Date().toISOString()
    });
    
    // Show notification for first few errors
    if (errorCount <= 2) {
      showNotification({
        message: `Lỗi: ${error.message}`,
        type: 'error',
        duration: 5000
      });
    }
    
    // Report to error tracking service (if available)
    if (window.errorTracker) {
      window.errorTracker.report(error, {
        context: 'error-boundary',
        errorCount,
        container: this.container.className
      });
    }
  }

  async retry() {
    if (this.retryCount >= this.options.maxRetries) {
      Logger.warn('Max retries reached for error boundary');
      showNotification({
        message: 'Đã thử lại tối đa. Vui lòng tải lại trang.',
        type: 'warning'
      });
      return;
    }
    
    this.retryCount++;
    
    // Show loading state
    this.container.innerHTML = `
      <div class="error-boundary-retry">
        <div class="loading-spinner"></div>
        <div class="loading-text">Đang thử lại...</div>
      </div>
    `;
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
    
    try {
      // Call retry callback if provided
      if (this.options.retryCallback) {
        await this.options.retryCallback();
      } else {
        // Default retry: restore original content
        this.container.innerHTML = this.originalContent;
      }
      
      // Reset error state on successful retry
      this.errorCount = 0;
      this.lastError = null;
      
      Logger.info('Error boundary retry successful');
      
    } catch (retryError) {
      Logger.error('Error boundary retry failed:', retryError);
      this.handleError({ error: retryError });
    }
  }

  reset() {
    this.errorCount = 0;
    this.lastError = null;
    this.retryCount = 0;
    this.container.innerHTML = this.originalContent;
  }

  destroy() {
    this.container.removeEventListener('error', this.handleError);
    this.container.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }
}

// Global error boundary manager
export class GlobalErrorBoundary {
  constructor() {
    this.boundaries = new Map();
    this.globalErrorCount = 0;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.globalErrorCount++;
      Logger.critical('Global error:', event.error);
      
      // Show critical error notification
      if (this.globalErrorCount <= 3) {
        showNotification({
          message: 'Ứng dụng gặp lỗi nghiêm trọng',
          type: 'error',
          duration: 10000
        });
      }
      
      // Auto-reload after too many errors
      if (this.globalErrorCount >= 5) {
        Logger.critical('Too many global errors, auto-reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    });

    // Global promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.globalErrorCount++;
      Logger.critical('Global promise rejection:', event.reason);
      
      // Prevent default browser behavior
      event.preventDefault();
    });

    // Network error handler
    window.addEventListener('offline', () => {
      showNotification({
        message: '📡 Mất kết nối mạng',
        type: 'warning',
        duration: 0 // Persistent until online
      });
    });

    window.addEventListener('online', () => {
      showNotification({
        message: '📡 Đã kết nối lại mạng',
        type: 'success',
        duration: 3000
      });
    });
  }

  createBoundary(container, options = {}) {
    const boundary = new ErrorBoundary(container, options);
    this.boundaries.set(container, boundary);
    return boundary;
  }

  removeBoundary(container) {
    const boundary = this.boundaries.get(container);
    if (boundary) {
      boundary.destroy();
      this.boundaries.delete(container);
    }
  }

  resetAllBoundaries() {
    this.boundaries.forEach(boundary => boundary.reset());
    this.globalErrorCount = 0;
  }

  getErrorStats() {
    const boundaryStats = Array.from(this.boundaries.values()).map(boundary => ({
      errorCount: boundary.errorCount,
      retryCount: boundary.retryCount,
      lastError: boundary.lastError?.message
    }));

    return {
      globalErrorCount: this.globalErrorCount,
      totalBoundaries: this.boundaries.size,
      boundaryStats
    };
  }
}

// Performance monitoring for error boundaries
export class ErrorBoundaryMonitor {
  constructor() {
    this.errorMetrics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByComponent: new Map(),
      recoveryRate: 0,
      averageRecoveryTime: 0
    };
    
    this.recoveryTimes = [];
  }

  recordError(error, component, recovered = false, recoveryTime = 0) {
    this.errorMetrics.totalErrors++;
    
    // Track by error type
    const errorType = error.constructor.name;
    this.errorMetrics.errorsByType.set(
      errorType,
      (this.errorMetrics.errorsByType.get(errorType) || 0) + 1
    );
    
    // Track by component
    this.errorMetrics.errorsByComponent.set(
      component,
      (this.errorMetrics.errorsByComponent.get(component) || 0) + 1
    );
    
    // Track recovery
    if (recovered && recoveryTime > 0) {
      this.recoveryTimes.push(recoveryTime);
      this.updateRecoveryMetrics();
    }
  }

  updateRecoveryMetrics() {
    const totalRecoveries = this.recoveryTimes.length;
    this.errorMetrics.recoveryRate = (totalRecoveries / this.errorMetrics.totalErrors) * 100;
    
    if (totalRecoveries > 0) {
      this.errorMetrics.averageRecoveryTime = 
        this.recoveryTimes.reduce((sum, time) => sum + time, 0) / totalRecoveries;
    }
  }

  getReport() {
    return {
      ...this.errorMetrics,
      errorsByType: Object.fromEntries(this.errorMetrics.errorsByType),
      errorsByComponent: Object.fromEntries(this.errorMetrics.errorsByComponent)
    };
  }

  printReport() {
    const report = this.getReport();
    
    Logger.info('\n🛡️ Error Boundary Report:');
    Logger.info(`Total Errors: ${report.totalErrors}`);
    Logger.info(`Recovery Rate: ${report.recoveryRate.toFixed(1)}%`);
    Logger.info(`Average Recovery Time: ${report.averageRecoveryTime.toFixed(0)}ms`);
    
    Logger.info('\nErrors by Type:');
    Object.entries(report.errorsByType).forEach(([type, count]) => {
      Logger.info(`  ${type}: ${count}`);
    });
    
    Logger.info('\nErrors by Component:');
    Object.entries(report.errorsByComponent).forEach(([component, count]) => {
      Logger.info(`  ${component}: ${count}`);
    });
  }
}

// Global instances
export const globalErrorBoundary = new GlobalErrorBoundary();
export const errorBoundaryMonitor = new ErrorBoundaryMonitor();

// Utility function to wrap components with error boundaries
export function withErrorBoundary(renderFunction, options = {}) {
  return async function wrappedRender(container, ...args) {
    // Create error boundary for this component
    const boundary = globalErrorBoundary.createBoundary(container, {
      ...options,
      retryCallback: () => renderFunction(container, ...args),
      onError: (error, errorCount) => {
        errorBoundaryMonitor.recordError(
          error,
          renderFunction.name || 'anonymous',
          false,
          0
        );
        
        if (options.onError) {
          options.onError(error, errorCount);
        }
      }
    });
    
    try {
      const startTime = performance.now();
      await renderFunction(container, ...args);
      
      // Record successful render
      const renderTime = performance.now() - startTime;
      Logger.debug(`Component ${renderFunction.name} rendered in ${renderTime.toFixed(2)}ms`);
      
    } catch (error) {
      // Error will be caught by boundary
      throw error;
    }
  };
}

// Auto-initialize global error boundary
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Logger.info('🛡️ Global error boundary initialized');
    });
  } else {
    Logger.info('🛡️ Global error boundary initialized');
  }
}
