(function() {
  'use strict';

  angular
  .module('ngMeumobi.Utils.plugin', [])
  .factory('meuPlugin', plugin);
  
  /*
  install   :     cordova plugin add cordova-plugin-plugin
  
  How to use it: 
    meuPlugin.call()
    .then(function(result) {})
    .catch(function(error) {});
  */
  
  function plugin($q, $window, $log, $exceptionHandler) {
    
    var service = {};
    var options = {};
    
    service.setOption = setOption;
    service.setOptions = setOptions;
    service.call = call;
    
    return service;

    function setOptions(opt) {
      angular.extend(options, opt);
    }

    function setOption(name, value) {
      options[name] = value;
    }
    
    function call() {
      return $q(function(resolve, reject) {
        try {
          
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
  }
})();