(function() {
	'use strict';
  
	angular
	.module('ngMeumobi.Cordova.analytics', [])
	.factory('googleAnalytics', googleAnalytics)
  .factory('$cordovaGoogleAnalytics', $cordovaGoogleAnalytics)
	.factory('meuAnalytics', analytics);
  
  /*
    Inspired by ngCordova
    We've extracted only required methods 
  
    install   :     cordova plugin add https://github.com/danwilson/google-analytics-plugin.git
  */

  function $cordovaGoogleAnalytics($q, $window, $log, $exceptionHandler) {
    
    var service = {};
    
    service.startTrackerWithId = startTrackerWithId;
    service.trackView = trackView;
    service.trackEvent = trackEvent;
    
    return service;


    function startTrackerWithId(id) {
      return $q(function(resolve, reject) {
        try {
          $window.ga.startTrackerWithId(id, 20);
          $log.debug('Start tracking GA Id: ' + id);
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }

    function trackView(screenName) {
      return $q(function(resolve, reject) {
        try {
          $window.ga.trackView(screenName);
          $log.debug('Track View: ' + screenName);
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }

    function trackEvent(category, action, label, value) {
      return $q(function(resolve, reject) {
        try {
          var ev = [category, action, label, value];
          $window.ga.trackEvent(category, action, label, value);
          $log.debug('Track Event: ' + ev.toString());
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
  }
  
	function googleAnalytics($q, $window, $log, $exceptionHandler) {
    
    var service = {};
    
    service.trackView = trackView;
    service.trackEvent = trackEvent;
    service.startTrackerWithId  = startTrackerWithId;
    
    return service;
    
    function trackView(screenName) {
      return $q(function(resolve, reject) {
        try {
          $log.debug('Track View: ' + screenName);
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
    
    function trackEvent(category, action, label, value) {
      return $q(function(resolve, reject) {
        try {
          var ev = [category, action, label, value];
          $log.debug('Track Event: ' + ev.toString());
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
    
    function startTrackerWithId(id) {
      return $q(function(resolve, reject) {
        try {
          $log.debug('Start tracking GA Id: ' + id);
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
	}
  
	function analytics($injector, $window) {

		if ($window.cordova) {
			return $injector.get('$cordovaGoogleAnalytics');
		} else {
		  return $injector.get('googleAnalytics');
		}
	}
})();