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
          description: null,
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