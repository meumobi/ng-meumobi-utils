(function() {
	'use strict';
  
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