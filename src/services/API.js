(function() {
	'use strict';

  angular.module('ngMeumobi.Utils.api', [])
	
// Simple Authentication for Angular.js App: http://beletsky.net/2013/11/simple-authentication-in-angular-dot-js-app.html
	.factory('errorInterceptor', errorInterceptor)
  .provider('meuAPI', meuAPIProvider);

  function errorInterceptor($q, $rootScope, $log) {
  	return {
  		request: function(config) {
  			config.requestTimestamp = new Date().getTime();
  			config.timeout = 10000;
  			$rootScope.$broadcast('loading:show');
  			return config || $q.when(config);
  		},
  		requestError: function(request) {
  			$rootScope.$broadcast('loading:hide');
  			return $q.reject(request);
  		},
  		response: function(response) {
  			response.config.responseTimestamp = new Date().getTime();
  			$rootScope.$broadcast('loading:hide');
  			return response || $q.when(response);
  		},
  		responseError: function(response) {
  			// See w3.org for Status code definitions: https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
			
  			$rootScope.$broadcast('loading:hide');
  			$log.debug('[API:errorInterceptor]: BEGIN');
  			$log.debug(response);
  			$log.debug('[API:errorInterceptor]: END');
  			if (response && response.status === 0) {} // network offline or CORS error
  			if (response && response.status === 404) {}
  			if (response && response.status === 401) {
  				$log.debug('[API:errorInterceptor]: response.status == 401');
  				$log.debug('The request requires user authentication.  If the request already included Authorization credentials, then the 401 response indicates that authorization has been refused for those credentials.');
  				$rootScope.$emit('logout');
  			}
  			if (response && response.status === 404) {
  				$log.debug('[API:errorInterceptor]: response.status == ' + response.status);
  				$log.debug('The requested resource could not be found.');
  			}
  			if (response && response.status === 408) {
  				$log.debug('[API:errorInterceptor]: response.status == ' + response.status);
  				$log.debug('The server timed out waiting for the request.');
  			}
  			if (response && response.status >= 500) {}
  			return $q.reject(response);
  		}
  	};
  }

  function meuAPIProvider($http, $rootScope, $log) {
    
    var settings = {
      apiUrl: 'http://meumobi.com/api/'
    };

    this.$get = function($http, $log) {
      function buildUrl(endp) {
    		// Temporary fix because /visitors/forgot_password not exists yet, we need to force site on url to call /mail unlogged
        /*
    		var site = ""; //(endp.indexOf("login") != -1) ? "" : APP.domain;
    		if ($rootScope.visitor && $rootScope.visitor.site) {
    			site = $rootScope.visitor.site;
    		}
        */
    		return settings.apiUrl + site + endp;
    	}

      var api = (function() {
      	return {
      		get: function(endp, success, error) {
      			$http({
      				method: 'GET',
      				url: buildUrl(endp),
      				responseType: 'json',
      				headers: {
      					//'If-None-Match': localStorage['ETag']
      				}
      			})
      			.then(success, error);
      		},
      		post: function(endp, obj, success, error) {
      			$http({
      				method: 'POST',
      				url: buildUrl(endp),
      				data: angular.toJson(obj),
      				responseType: 'json',
      				headers: {
      					'Content-Type': 'application/json'
      				}
      			})
      			.then(success, error);
      		},
      		put: function(endp, obj, success, error) {
      			$http({
      				method: 'PUT',
      				url: buildUrl(endp),
      				data: angular.toJson(obj),
      				responseType: 'json',
      				headers: {
      					'Content-Type': 'application/json'
      				}
      			})
      			.then(success, error);
      		},
      		del: function(endp, id, success, error) {
      			$http({
      				method: 'DELETE',
      				url: buildUrl(endp),
      				responseType: 'json',
      			})
      			.then(success, error);
      		}
      	};
      })();

      var app = {
      	Categories: (function() {
      		var path = '/categories/';
      		return {
      			query: function(success, error) {
      				api.get(path, success, error);
      			}
      		};
      	})(),
      	Items: (function() {
      		var path = '/items/';
      		return {
      			latest: function(success, error) {
      				api.get(path + 'latest', success, error);
      			}
      		};
      	})(),
      	Site: (function() {
      		var path = '/performance';
      		return {
      			performance: function(success, error) {
      				api.get(path, success, error);
      			}
      		};
      	})(),
      	Login: (function() {
      		var path = '/visitors/';
      		return {
      			signin: function(obj, success, error) {
      				api.post(path + 'login', obj, success, error);
      			},
      			get: function(success, error) {
      				api.get(path, success, error);
      			},
      			save: function(obj, success, error) {
      				api.put(path, obj, success, error);
      			},
      			device: function(obj, success, error) {
      				api.post(path + 'devices', obj, success, error);
      			},
      			update: function(obj, success, error) {
      				api.put(path + 'devices/' + obj.uuid, obj, success, error);
      			},
      			reset: function(obj, success, error) {
      				api.post(path + 'forgot_password', obj, success, error);
      			}
      		};
      	})(),
      	Devices: (function() {
      		var path = '/devices/';
      		return {
      			save: function(obj, success, error) {
      				api.put(path + obj.uuid, obj, success, error);
      			} 
      		};
      	})(),
      	Poll: (function() {
      		var path = '/items/';
      		return {
      			submit: function(obj, success, error) {
      				api.post(path + obj.id + '/poll', obj.params, success, error);
      			}
      		};
      	})(),
      	Mail: (function() {
      		var path = '/mail/';
      		return {
      			save: function(obj, success, error) {
      				api.post(path, obj, success, error);
      			}
      		};
      	})()
      };
  
      return app; 
    };
  }
})();
