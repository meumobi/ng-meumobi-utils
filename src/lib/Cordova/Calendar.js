(function() {
	'use strict';

	angular
	.module('ngMeumobi.Cordova.calendar', [])
	.factory('meuCalendar', ['$q', '$window', 'striptagsFilter', 'br2nlFilter', calendar]);
  
  /*
    cordova plugin add https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git
    If start and end_date equal 00:00 then the event occurs all day long
  */
  
  function calendar($q, $window, striptags, br2nl, $exceptionHandler) {
    
    var service = {};
    
    service.createEventInteractively = createEventInteractively;
    
    return service;
    
    function createEventInteractively(options) {
      var defaultOptions = {
        title: null,
        address: null,
        description: '',
        start_date: null,
        end_date: null
      };

      defaultOptions = angular.extend(defaultOptions, options);
      
      return $q(function(resolve, reject) {
        try {
          $window.plugins.calendar.createEventInteractively(
            striptags(defaultOptions.title),
            striptags(defaultOptions.address),
            striptags(br2nl(defaultOptions.description)),
            new Date(defaultOptions.start_date  * 1000),
            new Date(defaultOptions.end_date  * 1000),
            function (message) {
              resolve(message);
            }, function (e) {
              reject(e);
            }
          );
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
  }
})();