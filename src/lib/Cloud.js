(function() {
  'use strict';

  angular
  .module('ngMeumobi.Utils')
  .provider('meuCloud', meuCloudProvider)
  .factory('meuAPI', API);
  
  function meuCloudProvider() {
    
    var options = {},
        data = {};
    
    this.setOptions = function(opt) {
      angular.extend(options, opt);
    };

    this.setOption = function(name, value) {
      options[name] = value;
    };
    
    this.$get = meuCloud;
    
    function meuCloud($q, $window, $log, $exceptionHandler, meuUtils, meuAPI) {
    
/*
  Helpers
*/
      var Helpers = {
        lookup: function(array) {
          var token = 'id';
          // Identify if it's an array of items (item._id) or category (category.id)
          if (array[0] && array[0].hasOwnProperty('_id'))
            token = '_id';
          return Helpers.lookupByToken(array, token);
        },
        lookupByToken: function(array, token) {
          var lookup = [];
          for (var i = 0, len = array.length; i < len; i++) {
              lookup[array[i][token]] = array[i];
          }
          return lookup;
        },
        isFreshResponse: function(response) {
          var isFallback = response.hasOwnProperty('isFallback') ? response.isFallback : null;
          var unchanged = response.hasOwnProperty('unchanged') ? response.unchanged : null;
        
          return !(unchanged || isFallback);
        },
        getCategoriesTree: function(categories) {
          var children = [];
          children[0] = [];
          for(var key in categories) {
            var parent_id = categories[key].parent_id != null ? categories[key].parent_id : 0;
            if (!children[parent_id])
              children[parent_id] = [];
            children[parent_id].push(categories[key]);
          }
          for(var key in categories) {
            var category = categories[key];
            category.children = [];
            if (children[category.id])
              category.children = children[category.id];
          }
          return children[0];
        }
      };

/****************************************************************/ 
    
      var service = {};

      service.helpers = Helpers;
      service.getCategory = getCategory;
      service.syncPerformance = syncPerformance;
      service.API = meuAPI;
      service.init = init;
      service.getSiteLogoUrl = getSiteLogoUrl;
      service.getSiteProperty = getSiteProperty;
      service.getAssetUrl = getAssetUrl;
    
      return service;
    
      /*
        meuCloud.API.Site.performance()
        .then(function(response) {
          updateData(response);
          if (response.promise)
            return response.promise;
        })
        // If response contains a promise, means is from cache and promise will sync w/ Server
        .then(function(response) {
          updateData(response)
        })
        .catch(function(e) {
          $exceptionHandler(e);
        })
      
      */
      
      function init() {
        if (options.hasOwnProperty('apiUrl'))
          meuAPI.Config.setProperty('apiUrl', options.apiUrl);
      }
           
      function getCategory(id) {
        try {
          var categories = Helpers.lookup(data.categories);
          if (categories.hasOwnProperty(id)) {
            return categories[id];
          } else {
            return null;
          }
        } catch (e) {
          $exceptionHandler(e);
        };
      }
  
      function getData(property) {
        try {
          return data[property]; 
        } catch (e) {
          $exceptionHandler(e);
          return {};
        }
      }
      
      function getSiteProperty(property) {
        try {
          return data.site[property]; 
        } catch (e) {
          $exceptionHandler(e);
          return {};
        }
      }
      
      function getCategories() {
        return getData('categories');
      }
  
      function setCategories(categories) {
        data.categories = categories;
      }
      
      function setSite(site) {
        data.site = site;
      }
      
      function setVisitor(visitor) {
        data.visitor = visitor;
      }
      
      function getVisitor() {
        return data.visitor;
      }
      
      function getSiteLogoUrl() {
        try {
          return options.cdnUrl + data.site.logo; 
        } catch (e) {
          $exceptionHandler(e);
          return null;
        } 
      }
      
      function getAssetUrl(path) {
        try {
          return options.cdnUrl + path; 
        } catch (e) {
          $exceptionHandler(e);
          return null;
        } 
      }
      
      function setBusiness(business) {
        data.business = business;
      }
      
      function syncPerformance(data) {
        return $q(function(resolve, reject) {
          try {
            setCategories(data.categories);
            setSite(data.site);
            setBusiness(data.business);
            resolve(data);
          } catch (e) {
            $exceptionHandler(e);
            reject(e);
          };
        });
      }
    }
  }
  
  function API($rootScope, $http, $log, $exceptionHandler, meuHttpWithFallback) {
  
    var config = {};
    
    var convertJsonAsUriParameters = function(data) {
      var url = Object.keys(data).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }).join('&');
    
      return url;
    };

    var buildUrl = function(endp) {
      try {
        /*
          If config.domain is null then use domain empty
        config.domain !== null && config.domain != undefined
        */
        var domain = (config.domain) ? config.domain : '';
        
        return config.apiUrl + domain + endp; 
      } catch (e) {
        $exceptionHandler(e);
      }
    };

    var api = (function() {
      return {
        get: function(endp, config) {
          var url = buildUrl(endp);
      
          return meuHttpWithFallback.get(url, config);
        },
        post: function(endp, obj) {
          return $http({
            method: 'POST',
            url: buildUrl(endp),
            data: angular.toJson(obj),
            responseType: 'json',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        },
        put: function(endp, obj) {
          return $http({
            method: 'PUT',
            url: buildUrl(endp),
            data: angular.toJson(obj),
            responseType: 'json',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        },
        del: function(endp, id) {
          return $http({
            method: 'DELETE',
            url: buildUrl(endp),
            responseType: 'json',
          });
        }
      };
    })();

    var app = {
      Categories: (function() {
        var path = '/categories/';
        return {
          query: function() {
            // TODO: Need to be tested
            return api.get(path, {});
          },
          items: function(category_id, config) {
            return api.get(path + category_id + '/items', config);
          }
        };
      })(),
      Items: (function() {
        var path = '/items/';
        return {
          latest: function() {
            return api.get(path + 'latest', {});
          },
          search: function(obj) {
            var url = path + 'search?' + convertJsonAsUriParameters(obj);
            return api.get(url, {});
          }
        };
      })(),
      Site: (function() {
        var path = '/performance';
        return {
          performance: function() {
            return api.get(path, {});
          }
        };
      })(),
      Login: (function() {
        var path = '/visitors/';
        return {
          signin: function(obj) {
            return api.post(path + 'login', obj);
          },
          get: function() {
            return api.get(path, {});
          },
          save: function(obj) {
            return api.put(path, obj);
          },
          // TODO: Need to be tested
          device: function(obj) {
            return api.post(path + 'devices', obj);
          },
          // TODO: Need to be tested
          update: function(obj) {
            return api.put(path + 'devices/' + obj.uuid);
          },
          reset: function(obj) {
            return api.post(path + 'forgot_password', obj);
          }
        };
      })(),
      Devices: (function() {
        var path = '/devices/';
        return {
          save: function(obj) {
            return api.put(path + obj.uuid, obj);
          } 
        };
      })(),
      Poll: (function() {
        var path = '/items/';
        return {
          submit: function(obj) {
            return api.post(path + obj.id + '/poll', obj.params);
          }
        };
      })(),
      Mail: (function() {
        var path = '/mail/';
        return {
          save: function(obj) {
            return api.post(path, obj);
          }
        };
      })(),
      Config: (function() {
        return {
          setProperties: function(prop) {
            angular.extend(config, prop);
          },
          getProperties: function() {
            return config;
          },
          setProperty: function(name, value) {
            config[name] = value;
          },
          getProperty: function(name) {
            return config[name];
          }
        };
      })()
    };
    
    return app;
  }
})();