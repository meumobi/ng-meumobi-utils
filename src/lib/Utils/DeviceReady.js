(function() {
	'use strict';
  
	angular
	.module('ngMeumobi.Utils.deviceReady', [])
	.factory('meuDeviceReady', deviceReady);
  
  /*
  
    How to use it: 
      meuDeviceReady(function() {
        ...
      });
  */
  
	function deviceReady($log, $window) {
		return function(done) {
			if (angular.isObject($window.cordova)) {
        /*eslint-disable angular/document-service */
        document.addEventListener('deviceready', function(event) {
					done();
				}, false);
        /*eslint-enable angular/document-service */
			} else {
				done();
			}
		};
	}
})();