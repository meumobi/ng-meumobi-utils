(function() {
  'use strict';

  angular
  .module('ngMeumobi.Utils.statusbar', [])
  .factory('meuStatusbar', statusbar);
  
  /*
  install   :     cordova plugin add cordova-plugin-statusbar
  
  How to use it: 
    meuCordova.statusbar.call()
    .then(function(result) {})
    .catch(function(error) {});
  */
  
  function statusbar($q, $window, $log, $exceptionHandler) {
    
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