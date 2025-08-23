/* Browser Compatibility Polyfills */
/* Đảm bảo tương thích với IE11 và các trình duyệt cũ */

(function() {
  'use strict';

  // 1. Object.assign polyfill
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target, varArgs) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // 2. Array.from polyfill
  if (!Array.from) {
    Array.from = function(arrayLike, mapFn, thisArg) {
      var C = this;
      var items = Object(arrayLike);
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }
      var mapFunction = arguments.length > 1 ? mapFn : void 0;
      var T;
      if (typeof mapFunction !== 'undefined') {
        if (typeof mapFunction !== 'function') {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }
        if (arguments.length > 2) {
          T = thisArg;
        }
      }
      var len = parseInt(items.length);
      var A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
      var k = 0;
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFunction) {
          A[k] = typeof T === 'undefined' ? mapFunction(kValue, k) : mapFunction.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }

  // 3. String.prototype.includes polyfill
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // 4. Array.prototype.includes polyfill
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      return this.indexOf(searchElement, fromIndex) !== -1;
    };
  }

  // 5. Promise polyfill (basic implementation)
  if (typeof Promise === 'undefined') {
    window.Promise = function(executor) {
      var self = this;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];

      function resolve(result) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function reject(error) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }

      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }

      this.then = function(onFulfilled, onRejected) {
        return new Promise(function(resolve, reject) {
          handle({
            onFulfilled: function(result) {
              try {
                var returnValue = onFulfilled(result);
                resolve(returnValue);
              } catch (ex) {
                reject(ex);
              }
            },
            onRejected: function(error) {
              try {
                var returnValue = onRejected(error);
                resolve(returnValue);
              } catch (ex) {
                reject(ex);
              }
            }
          });
        });
      };

      this.catch = function(onRejected) {
        return this.then(null, onRejected);
      };

      executor(resolve, reject);
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
  }

  // 6. Fetch polyfill (basic implementation)
  if (!window.fetch) {
    window.fetch = function(url, options) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        var method = (options && options.method) || 'GET';
        var headers = (options && options.headers) || {};
        var body = (options && options.body) || null;

        xhr.open(method, url, true);
        
        // Set headers
        for (var key in headers) {
          if (headers.hasOwnProperty(key)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        }

        xhr.onload = function() {
          var response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: {
              get: function(name) {
                return xhr.getResponseHeader(name);
              }
            },
            text: function() {
              return Promise.resolve(xhr.responseText);
            },
            json: function() {
              try {
                return Promise.resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                return Promise.reject(e);
              }
            }
          };
          resolve(response);
        };

        xhr.onerror = function() {
          reject(new TypeError('Network request failed'));
        };

        xhr.ontimeout = function() {
          reject(new TypeError('Network request timeout'));
        };

        xhr.send(body);
      });
    };
  }

  // 7. IntersectionObserver polyfill (basic)
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = function(callback, options) {
      this.callback = callback;
      this.options = options || {};
      this.observed = [];
      
      this.observe = function(element) {
        if (this.observed.indexOf(element) === -1) {
          this.observed.push(element);
          this.checkIntersection(element);
        }
      };
      
      this.unobserve = function(element) {
        var index = this.observed.indexOf(element);
        if (index !== -1) {
          this.observed.splice(index, 1);
        }
      };
      
      this.checkIntersection = function(element) {
        var self = this;
        setTimeout(function() {
          if (self.observed.indexOf(element) === -1) return;
          
          var rect = element.getBoundingClientRect();
          var isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isIntersecting) {
            self.callback([{
              target: element,
              isIntersecting: true,
              intersectionRatio: 1
            }]);
          }
          
          // Continue checking if still observed
          if (self.observed.indexOf(element) !== -1) {
            self.checkIntersection(element);
          }
        }, 100);
      };
      
      this.disconnect = function() {
        this.observed = [];
      };
    };
  }

  // 8. URLSearchParams polyfill
  if (!window.URLSearchParams) {
    window.URLSearchParams = function(search) {
      this.params = {};
      
      if (search) {
        if (search.charAt(0) === '?') {
          search = search.slice(1);
        }
        var pairs = search.split('&');
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('=');
          if (pair[0]) {
            this.params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
          }
        }
      }
      
      this.get = function(name) {
        return this.params[name] || null;
      };
      
      this.set = function(name, value) {
        this.params[name] = value;
      };
      
      this.toString = function() {
        var pairs = [];
        for (var key in this.params) {
          if (this.params.hasOwnProperty(key)) {
            pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(this.params[key]));
          }
        }
        return pairs.join('&');
      };
    };
  }

  // 9. Element.closest polyfill
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      var element = this;
      while (element && element.nodeType === 1) {
        if (element.matches && element.matches(selector)) {
          return element;
        }
        element = element.parentNode;
      }
      return null;
    };
  }

  // 10. Element.matches polyfill
  if (!Element.prototype.matches) {
    Element.prototype.matches = 
      Element.prototype.matchesSelector || 
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector || 
      Element.prototype.oMatchesSelector || 
      Element.prototype.webkitMatchesSelector ||
      function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s);
        var i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
  }

  // 11. classList polyfill for IE9+
  if (!document.documentElement.classList) {
    (function() {
      var regExp = function(name) {
        return new RegExp('(^| )' + name + '( |$)');
      };
      var forEach = function(list, fn, scope) {
        for (var i = 0; i < list.length; i++) {
          fn.call(scope, list[i]);
        }
      };

      function ClassList(element) {
        this.element = element;
      }

      ClassList.prototype = {
        add: function() {
          forEach(arguments, function(name) {
            if (!this.contains(name)) {
              this.element.className += ' ' + name;
            }
          }, this);
        },
        remove: function() {
          forEach(arguments, function(name) {
            this.element.className = this.element.className.replace(regExp(name), ' ');
          }, this);
        },
        toggle: function(name, force) {
          if (force !== undefined) {
            if (force) {
              this.add(name);
            } else {
              this.remove(name);
            }
            return force;
          } else {
            if (this.contains(name)) {
              this.remove(name);
              return false;
            } else {
              this.add(name);
              return true;
            }
          }
        },
        contains: function(name) {
          return regExp(name).test(this.element.className);
        }
      };

      window.DOMTokenList = ClassList;
      
      function defineElementGetter(obj, prop, getter) {
        if (Object.defineProperty) {
          Object.defineProperty(obj, prop, {
            get: getter
          });
        }
      }

      defineElementGetter(Element.prototype, 'classList', function() {
        return new ClassList(this);
      });
    })();
  }

  // 12. Object.entries polyfill
  if (!Object.entries) {
    Object.entries = function(obj) {
      var entries = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          entries.push([key, obj[key]]);
        }
      }
      return entries;
    };
  }

  // 13. Object.keys polyfill
  if (!Object.keys) {
    Object.keys = function(obj) {
      var keys = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys;
    };
  }

  // 14. Performance.now polyfill
  if (!window.performance || !window.performance.now) {
    window.performance = window.performance || {};
    window.performance.now = function() {
      return Date.now();
    };
  }

  // 15. requestAnimationFrame polyfill
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 16); // ~60fps
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }

  // 16. Console polyfill for IE
  if (!window.console) {
    window.console = {
      log: function() {},
      warn: function() {},
      error: function() {},
      info: function() {},
      debug: function() {}
    };
  }

  // 17. JSON polyfill for very old browsers
  if (!window.JSON) {
    window.JSON = {
      parse: function(str) {
        return eval('(' + str + ')');
      },
      stringify: function(obj) {
        if (obj === null) return 'null';
        if (typeof obj === 'undefined') return undefined;
        if (typeof obj === 'string') return '"' + obj.replace(/"/g, '\\"') + '"';
        if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
        if (obj instanceof Array) {
          var arr = [];
          for (var i = 0; i < obj.length; i++) {
            arr.push(JSON.stringify(obj[i]));
          }
          return '[' + arr.join(',') + ']';
        }
        if (typeof obj === 'object') {
          var pairs = [];
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              pairs.push(JSON.stringify(key) + ':' + JSON.stringify(obj[key]));
            }
          }
          return '{' + pairs.join(',') + '}';
        }
        return '{}';
      }
    };
  }

  console.log('🔧 Browser polyfills loaded successfully!');
  
})(); 