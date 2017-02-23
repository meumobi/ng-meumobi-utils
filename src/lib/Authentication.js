(function() {
  'use strict';
  
  angular
  .module('ngMeumobi.Utils.authentication', [])
  .factory('meuAuthentication', meuAuthentication);
  
  /*
  Inspired by Jason Watmore Blog Post
  http://jasonwatmore.com/post/2014/05/26/angularjs-basic-http-authentication-example
  */

  function meuAuthentication($http, $rootScope, $timeout) {
    
    var service = {};
    service.SetCredentials = function (data) { 
      /*
      *  data.visitor && data.token
      */
      $rootScope.auth = data;

      $http.defaults.headers.common['X-Visitor-Token'] = data.token;
      localStorage.globals = angular.toJson($rootScope.auth);
    };

    service.ClearCredentials = function () {
      $rootScope.auth = {};
      localStorage.removeItem('auth');
      delete $http.defaults.headers.common['X-Visitor-Token'];
    };

    return service;
  }
})();