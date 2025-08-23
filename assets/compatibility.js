/**
 * 🌐 UNIVERSAL COMPATIBILITY LAYER
 * Support for all browsers from IE11+ to modern browsers
 * Compatible with all devices: Desktop, Mobile, Tablet, TV, etc.
 */

(function() {
  'use strict';

  // ===========================================
  // 🔍 FEATURE DETECTION (NOT BROWSER DETECTION)
  // ===========================================

  window.CompatibilityLayer = {
    features: {},
    init: function() {
      this.detectFeatures();
      this.loadPolyfills();
      this.setupFallbacks();
      console.log('🌐 Compatibility Layer initialized');
    },

    detectFeatures: function() {
      var features = this.features;
      
      // Core JavaScript Features
      features.es6 = typeof Symbol !== 'undefined';
      features.es6Arrow = (function() { try { eval('()=>{}'); return true; } catch(e) { return false; } })();
      features.es6Template = (function() { try { eval('`test`'); return true; } catch(e) { return false; } })();
      features.es6Destructuring = (function() { try { eval('var {a} = {a:1}'); return true; } catch(e) { return false; } })();
      features.es6Spread = (function() { try { eval('[...["a"]]'); return true; } catch(e) { return false; } })();
      
      // DOM Features
      features.querySelector = 'querySelector' in document;
      features.addEventListener = 'addEventListener' in window;
      features.classList = 'classList' in document.createElement('div');
      features.dataset = 'dataset' in document.createElement('div');
      
      // CSS Features
      features.cssGrid = CSS && CSS.supports && CSS.supports('display', 'grid');
      features.cssFlexbox = CSS && CSS.supports && CSS.supports('display', 'flex');
      features.cssTransitions = CSS && CSS.supports && CSS.supports('transition', 'opacity 1s');
      features.cssTransforms = CSS && CSS.supports && CSS.supports('transform', 'translateX(1px)');
      features.cssVariables = CSS && CSS.supports && CSS.supports('--test', '0');
      
      // Network Features
      features.fetch = 'fetch' in window;
      features.xhr = 'XMLHttpRequest' in window;
      features.websocket = 'WebSocket' in window;
      
      // Storage Features  
      features.localStorage = (function() {
        try { return 'localStorage' in window && window.localStorage !== null; } catch(e) { return false; }
      })();
      features.sessionStorage = (function() {
        try { return 'sessionStorage' in window && window.sessionStorage !== null; } catch(e) { return false; }
      })();
      features.indexedDB = 'indexedDB' in window;
      
      // Media Features
      features.video = !!document.createElement('video').canPlayType;
      features.audio = !!document.createElement('audio').canPlayType;
      features.canvas = !!document.createElement('canvas').getContext;
      
      // Mobile Features
      features.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      features.orientation = 'orientation' in window;
      features.deviceMotion = 'DeviceMotionEvent' in window;
      features.vibration = 'vibrate' in navigator;
      
      // PWA Features
      features.serviceWorker = 'serviceWorker' in navigator;
      features.pushNotifications = 'PushManager' in window;
      features.backgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
      
      // Performance Features
      features.performance = 'performance' in window;
      features.requestAnimationFrame = 'requestAnimationFrame' in window;
      features.intersectionObserver = 'IntersectionObserver' in window;
      features.resizeObserver = 'ResizeObserver' in window;
      
      console.log('🔍 Feature Detection Complete:', features);
    },

    // ===========================================
    // 🛠️ POLYFILLS FOR LEGACY BROWSERS
    // ===========================================

    loadPolyfills: function() {
      this.polyfillObject();
      this.polyfillArray();
      this.polyfillString();
      this.polyfillPromise();
      this.polyfillFetch();
      this.polyfillDOM();
      this.polyfillCSS();
      this.polyfillIntersectionObserver();
      console.log('🛠️ Polyfills loaded');
    },

    // Object polyfills
    polyfillObject: function() {
      if (!Object.assign) {
        Object.assign = function(target) {
          if (target == null) throw new TypeError('Cannot convert undefined or null to object');
          var to = Object(target);
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            if (source != null) {
              for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                  to[key] = source[key];
                }
              }
            }
          }
          return to;
        };
      }

      if (!Object.keys) {
        Object.keys = function(obj) {
          var keys = [];
          for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              keys.push(key);
            }
          }
          return keys;
        };
      }
    },

    // Array polyfills
    polyfillArray: function() {
      if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
          for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
          }
        };
      }

      if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {
          var result = [];
          for (var i = 0; i < this.length; i++) {
            result[i] = callback.call(thisArg, this[i], i, this);
          }
          return result;
        };
      }

      if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback, thisArg) {
          var result = [];
          for (var i = 0; i < this.length; i++) {
            if (callback.call(thisArg, this[i], i, this)) {
              result.push(this[i]);
            }
          }
          return result;
        };
      }

      if (!Array.prototype.find) {
        Array.prototype.find = function(callback, thisArg) {
          for (var i = 0; i < this.length; i++) {
            if (callback.call(thisArg, this[i], i, this)) {
              return this[i];
            }
          }
          return undefined;
        };
      }

      if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement, fromIndex) {
          return this.indexOf(searchElement, fromIndex) !== -1;
        };
      }

      if (!Array.from) {
        Array.from = function(arrayLike, mapFn, thisArg) {
          var result = [];
          var length = parseInt(arrayLike.length) || 0;
          for (var i = 0; i < length; i++) {
            var value = arrayLike[i];
            if (mapFn) {
              value = mapFn.call(thisArg, value, i);
            }
            result.push(value);
          }
          return result;
        };
      }
    },

    // String polyfills
    polyfillString: function() {
      if (!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
          if (typeof start !== 'number') start = 0;
          return this.indexOf(search, start) !== -1;
        };
      }

      if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(search, pos) {
          return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
        };
      }

      if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(search, this_len) {
          if (this_len === undefined || this_len > this.length) {
            this_len = this.length;
          }
          return this.substring(this_len - search.length, this_len) === search;
        };
      }

      if (!String.prototype.trim) {
        String.prototype.trim = function() {
          return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
      }
    },

    // Promise polyfill (simplified)
    polyfillPromise: function() {
      if (!window.Promise) {
        window.Promise = function(executor) {
          var self = this;
          this.state = 'pending';
          this.value = undefined;
          this.handlers = [];

          function resolve(result) {
            if (self.state === 'pending') {
              self.state = 'fulfilled';
              self.value = result;
              self.handlers.forEach(function(handler) {
                handler.onFulfilled(result);
              });
              self.handlers = [];
            }
          }

          function reject(error) {
            if (self.state === 'pending') {
              self.state = 'rejected';
              self.value = error;
              self.handlers.forEach(function(handler) {
                handler.onRejected(error);
              });
              self.handlers = [];
            }
          }

          this.then = function(onFulfilled, onRejected) {
            return new Promise(function(resolve, reject) {
              function handle() {
                if (self.state === 'fulfilled') {
                  if (onFulfilled) {
                    try {
                      resolve(onFulfilled(self.value));
                    } catch (ex) {
                      reject(ex);
                    }
                  } else {
                    resolve(self.value);
                  }
                } else if (self.state === 'rejected') {
                  if (onRejected) {
                    try {
                      resolve(onRejected(self.value));
                    } catch (ex) {
                      reject(ex);
                    }
                  } else {
                    reject(self.value);
                  }
                }
              }

              if (self.state === 'pending') {
                self.handlers.push({
                  onFulfilled: function(result) {
                    if (onFulfilled) {
                      try {
                        resolve(onFulfilled(result));
                      } catch (ex) {
                        reject(ex);
                      }
                    } else {
                      resolve(result);
                    }
                  },
                  onRejected: function(error) {
                    if (onRejected) {
                      try {
                        resolve(onRejected(error));
                      } catch (ex) {
                        reject(ex);
                      }
                    } else {
                      reject(error);
                    }
                  }
                });
              } else {
                setTimeout(handle, 0);
              }
            });
          };

          this.catch = function(onRejected) {
            return this.then(null, onRejected);
          };

          try {
            executor(resolve, reject);
          } catch (ex) {
            reject(ex);
          }
        };

        Promise.resolve = function(value) {
          return new Promise(function(resolve) {
            resolve(value);
          });
        };

        Promise.reject = function(reason) {
          return new Promise(function(resolve, reject) {
            reject(reason);
          });
        };

        Promise.all = function(promises) {
          return new Promise(function(resolve, reject) {
            var results = [];
            var completed = 0;
            
            if (promises.length === 0) {
              resolve(results);
              return;
            }

            promises.forEach(function(promise, index) {
              Promise.resolve(promise).then(function(value) {
                results[index] = value;
                completed++;
                if (completed === promises.length) {
                  resolve(results);
                }
              }).catch(reject);
            });
          });
        };
      }
    },

    // Fetch polyfill (simplified)
    polyfillFetch: function() {
      if (!this.features.fetch && this.features.xhr) {
        window.fetch = function(url, options) {
          return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            options = options || {};
            
            xhr.open(options.method || 'GET', url, true);
            
            if (options.headers) {
              for (var key in options.headers) {
                xhr.setRequestHeader(key, options.headers[key]);
              }
            }

            xhr.onload = function() {
              var response = {
                ok: xhr.status >= 200 && xhr.status < 300,
                status: xhr.status,
                statusText: xhr.statusText,
                text: function() {
                  return Promise.resolve(xhr.responseText);
                },
                json: function() {
                  return Promise.resolve(JSON.parse(xhr.responseText));
                }
              };
              resolve(response);
            };

            xhr.onerror = function() {
              reject(new Error('Network Error'));
            };

            xhr.send(options.body || null);
          });
        };
      }
    },

    // DOM polyfills
    polyfillDOM: function() {
      // querySelector for IE7+
      if (!this.features.querySelector) {
        document.querySelector = function(selector) {
          var elements = document.querySelectorAll(selector);
          return elements.length > 0 ? elements[0] : null;
        };
        
        document.querySelectorAll = function(selector) {
          var elements = [];
          if (selector.charAt(0) === '#') {
            var element = document.getElementById(selector.slice(1));
            if (element) elements.push(element);
          } else if (selector.charAt(0) === '.') {
            var className = selector.slice(1);
            var allElements = document.getElementsByTagName('*');
            for (var i = 0; i < allElements.length; i++) {
              if (allElements[i].className && allElements[i].className.indexOf(className) !== -1) {
                elements.push(allElements[i]);
              }
            }
          } else {
            elements = Array.prototype.slice.call(document.getElementsByTagName(selector));
          }
          return elements;
        };
      }

      // addEventListener for IE8+
      if (!this.features.addEventListener) {
        window.addEventListener = function(type, listener, useCapture) {
          window.attachEvent('on' + type, listener);
        };
        
        window.removeEventListener = function(type, listener, useCapture) {
          window.detachEvent('on' + type, listener);
        };
        
        Element.prototype.addEventListener = function(type, listener, useCapture) {
          this.attachEvent('on' + type, listener);
        };
        
        Element.prototype.removeEventListener = function(type, listener, useCapture) {
          this.detachEvent('on' + type, listener);
        };
      }

      // classList for IE9+
      if (!this.features.classList) {
        Object.defineProperty(Element.prototype, 'classList', {
          get: function() {
            var self = this;
            return {
              contains: function(className) {
                return self.className.indexOf(className) !== -1;
              },
              add: function(className) {
                if (!this.contains(className)) {
                  self.className = self.className.trim() + ' ' + className;
                }
              },
              remove: function(className) {
                var regex = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
                self.className = self.className.replace(regex, ' ').trim();
              },
              toggle: function(className) {
                if (this.contains(className)) {
                  this.remove(className);
                } else {
                  this.add(className);
                }
              }
            };
          }
        });
      }

      // requestAnimationFrame polyfill
      if (!this.features.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
          return setTimeout(callback, 1000 / 60);
        };
        
        window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
        };
      }
    },

    // CSS support checks and fallbacks
    polyfillCSS: function() {
      // CSS.supports polyfill for IE
      if (!window.CSS) {
        window.CSS = {};
      }
      
      if (!CSS.supports) {
        CSS.supports = function(property, value) {
          var element = document.createElement('div');
          element.style[property] = value;
          return element.style[property] === value;
        };
      }

      // Flexbox fallback using display: table
      if (!this.features.cssFlexbox) {
        var style = document.createElement('style');
        style.textContent = `
          .flex-fallback {
            display: table !important;
            width: 100%;
          }
          .flex-fallback > * {
            display: table-cell !important;
            vertical-align: top;
          }
        `;
        document.head.appendChild(style);
      }

      // Grid fallback using float
      if (!this.features.cssGrid) {
        var gridStyle = document.createElement('style');
        gridStyle.textContent = `
          .grid-fallback {
            display: block !important;
          }
          .grid-fallback::after {
            content: "";
            display: table;
            clear: both;
          }
          .grid-fallback > * {
            float: left;
            width: 50%;
            box-sizing: border-box;
          }
        `;
        document.head.appendChild(gridStyle);
      }
    },

    // IntersectionObserver polyfill (simplified)
    polyfillIntersectionObserver: function() {
      if (!this.features.intersectionObserver) {
        window.IntersectionObserver = function(callback, options) {
          this.callback = callback;
          this.options = options || {};
          this.elements = [];
          
          var self = this;
          this.checkIntersection = function() {
            self.elements.forEach(function(element) {
              var rect = element.getBoundingClientRect();
              var isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
              
              self.callback([{
                target: element,
                isIntersecting: isIntersecting,
                intersectionRatio: isIntersecting ? 1 : 0
              }]);
            });
          };

          // Check on scroll and resize
          window.addEventListener('scroll', this.checkIntersection);
          window.addEventListener('resize', this.checkIntersection);
        };

        IntersectionObserver.prototype.observe = function(element) {
          this.elements.push(element);
          // Check immediately
          setTimeout(this.checkIntersection, 0);
        };

        IntersectionObserver.prototype.unobserve = function(element) {
          var index = this.elements.indexOf(element);
          if (index !== -1) {
            this.elements.splice(index, 1);
          }
        };

        IntersectionObserver.prototype.disconnect = function() {
          this.elements = [];
          window.removeEventListener('scroll', this.checkIntersection);
          window.removeEventListener('resize', this.checkIntersection);
        };
      }
    },

    // ===========================================
    // 🎯 FALLBACK STRATEGIES
    // ===========================================

    setupFallbacks: function() {
      this.setupStorageFallback();
      this.setupMediaFallback();
      this.setupNetworkFallback();
      this.setupPerformanceFallback();
      console.log('🎯 Fallbacks configured');
    },

    setupStorageFallback: function() {
      if (!this.features.localStorage) {
        window.localStorage = {
          getItem: function(key) {
            return this[key] || null;
          },
          setItem: function(key, value) {
            this[key] = String(value);
          },
          removeItem: function(key) {
            delete this[key];
          },
          clear: function() {
            for (var key in this) {
              if (this.hasOwnProperty(key)) {
                delete this[key];
              }
            }
          }
        };
      }
    },

    setupMediaFallback: function() {
      // Video fallback for old browsers
      if (!this.features.video) {
        window.VideoFallback = {
          createFallback: function(container, videoUrl) {
            container.innerHTML = '<p>🎬 Video không được hỗ trợ trên trình duyệt này. <a href="' + videoUrl + '" target="_blank">Xem trực tiếp</a></p>';
          }
        };
      }
    },

    setupNetworkFallback: function() {
      // Network status for old browsers
      if (!('onLine' in navigator)) {
        navigator.onLine = true;
      }
      
      // Connectivity fallback
      window.NetworkFallback = {
        isOnline: function() {
          return navigator.onLine;
        },
        detectSpeed: function(callback) {
          var startTime = Date.now();
          var img = new Image();
          img.onload = function() {
            var speed = (Date.now() - startTime) < 1000 ? 'fast' : 'slow';
            callback(speed);
          };
          img.onerror = function() {
            callback('offline');
          };
          img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }
      };
    },

    setupPerformanceFallback: function() {
      if (!this.features.performance) {
        window.performance = {
          now: function() {
            return Date.now();
          },
          mark: function() {},
          measure: function() {}
        };
      }
    },

    // ===========================================
    // 📱 DEVICE OPTIMIZATION
    // ===========================================

    optimizeForDevice: function() {
      var userAgent = navigator.userAgent.toLowerCase();
      var device = {
        mobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
        tablet: /ipad|android(?!.*mobile)/i.test(userAgent),
        desktop: true,
        ios: /iphone|ipad|ipod/i.test(userAgent),
        android: /android/i.test(userAgent),
        oldAndroid: /android [1-3]/i.test(userAgent),
        ie: /msie|trident/i.test(userAgent),
        oldIE: /msie [6-9]/i.test(userAgent)
      };

      device.desktop = !device.mobile && !device.tablet;

      // Performance optimizations for old/slow devices
      if (device.oldAndroid || device.oldIE) {
        this.enableLowPerformanceMode();
      }

      // Touch optimizations
      if (device.mobile || device.tablet) {
        this.optimizeForTouch();
      }

      return device;
    },

    enableLowPerformanceMode: function() {
      // Disable heavy animations
      var style = document.createElement('style');
      style.textContent = `
        * {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
      
      console.log('⚡ Low performance mode enabled');
    },

    optimizeForTouch: function() {
      // Add touch-friendly styles
      var touchStyle = document.createElement('style');
      touchStyle.textContent = `
        .btn, button, [role="button"] {
          min-height: 44px !important;
          min-width: 44px !important;
          touch-action: manipulation;
        }
        
        .card, .movie-item {
          cursor: pointer;
          -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
      `;
      document.head.appendChild(touchStyle);
      
      console.log('👆 Touch optimizations applied');
    },

    // ===========================================
    // 🛡️ ERROR HANDLING & LOGGING
    // ===========================================

    setupErrorHandling: function() {
      var self = this;
      
      window.addEventListener('error', function(e) {
        console.warn('🚨 JavaScript Error:', e.error);
        self.logCompatibilityIssue('js-error', e.error);
      });

      if (window.addEventListener) {
        window.addEventListener('unhandledrejection', function(e) {
          console.warn('🚨 Unhandled Promise Rejection:', e.reason);
          self.logCompatibilityIssue('promise-rejection', e.reason);
        });
      }
    },

    logCompatibilityIssue: function(type, error) {
      try {
        var issue = {
          type: type,
          error: error.toString(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          features: this.features
        };
        
        // Log to console for debugging
        console.log('📊 Compatibility Issue:', issue);
        
        // Could send to analytics here
      } catch (e) {
        // Silent fail
      }
    },

    // ===========================================
    // 🎮 INITIALIZATION
    // ===========================================

    start: function() {
      try {
        this.init();
        this.setupErrorHandling();
        var device = this.optimizeForDevice();
        
        console.log('🎉 Compatibility Layer Ready!');
        console.log('📱 Device:', device);
        console.log('🌐 Features:', this.features);
        
        // Dispatch ready event
        var event = document.createEvent ? document.createEvent('Events') : document.createEventObject();
        if (event.initEvent) {
          event.initEvent('compatibilityready', true, true);
        }
        
        if (document.dispatchEvent) {
          document.dispatchEvent(event);
        } else if (document.fireEvent) {
          document.fireEvent('oncompatibilityready', event);
        }
        
      } catch (error) {
        console.error('❌ Compatibility Layer initialization failed:', error);
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.CompatibilityLayer.start();
    });
  } else {
    // DOM already loaded
    setTimeout(function() {
      window.CompatibilityLayer.start();
    }, 0);
  }

})(); 