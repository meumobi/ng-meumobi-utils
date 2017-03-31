(function() {
  'use strict';

  angular
  .module('ngMeumobi.Utils.httpWithFallback', [])
  .factory('meuHttpWithFallback', httpWithFallback);
  
  function httpWithFallback($q, $log, $exceptionHandler, $http) {

    // Constructor function, using $http as prototype
    function HttpWithFallback() { }
    HttpWithFallback.prototype = $http;
    HttpWithFallback.prototype.constructor = HttpWithFallback;

    var httpWithFallback = new HttpWithFallback();

    var prepareStoredResponse = function(storedResponse) {
      // Data was successfully retrieved from local storage, resolve with status 200
      storedResponse = angular.fromJson(storedResponse);
      var headers = storedResponse.headers;
      storedResponse.headers = function() { return headers; };
      return storedResponse;
    };

    var makeRequest = function(url, config, deferred) {
      $http.get(url, config)
      .then(
        function(response) {
          $log.debug('[httpWithFallback]: then response success status:' + response.status);
          // Store in local storage when status === 200
          if (!response.config.dontStoreFallback && response.status === 200) {
            localStorage.setItem(url, angular.toJson({
              data: response.data,
              status: response.status,
              config: response.config,
              headers: response.headers(),
              isFallback: true
            }));
          }
          // Resolve with original response
          if (response.headers('etag') === response.config['If-None-Match'])
            response.unchanged = true;
          deferred.resolve(response);
        },
        function(response) {
          $log.debug('[httpWithFallback]: then response fail status:' + response.status);
          // Try to retrieve from local storage
          var storedResponse = localStorage.getItem(url);
          if (storedResponse) {
            return deferred.resolve(prepareStoredResponse(storedResponse));
          }

          // Try config.fallback
          if (response.config.fallback) {
            return deferred.resolve({
              data: config.fallback,
              status: response.status,
              headers: response.headers,
              config: response.config,
              isFallback: true
            });
          }

          // Reject with original error response
          return deferred.reject(response);
        }
      );

      // Decorate promise with success and error functions to be compatible with the promise returned by $http.get
      var promise = deferred.promise;

      promise.success = function(fn) {
        promise.then(function(response) {
          fn(response.data, response.status, response.headers, config, response.isFallback);
        });
        return promise;
      };

      promise.error = function(fn) {
        promise.then(null, function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      return promise;
    };
    /**
    * Override $http.get to catch the promise.error
    */
    httpWithFallback.get = function(url, config) {
      // Client doesn't support local storage
      if (!localStorage) {
        // If no fallback defined, just just $http.get
        if (!config.fallback) {
          return $http.get(url, config);
        }
        // Local storage won't be used
        config.dontStoreFallback = true;
      }

      // Delegate get to $http
      var deferred = $q.defer();
      var storedResponse = localStorage.getItem(url);

      if (storedResponse) {
        //second promise to update data after request
        var deferredRequest = $q.defer();
        storedResponse = prepareStoredResponse(storedResponse);
        var cache = storedResponse;          
        // If config is undefined, ie httpWithFallback.get(PATH)
        // config = typeof config !== 'undefined' ? config : {};
        config = angular.isDefined(config) ? config : {};         
        if (cache && cache.headers())
          config['If-None-Match'] = cache.headers().etag;
        storedResponse.promise = makeRequest(url, config, deferredRequest);
        deferred.resolve(storedResponse);
        return deferred.promise;
      }
      //don't have local, continue to request
      return makeRequest(url, config, deferred);
    };

    return httpWithFallback;
  };
})();