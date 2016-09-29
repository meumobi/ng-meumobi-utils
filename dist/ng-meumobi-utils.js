(function() {
	'use strict';

	loadingInterceptor.$inject = ["$q", "$rootScope", "$log"];
	angular
	.module('ngMeumobi.Utils.loading', [])
	.factory('loadingInterceptor', loadingInterceptor);
	
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
})();

(function() {
	'use strict';

	angular
	.module('ngMeumobi.Utils.calendar', [])
	.factory('meuCalendar', ['$q', '$window', 'striptagsFilter', 'br2nlFilter', meuCalendar]);
  
  /*
    cordova plugin add https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git
    If start and end_date equal 00:00 then the event occurs all day long
  */
  
  function meuCalendar($q, $window, striptags, br2nl) {
    
    var service = {};
    
    service.createEventInteractively = createEventInteractively;
    
    return service;
    
    function createEventInteractively(options) {
      var d = $q.defer(),
        defaultOptions = {
          title: null,
          address: null,
          description: '',
          start_date: null,
          end_date: null
        };

      defaultOptions = angular.extend(defaultOptions, options);

      $window.plugins.calendar.createEventInteractively(
        striptags(defaultOptions.title),
        striptags(defaultOptions.address),
        striptags(br2nl(defaultOptions.description)),
        new Date(defaultOptions.start_date  * 1000),
        new Date(defaultOptions.end_date  * 1000),
        function (message) {
          d.resolve(message);
        }, function (error) {
          d.reject(error);
        }
      );

      return d.promise;
    }
  }
})();
(function() {
	'use strict';
  
	googleAnalyticsCordova.$inject = ["$cordovaGoogleAnalytics", "$log"];
	googleAnalytics.$inject = ["$log", "$q"];
  $cordovaGoogleAnalytics.$inject = ["$q", "$window", "$log"];
	meuAnalytics.$inject = ["$injector", "$window"];
	angular
	.module('ngMeumobi.Utils.analytics', [])
	.factory('googleAnalyticsCordova', googleAnalyticsCordova)
	.factory('googleAnalytics', googleAnalytics)
  .factory('$cordovaGoogleAnalytics', $cordovaGoogleAnalytics)
	.factory('meuAnalytics', meuAnalytics);
  
  /*
    Inspired by ngCordova
    We've extracted only required methods 
  
    install   :     cordova plugin add https://github.com/danwilson/google-analytics-plugin.git
  */

  function $cordovaGoogleAnalytics($q, $window, $log) {
    
    var service = {};
    
    service.startTrackerWithId = startTrackerWithId;
    service.debugMode = debugMode;
    service.trackView = trackView;
    service.trackEvent = trackEvent;
    service.setUserId = setUserId;
    
    return service;

    function setUserId(id) {
      var d = $q.defer();

      $log.debug('Set User Id: ' + id);
      
      $window.analytics.setUserId(id, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }

    function startTrackerWithId(id) {
      var d = $q.defer();

      $log.debug('Start tracking GA Id: ' + id);

      $window.analytics.startTrackerWithId(id, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }

    function debugMode() {
      var d = $q.defer();

      $window.analytics.debugMode(function (response) {
        d.resolve(response);
      }, function () {
        d.reject();
      });

      return d.promise;
    }

    function trackView(screenName) {
      var d = $q.defer();
      
      $log.debug('Track View: ' + screenName);
      
      $window.analytics.trackView(screenName, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }

    function trackEvent(category, action, label, value) {
      var d = $q.defer();

      var ev = [category, action, label, value];
      $log.debug('Track Event: ' + ev.toString());
      
      $window.analytics.trackEvent(category, action, label, value, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }
  }
		
	function googleAnalyticsCordova($cordovaGoogleAnalytics, $log) {
    
    var service = {};
    
    service.init = init;
    service.debugMode = $cordovaGoogleAnalytics.debugMode;
    service.trackView = $cordovaGoogleAnalytics.trackView;
    service.trackEvent = $cordovaGoogleAnalytics.trackEvent;
    service.startTrackerWithId = $cordovaGoogleAnalytics.startTrackerWithId;
    service.setUserId = $cordovaGoogleAnalytics.setUserId;
    
    return service;
    
    function init(trackId) {
      $cordovaGoogleAnalytics.startTrackerWithId(trackId);
    }
	}
  
	function googleAnalytics($log, $q) {
    
    var service = {};
    
    service.init = init;
    service.debugMode = debugMode;
    service.trackView = trackView;
    service.trackEvent = trackEvent;
    service.startTrackerWithId  = startTrackerWithId;
    service.setUserId = setUserId;
    
    return service;
    
    function init(trackId) {
      $log.debug('Google Analytics track Id: ' + trackId);
    }
    
    function debugMode() {
      $log.debug('Enable Debug');
    }
    
    function trackView(title) {
      $log.debug('Tracking Page: ' + title);
    }
    
    function trackEvent(category, action, label, value) {
      $log.debug('Tracking Event: ' + action);
    }
    
    function startTrackerWithId(id) {
      var msg = 'Tracking GA Id: ' + id;
      var d = $q.defer();

      d.resolve(msg);

      return d.promise;
    }
    
    function setUserId(id) {
      $log.debug('Tracking User: ' + id);
    }
	}
  
	function meuAnalytics($injector, $window) {

		if ($window.cordova) {
			return $injector.get('googleAnalyticsCordova');
		} else {
		  return $injector.get('googleAnalytics');
		}
	}
})();
/* global angular */
/* eslint no-undef: "error" */
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils.filters', [])
  .filter('isEmpty', isEmpty)
  .filter('br2nl', br2nl)
  .filter('striptags', striptags);

  function isEmpty() {
    return function (obj) {
      return !Object.keys(obj).length;
    };
  }

  function br2nl() {
    return function (text) {
      return text.replace(/<br\s*[\/]?>/gi, '\n');
    };
  }

  function striptags() {
    return function (text) {
      return angular
          .element('<div/>')
          .html(text)
          .text();
    };
  }
})();

/* global angular */
/* eslint no-undef: "error" */
/*
  TODO: should release minified (.min.js) and not (.js)
*/
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils', [
    //'ngMeumobi.Utils.files',
    //'ngMeumobi.Utils.api',
    'ngMeumobi.Utils.loading',
    //'ngMeumobi.Utils.connection',
    'ngMeumobi.Utils.calendar',
    'ngMeumobi.Utils.analytics',
    //'ngMeumobi.Utils.filters'
  ]);
  
})();
