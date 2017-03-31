(function() {
	'use strict';

	angular
	.module('ngMeumobi.Utils.httpInterceptors', [])
	.factory('meuLoadingInterceptor', loadingInterceptor)
  .factory('meuErrorInterceptor', errorInterceptor);
	
	function loadingInterceptor($q, $rootScope, $log) {
		
		var numLoadings = 0;
		
		return {
			request: function(config) {
        if (!numLoadings++) {
          $rootScope.$broadcast('loading:start');
        }

				return config || $q.when(config);
			},
			response: function(response) {
				if (!(--numLoadings)) {
					$rootScope.$broadcast('loading:stop');
				}

				return response || $q.when(response);
			},
			requestError: function(request) {
				if (!(--numLoadings)) {
					$rootScope.$broadcast('loading:stop');
				}

				return $q.reject(request);
			},
			responseError: function(response) {
				if (!(--numLoadings)) {
					$rootScope.$broadcast('loading:stop');
				}
				
				return $q.reject(response);
			}
		};
	}
  
  function errorInterceptor($q, $rootScope, $log) {
    
  	return {
  		request: function(config) {
        
  			return config || $q.when(config);
  		},
  		requestError: function(request) {
        
  			return $q.reject(request);
  		},
  		response: function(response) {
        
  			return response || $q.when(response);
  		},
  		responseError: function(response) {
  			$log.debug('[API:errorInterceptor]: BEGIN');
        $log.debug('Response Status: ' + response.status);
  			$log.debug(response);
  			$log.debug('[API:errorInterceptor]: END');
  			if (response && response.status === 0) {} // network offline or CORS error
  			if (response && response.status === 404) {}
  			if (response && response.status === 401) {
          $rootScope.$broadcast('error:401');
  			}
  			if (response && response.status === 408) {} // Server timed out waiting for the request.
  			if (response && response.status >= 500) {}
        
  			return $q.reject(response);
  		}
  	};
  }
})();