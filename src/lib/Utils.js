(function(global) {
  'use strict';

  angular
  .module('ngMeumobi.Utils', [
    'ngMeumobi.Utils.localStorage',
    'ngMeumobi.Utils.deviceReady',
    'ngMeumobi.Utils.httpInterceptors',
    'ngMeumobi.Utils.authentication',
    'ngMeumobi.Utils.httpWithFallback'
  ])
  .factory('meuUtils', utils);
  
  function utils(
    meuLocalStorage,
    meuDeviceReady,
    meuLoadingInterceptor,
    meuErrorInterceptor,
    meuHttpWithFallback
  ) {
	
    var service = {};
	
    service.localStorage = meuLocalStorage;
    service.deviceReady = meuDeviceReady;
    service.loadingInterceptor = meuLoadingInterceptor;
    service.errorInterceptor = meuErrorInterceptor;
    service.httpWithFallback = meuHttpWithFallback;
      
    return service;
  }
})(this);
