/**
 * 🎨 Theme Manager Component
 * Centralized theme management với dark/light mode support
 */

import { THEME_CONFIG, DEFAULTS } from '../config/constants.js';

export class ThemeManager {
  constructor(options = {}) {
    this.currentTheme = null;
    this.themes = {
      dark: THEME_CONFIG.DARK,
      light: THEME_CONFIG.LIGHT
    };
    this.storageKey = options.storageKey || 'app-theme';
    this.defaultTheme = options.defaultTheme || DEFAULTS.THEME;
    this.autoDetect = options.autoDetect !== false;
    
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Load saved theme or detect system preference
    const savedTheme = this.getSavedTheme();
    const systemTheme = this.getSystemTheme();
    const initialTheme = savedTheme || (this.autoDetect ? systemTheme : this.defaultTheme);
    
    this.setTheme(initialTheme);
    
    // Listen for system theme changes
    if (this.autoDetect) {
      this.watchSystemTheme();
    }
    
    console.log(`🎨 Theme Manager initialized: ${this.currentTheme}`);
  }

  /**
   * Set theme
   * @param {string} themeName - Theme name (dark/light)
   * @param {boolean} save - Save to localStorage
   */
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

  /**
   * Toggle between dark and light theme
   * @returns {string} New theme name
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get saved theme from localStorage
   * @returns {string|null} Saved theme name
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('⚠️ Cannot access localStorage for theme');
      return null;
    }
  }

  /**
   * Save theme to localStorage
   * @param {string} themeName - Theme name to save
   */
  saveTheme(themeName) {
    try {
      localStorage.setItem(this.storageKey, themeName);
    } catch (error) {
      console.warn('⚠️ Cannot save theme to localStorage');
    }
  }

  /**
   * Get system theme preference
   * @returns {string} System theme (dark/light)
   */
  getSystemTheme() {
    if (typeof window === 'undefined') return this.defaultTheme;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Watch for system theme changes
   */
  watchSystemTheme() {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only auto-switch if no theme is manually saved
      if (!this.getSavedTheme()) {
        const systemTheme = e.matches ? 'dark' : 'light';
        this.setTheme(systemTheme, false); // Don't save auto-detected theme
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
    }
  }

  /**
   * Update theme-color meta tag
   * @param {string} color - Theme color
   */
  updateThemeColorMeta(color) {
    let metaTag = document.querySelector('meta[name="theme-color"]');
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'theme-color';
      document.head.appendChild(metaTag);
    }
    
    metaTag.content = color;
  }

  /**
   * Dispatch theme change event
   * @param {string} themeName - New theme name
   */
  dispatchThemeChangeEvent(themeName) {
    const event = new CustomEvent('themechange', {
      detail: {
        theme: themeName,
        previousTheme: this.currentTheme
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Register custom theme
   * @param {string} name - Theme name
   * @param {Object} variables - CSS variables
   */
  registerTheme(name, variables) {
    this.themes[name] = variables;
    console.log(`🎨 Custom theme registered: ${name}`);
  }

  /**
   * Get theme variables
   * @param {string} themeName - Theme name
   * @returns {Object|null} Theme variables
   */
  getThemeVariables(themeName) {
    return this.themes[themeName] || null;
  }

  /**
   * Get all available themes
   * @returns {Array} Theme names
   */
  getAvailableThemes() {
    return Object.keys(this.themes);
  }

  /**
   * Apply custom CSS variables
   * @param {Object} variables - CSS variables to apply
   * @param {boolean} temporary - Don't save changes
   */
  applyCustomVariables(variables, temporary = false) {
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    if (!temporary) {
      // Merge with current theme
      this.themes[this.currentTheme] = {
        ...this.themes[this.currentTheme],
        ...variables
      };
    }
  }

  /**
   * Reset to default theme
   */
  resetTheme() {
    this.setTheme(this.defaultTheme);
    
    // Clear saved theme
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('⚠️ Cannot clear saved theme');
    }
  }

  /**
   * Get CSS for theme
   * @param {string} themeName - Theme name
   * @returns {string} CSS string
   */
  getThemeCSS(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return '';
    
    const cssRules = Object.entries(theme)
      .map(([property, value]) => `  ${property}: ${value};`)
      .join('\n');
    
    return `:root {\n${cssRules}\n}`;
  }

  /**
   * Export current theme configuration
   * @returns {Object} Theme configuration
   */
  exportThemeConfig() {
    return {
      currentTheme: this.currentTheme,
      themes: { ...this.themes },
      savedTheme: this.getSavedTheme(),
      systemTheme: this.getSystemTheme()
    };
  }

  /**
   * Create theme toggle button
   * @param {Object} options - Button options
   * @returns {HTMLElement} Theme toggle button
   */
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
    
    // Listen for theme changes from other sources
    window.addEventListener('themechange', updateButton);
    
    updateButton();
    return button;
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();

// Make it globally available
if (typeof window !== 'undefined') {
  window.themeManager = themeManager;
}

export default ThemeManager;
