/* ES5 Helper Functions for Compatibility */
/* Thay thế các tính năng ES6+ bằng ES5 syntax */

(function(window) {
  'use strict';

  // Helper to simulate async/await pattern with Promises
  window.asyncHandler = function(promiseFunction) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      return promiseFunction.apply(this, args)
        .catch(function(error) {
          console.error('Async operation failed:', error);
          throw error;
        });
    };
  };

  // Helper for template literals
  window.templateLiteral = function(strings, values) {
    var result = strings[0];
    for (var i = 1; i < strings.length; i++) {
      result += (values[i - 1] || '') + strings[i];
    }
    return result;
  };

  // Helper for destructuring assignment
  window.destructure = function(obj, keys) {
    var result = {};
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = obj[keys[i]];
    }
    return result;
  };

  // Helper for arrow functions - bind context helper
  window.arrowBind = function(fn, context) {
    return function() {
      return fn.apply(context, arguments);
    };
  };

  // Map polyfill if not available
  if (!window.Map) {
    window.Map = function() {
      this._keys = [];
      this._values = [];
      this.size = 0;
    };

    window.Map.prototype.set = function(key, value) {
      var index = this._keys.indexOf(key);
      if (index === -1) {
        this._keys.push(key);
        this._values.push(value);
        this.size++;
      } else {
        this._values[index] = value;
      }
      return this;
    };

    window.Map.prototype.get = function(key) {
      var index = this._keys.indexOf(key);
      return index === -1 ? undefined : this._values[index];
    };

    window.Map.prototype.has = function(key) {
      return this._keys.indexOf(key) !== -1;
    };

    window.Map.prototype.delete = function(key) {
      var index = this._keys.indexOf(key);
      if (index !== -1) {
        this._keys.splice(index, 1);
        this._values.splice(index, 1);
        this.size--;
        return true;
      }
      return false;
    };

    window.Map.prototype.clear = function() {
      this._keys = [];
      this._values = [];
      this.size = 0;
    };

    window.Map.prototype.forEach = function(callback, thisArg) {
      for (var i = 0; i < this._keys.length; i++) {
        callback.call(thisArg, this._values[i], this._keys[i], this);
      }
    };

    window.Map.prototype.entries = function() {
      var entries = [];
      for (var i = 0; i < this._keys.length; i++) {
        entries.push([this._keys[i], this._values[i]]);
      }
      return entries;
    };
  }

  // Set polyfill if not available
  if (!window.Set) {
    window.Set = function() {
      this._values = [];
      this.size = 0;
    };

    window.Set.prototype.add = function(value) {
      if (this._values.indexOf(value) === -1) {
        this._values.push(value);
        this.size++;
      }
      return this;
    };

    window.Set.prototype.has = function(value) {
      return this._values.indexOf(value) !== -1;
    };

    window.Set.prototype.delete = function(value) {
      var index = this._values.indexOf(value);
      if (index !== -1) {
        this._values.splice(index, 1);
        this.size--;
        return true;
      }
      return false;
    };

    window.Set.prototype.clear = function() {
      this._values = [];
      this.size = 0;
    };

    window.Set.prototype.forEach = function(callback, thisArg) {
      for (var i = 0; i < this._values.length; i++) {
        callback.call(thisArg, this._values[i], this._values[i], this);
      }
    };
  }

  // Helper for modern URL constructor
  if (!window.URL) {
    window.URL = function(url, base) {
      // Basic URL implementation
      var link = document.createElement('a');
      link.href = base ? base + '/' + url : url;
      
      this.href = link.href;
      this.protocol = link.protocol;
      this.host = link.host;
      this.hostname = link.hostname;
      this.port = link.port;
      this.pathname = link.pathname;
      this.search = link.search;
      this.hash = link.hash;
      this.origin = link.protocol + '//' + link.host;
      
      this.searchParams = new URLSearchParams(this.search);
      
      this.toString = function() {
        return this.href;
      };
    };
  }

  // Node.remove() polyfill
  if (!Element.prototype.remove) {
    Element.prototype.remove = function() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
  }

  // Node.isConnected polyfill
  if (!('isConnected' in Node.prototype)) {
    Object.defineProperty(Node.prototype, 'isConnected', {
      get: function() {
        return document.contains(this);
      }
    });
  }

  // Helper for default parameters
  window.defaultParam = function(value, defaultValue) {
    return typeof value !== 'undefined' ? value : defaultValue;
  };

  // Helper for rest parameters
  window.restParams = function(args, startIndex) {
    return Array.prototype.slice.call(args, startIndex || 0);
  };

  // Helper for spread operator
  window.spreadArray = function(array) {
    return Array.prototype.slice.call(array);
  };

  // Helper to convert for...of loops
  window.forEachPolyfill = function(iterable, callback) {
    if (Array.isArray(iterable)) {
      for (var i = 0; i < iterable.length; i++) {
        callback(iterable[i], i);
      }
    } else if (iterable && typeof iterable.forEach === 'function') {
      iterable.forEach(callback);
    } else {
      // Fallback for other iterables
      for (var key in iterable) {
        if (iterable.hasOwnProperty(key)) {
          callback(iterable[key], key);
        }
      }
    }
  };

  // Helper for const/let declarations (var hoisting simulation)
  window.createScope = function(callback) {
    return (function() {
      return callback.apply(this, arguments);
    });
  };

  // Feature detection helpers
  window.supportsFeature = {
    grid: function() {
      return CSS && CSS.supports && CSS.supports('display', 'grid');
    },
    
    flexbox: function() {
      return CSS && CSS.supports && CSS.supports('display', 'flex');
    },
    
    customProperties: function() {
      return CSS && CSS.supports && CSS.supports('color', 'var(--test)');
    },
    
    intersectionObserver: function() {
      return 'IntersectionObserver' in window;
    },
    
    fetch: function() {
      return 'fetch' in window;
    },
    
    promise: function() {
      return 'Promise' in window;
    },
    
    es6: function() {
      try {
        new Function('(a = 0) => a');
        return true;
      } catch (err) {
        return false;
      }
    }
  };

  // Safe async function wrapper
  window.safeAsync = function(asyncFn) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      var context = this;
      
      if (window.supportsFeature.promise()) {
        return Promise.resolve().then(function() {
          return asyncFn.apply(context, args);
        });
      } else {
        // Fallback for browsers without Promise
        try {
          return asyncFn.apply(context, args);
        } catch (error) {
          console.error('Operation failed:', error);
          return null;
        }
      }
    };
  };

  // Device capability detection
  window.deviceCapabilities = {
    isLowEnd: function() {
      // Detect low-end devices based on various factors
      var isLowRAM = navigator.deviceMemory && navigator.deviceMemory < 4;
      var isSlowConnection = navigator.connection && 
        (navigator.connection.effectiveType === 'slow-2g' || 
         navigator.connection.effectiveType === '2g');
      var isOldBrowser = !window.supportsFeature.es6();
      
      return isLowRAM || isSlowConnection || isOldBrowser;
    },
    
    reducedMotion: function() {
      return window.matchMedia && 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    
    isMobile: function() {
      return window.innerWidth <= 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
  };

  console.log('🔧 ES5 compatibility helpers loaded successfully!');

})(window); 