(function() {
	'use strict';
  
	angular
	.module('ngMeumobi.Cordova.analytics', [])
	.factory('googleAnalytics', googleAnalytics)
	.factory('meuAnalytics', analytics);

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
          ga('set', {
            page: screenName,
            title: screenName
          });
          ga('send', 'pageview');
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
          ga('send', 'event', {
            eventCategory: category,
            eventLabel: label,
            eventAction: action,
            eventValue: value
          });
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
          ga('create', {
            storage: 'none',
            trackingId: id,
            clientId: $window.localStorage.getItem('ga:clientId')
          });
          ga('set', {
            checkProtocolTask: null,
            checkStorageTask: null,
            transportUrl: 'https://www.google-analytics.com/collect'
          });
          ga(function (tracker) {
            if ( !$window.localStorage.getItem('ga:clientId') ) {
              $windowlocalStorage.setItem( 'ga:clientId', tracker.get('clientId') );
            }
          });
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
	}
  
	function analytics($injector, $window) {
		  return $injector.get('googleAnalytics');
	}
})();