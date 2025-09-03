/* Enhanced Production Logging System */

// Environment detection - Hide debug info but keep errors
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
const hideDebugInfo = true; // Hide sensitive debug info in production

// Professional logging system with levels and context
export const Logger = {
  // Hide debug/info logs that might contain sensitive data
  debug: (isDev && !hideDebugInfo) ? (...args) => console.log('🐛 [DEBUG]', ...args) : () => {},
  info: (isDev && !hideDebugInfo) ? (...args) => console.log('ℹ️ [INFO]', ...args) : () => {},

  // Always show warnings and errors for debugging issues
  warn: (...args) => console.warn('⚠️ [WARN]', ...args),
  error: (...args) => console.error('❌ [ERROR]', ...args),
  critical: (...args) => console.error('🚨 [CRITICAL]', ...args),
  
  // Performance tracking (development only)
  perf: isDev ? (label, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⚡ [PERF] ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  } : (label, fn) => fn(),
  
  // User-facing notifications (always enabled)
  user: (message, type = 'info') => {
    if (typeof showNotification === 'function') {
      showNotification({ message, type });
    }
  }
};

// Backward compatibility
export const log = {
  info: Logger.info,
  warn: Logger.warn,
  error: Logger.error
};

// Environment flag
export { isDev };
