/**
 * 🩹 Final Patch for Remaining Issues
 * Fixes theme manager and other minor issues
 */

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyFinalPatch);
} else {
  applyFinalPatch();
}

function applyFinalPatch() {
  console.log('🩹 Applying final patch...');
  
  // Fix theme manager if it failed to initialize
  setTimeout(() => {
    if (window.themeManager && !window.themeManager.getCurrentTheme()) {
      console.log('🎨 Fixing theme manager...');
      
      // Force set default theme
      const savedTheme = localStorage.getItem('app-theme') || 'dark';
      
      // Apply theme directly to root
      const themes = {
        dark: {
          '--bg': '#0a0a0f',
          '--bg-elev': '#12121a', 
          '--card': '#1a1a24',
          '--border': '#2a2a35',
          '--text': '#e8e8ea',
          '--muted': '#a0a0a8',
          '--primary': '#6c5ce7',
          '--primary-700': '#584bd0',
          '--danger': '#ef5350',
          '--accent': '#00d3a7'
        },
        light: {
          '--bg': '#f7f8fa',
          '--bg-elev': '#ffffff',
          '--card': '#ffffff', 
          '--border': '#e9ecf1',
          '--text': '#15161a',
          '--muted': '#5b6572',
          '--primary': '#5b6dff',
          '--primary-700': '#4656e6',
          '--danger': '#e53935',
          '--accent': '#0bb'
        }
      };
      
      const theme = themes[savedTheme] || themes.dark;
      const root = document.documentElement;
      
      Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
      
      document.body.classList.add(`theme-${savedTheme}`);
      
      // Update theme manager state
      if (window.themeManager) {
        window.themeManager.currentTheme = savedTheme;
      }
      
      console.log(`🎨 Theme fixed: ${savedTheme}`);
    }
  }, 500);
  
  // Enhanced theme toggle function
  window.toggleTheme = function() {
    const currentTheme = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    const themes = {
      dark: {
        '--bg': '#0a0a0f',
        '--bg-elev': '#12121a', 
        '--card': '#1a1a24',
        '--border': '#2a2a35',
        '--text': '#e8e8ea',
        '--muted': '#a0a0a8',
        '--primary': '#6c5ce7',
        '--primary-700': '#584bd0',
        '--danger': '#ef5350',
        '--accent': '#00d3a7'
      },
      light: {
        '--bg': '#f7f8fa',
        '--bg-elev': '#ffffff',
        '--card': '#ffffff', 
        '--border': '#e9ecf1',
        '--text': '#15161a',
        '--muted': '#5b6572',
        '--primary': '#5b6dff',
        '--primary-700': '#4656e6',
        '--danger': '#e53935',
        '--accent': '#0bb'
      }
    };
    
    const theme = themes[newTheme];
    const root = document.documentElement;
    
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.classList.add(`theme-${newTheme}`);
    
    localStorage.setItem('app-theme', newTheme);
    
    if (window.themeManager) {
      window.themeManager.currentTheme = newTheme;
    }
    
    if (window.notificationManager) {
      const icon = newTheme === 'dark' ? '🌙' : '☀️';
      const message = newTheme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng';
      // window.notificationManager.success(`${icon} ${message}`, { duration: 2000 }); // DISABLED - no popup
      console.log(`🔕 Theme change notification disabled: ${icon} ${message}`);
    }
    
    console.log(`🎨 Theme switched to: ${newTheme}`);
    return newTheme;
  };
  
  // Fix theme toggle button if exists
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.onclick = window.toggleTheme;
    
    // Update button icon
    const updateThemeButton = () => {
      const isDark = document.body.classList.contains('theme-dark');
      themeToggle.innerHTML = isDark ? '☀️' : '🌙';
    };
    
    updateThemeButton();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateThemeButton);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  
  // Enhanced error handling for undefined functions
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message.includes('is not defined')) {
      console.warn('🚨 Undefined function error caught:', event.error.message);
      
      if (window.notificationManager) {
        // window.notificationManager.warning('Một tính năng tạm thời không khả dụng', { duration: 3000 }); // DISABLED - no popup
        console.log('🔕 Error notification disabled - no popup');
      }
      
      event.preventDefault(); // Prevent error from breaking the app
    }
  });
  
  // Suppress Firebase duplicate warnings
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('Firebase is already defined') || 
        message.includes('Firebase library is only loaded once')) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
  
  // Enhanced movie operations status check
  setTimeout(() => {
    if (window.enhancedMovieOps) {
      console.log('✅ Enhanced movie operations ready');
    }
    
    if (window.movieComments && window.movieComments.initialized) {
      console.log('✅ Firebase movie comments ready');
    }
    
    if (window.notificationManager) {
      console.log('✅ Notification system ready');
    }
    
    // Show success notification - POPUP DISABLED
    if (window.notificationManager) {
      // window.notificationManager.success('🎬 Tất cả tính năng đã sẵn sàng!', { duration: 3000 }); // DISABLED - no popup
      console.log('🔕 All features ready notification disabled - no popup');
    }
  }, 2000);
  
  console.log('✅ Final patch applied successfully');
}

// Export for potential use
window.applyFinalPatch = applyFinalPatch;
