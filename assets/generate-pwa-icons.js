/* PWA Icon Generator */
/* Generate all required PWA icons programmatically */

(function() {
  'use strict';

  // Icon sizes required for PWA
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  // Create canvas-based icons
  function createIcon(size, filename) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6c5ce7');
    gradient.addColorStop(0.5, '#5b6dff'); 
    gradient.addColorStop(1, '#764ba2');
    
    // Background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Rounded corners for modern look
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.15);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Movie icon
    const iconSize = size * 0.5;
    const x = (size - iconSize) / 2;
    const y = (size - iconSize) / 2;
    
    // Camera/Film icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = `${iconSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎬', size / 2, size / 2);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // Generate all icons
  function generateAllIcons() {
    console.log('🎨 Generating PWA icons...');
    
    iconSizes.forEach(size => {
      setTimeout(() => {
        createIcon(size, `icon-${size}x${size}.png`);
        console.log(`✅ Generated icon-${size}x${size}.png`);
      }, size); // Small delay between generations
    });
    
    // Generate shortcut icons
    setTimeout(() => {
      createShortcutIcon('shortcut-new.png', '🆕', '#00b894');
      createShortcutIcon('shortcut-saved.png', '❤️', '#e74c3c');
      createShortcutIcon('shortcut-categories.png', '📋', '#f39c12');
    }, 1000);
    
    console.log('🎉 All PWA icons generated! Please move them to assets/icons/ folder');
  }
  
  // Create shortcut icons
  function createShortcutIcon(filename, emoji, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 96, 96);
    
    // Rounded corners
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, 96, 96, 14);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Emoji
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 48, 48);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // Add to window for manual generation
  window.generatePWAIcons = generateAllIcons;
  
  // Auto-generate when page loads (for development)
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    console.log('🎨 PWA Icon Generator loaded. Run generatePWAIcons() to generate icons.');
  }

})(); 