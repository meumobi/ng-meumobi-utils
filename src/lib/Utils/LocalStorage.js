(function() {
  'use strict';
  
  angular
  .module('ngMeumobi.Utils.localStorage', [])
  .factory('meuLocalStorage', localStorage);
  
  function localStorage() {
    
    var service = {};
    
    service.getObject = getObject;
    service.setObject = setObject;
    service.removeObject = removeObject;
    service.contains = contains;
    
    return service;
    
    function getObject(key) {
      return angular.fromJson(localStorage.getItem(key));
    };

    function setObject(key, value) {
      localStorage.setItem(key, angular.toJson(value));
    };

    function removeObject(key) {
      localStorage.removeItem(key);
    };

    function contains(key) {
      return localStorage.getItem(key) ? true : false;
    };
  }
})();