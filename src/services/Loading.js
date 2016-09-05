(function() {
	'use strict';

	angular
	.module('ngMeumobi.Utils.loading', [])
	.factory('loadingInterceptor', loadingInterceptor);
	
	function loadingInterceptor($q, $rootScope) {
		
		var numLoadings = 0;
		
		return {
			request: function(config) {
				numLoadings++;
				$rootScope.$broadcast('loading:start');

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
})();
