/* Utility Functions - DOM manipulation, helpers, and common functions */

import { Logger } from './logger.js';

// DOM Utilities
export function createEl(tag, className = '', textContent = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

export function safeRemove(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

export function extractItems(data) {
  if (!data) return [];
  
  // Handle different API response structures
  if (data.data && Array.isArray(data.data.items)) {
    return data.data.items;
  }
  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  
  return [];
}

// URL and Navigation Utilities
export function parseHash() {
  const hash = window.location.hash.slice(1) || '/';
  const [path, search] = hash.split('?');
  const params = new URLSearchParams(search || '');
  return { path, params };
}

export function navigateTo(hash) {
  window.location.hash = hash;
}

export function updateUrl(params) {
  const { path } = parseHash();
  const newParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      newParams.set(key, value);
    }
  });
  
  const newHash = newParams.toString() ? `${path}?${newParams.toString()}` : path;
  window.location.hash = newHash;
}

// Theme Management
export function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Update theme toggle button if exists
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update theme toggle button
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  }
  
  Logger.debug('Theme changed to:', newTheme);
}

// Notification System
export function showNotification(options) {
  const { message, type = 'info', duration = 4000 } = options;
  
  // Remove existing notifications
  document.querySelectorAll('.notification').forEach(n => n.remove());
  
  const notification = createEl('div', `notification notification--${type}`);
  notification.innerHTML = `
    <div class="notification__content">
      <span class="notification__message">${message}</span>
      <button class="notification__close" aria-label="Đóng">×</button>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Auto remove
  const autoRemove = setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
  
  // Manual close
  const closeBtn = notification.querySelector('.notification__close');
  closeBtn.addEventListener('click', () => {
    clearTimeout(autoRemove);
    notification.remove();
  });
  
  // Animate in
  requestAnimationFrame(() => {
    notification.classList.add('notification--show');
  });
}

// Format utilities
export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    Logger.warn('Invalid date format:', dateString);
    return dateString;
  }
}

export function formatNumber(num) {
  if (!num || isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Debounce utility
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Local Storage utilities with error handling
export function getFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    Logger.warn('Failed to get from localStorage:', key, error);
    return defaultValue;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    Logger.warn('Failed to set to localStorage:', key, error);
    return false;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    Logger.warn('Failed to remove from localStorage:', key, error);
    return false;
  }
}

// Error handling utilities
export function createErrorElement(message, retryCallback) {
  const errorEl = createEl('div', 'error-message');
  errorEl.innerHTML = `
    <div class="error-message__content">
      <span class="error-message__text">${message}</span>
      ${retryCallback ? '<button class="error-message__retry">Thử lại</button>' : ''}
    </div>
  `;
  
  if (retryCallback) {
    const retryBtn = errorEl.querySelector('.error-message__retry');
    retryBtn.addEventListener('click', retryCallback);
  }
  
  return errorEl;
}

// Loading utilities
export function createLoadingElement(text = 'Đang tải...') {
  const loadingEl = createEl('div', 'loading');
  loadingEl.innerHTML = `
    <div class="loading__spinner"></div>
    <div class="loading__text">${text}</div>
  `;
  return loadingEl;
}

// Validation utilities
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function sanitizeHtml(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Performance utilities
export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  Logger.debug(`Performance [${name}]:`, `${(end - start).toFixed(2)}ms`);
  return result;
}

export async function measureAsyncPerformance(name, fn) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  Logger.debug(`Async Performance [${name}]:`, `${(end - start).toFixed(2)}ms`);
  return result;
}
