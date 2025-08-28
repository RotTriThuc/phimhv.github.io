/**
 * 🎨 Simple Theme Manager
 * Lightweight theme management for browser compatibility
 */

// Import browser-compatible constants
import { THEME_CONFIG, DEFAULTS } from '../config/browser-constants.js';

class SimpleThemeManager {
  constructor() {
    this.currentTheme = null;
    this.themes = {
      dark: THEME_CONFIG.DARK,
      light: THEME_CONFIG.LIGHT
    };
    this.storageKey = 'app-theme';
    this.defaultTheme = DEFAULTS.THEME;

    this.init();
  }

  init() {
    // Load saved theme or use default
    const savedTheme = this.getSavedTheme();
    const systemTheme = this.getSystemTheme();
    const initialTheme = savedTheme || systemTheme || this.defaultTheme;
    
    this.setTheme(initialTheme);
    
    // Listen for system theme changes
    this.watchSystemTheme();
    
    console.log(`🎨 Simple Theme Manager initialized: ${this.currentTheme}`);
  }

  setTheme(themeName, save = true) {
    if (!this.themes[themeName]) {
      console.warn(`⚠️ Unknown theme: ${themeName}`);
      return false;
    }

    const theme = this.themes[themeName];
    const root = document.documentElement;
    
    // Apply CSS variables
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Update body class
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${themeName}`);
    
    // Update theme-color meta tag
    this.updateThemeColorMeta(theme['--bg']);
    
    this.currentTheme = themeName;
    
    if (save) {
      this.saveTheme(themeName);
    }
    
    // Dispatch theme change event
    this.dispatchThemeChangeEvent(themeName);
    
    console.log(`🎨 Theme applied: ${themeName}`);
    return true;
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getSavedTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('⚠️ Cannot access localStorage for theme');
      return null;
    }
  }

  saveTheme(themeName) {
    try {
      localStorage.setItem(this.storageKey, themeName);
    } catch (error) {
      console.warn('⚠️ Cannot save theme to localStorage');
    }
  }

  getSystemTheme() {
    if (typeof window === 'undefined') return this.defaultTheme;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  watchSystemTheme() {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only auto-switch if no theme is manually saved
      if (!this.getSavedTheme()) {
        const systemTheme = e.matches ? 'dark' : 'light';
        this.setTheme(systemTheme, false);
      }
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
  }

  updateThemeColorMeta(color) {
    let metaTag = document.querySelector('meta[name="theme-color"]');
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      document.head.appendChild(metaTag);
    }
    
    metaTag.content = color;
  }

  dispatchThemeChangeEvent(themeName) {
    const event = new CustomEvent('themechange', {
      detail: {
        theme: themeName,
        previousTheme: this.currentTheme
      }
    });
    
    window.dispatchEvent(event);
  }

  createToggleButton(options = {}) {
    const button = document.createElement('button');
    button.className = options.className || 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.title = 'Chuyển đổi giao diện';
    
    const updateButton = () => {
      const isDark = this.currentTheme === 'dark';
      button.innerHTML = isDark ? '☀️' : '🌙';
      button.setAttribute('data-theme', this.currentTheme);
    };
    
    button.addEventListener('click', () => {
      this.toggleTheme();
      updateButton();
    });
    
    window.addEventListener('themechange', updateButton);
    
    updateButton();
    return button;
  }

  resetTheme() {
    this.setTheme(this.defaultTheme);
    
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('⚠️ Cannot clear saved theme');
    }
  }
}

// Create and export instance
const simpleThemeManager = new SimpleThemeManager();

// Make globally available
window.themeManager = simpleThemeManager;

export { simpleThemeManager as themeManager };
export default SimpleThemeManager;
