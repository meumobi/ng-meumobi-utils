(function() {
  'use strict';
  
  angular
  .module('ngMeumobi.Cordova.callNumber', [])
  .factory('callNumberCordova', callNumberCordova)
  .factory('callNumber', callNumber)
  .factory('meuCallNumber', meuCallNumber);
  
  /*
  install   :     cordova plugin add https://github.com/Rohfosho/CordovaCallNumberPlugin.git
  
  npm install https://www.npmjs.com/package/call-number
  
  How to use it: 
  meuCordova.callNumber(number, true)
  .then(function(result) {})
  .catch(function(error) {});
  */
		
  function callNumberCordova($log, $window, $q, $exceptionHandler) {
    
    return function(number, bypassAppChooser) {
      
      return $q(function(resolve, reject) {
        try {
          if (angular.isUndefined(bypassAppChooser)) {
            bypassAppChooser = false;
          }
          var cb_callNumber = {
            success: function(result) {
              resolve(result);
            },
            fail: function(result) {
              $log.debug(result);
              reject(result);
            }
          };
      
          var CallNumber = $window.plugins && $window.plugins.CallNumber;
      
          if (CallNumber) {
            CallNumber.callNumber(cb_callNumber.success, cb_callNumber.fail, number, bypassAppChooser);
          } else {
            throw new Error('Missing CordovaCallNumber Plugin');
          }
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
  }
  
  function callNumber($log, $window, $q, $exceptionHandler) {
    
    return function(number, bypassAppChooser) {
      return $q(function(resolve, reject) {
        try {
          if (angular.isUndefined(bypassAppChooser)) {
            bypassAppChooser = false;
          }
          var passedNumber = encodeURIComponent(number);
          $window.location = 'tel:' + passedNumber;
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
  }
  
  function meuCallNumber($injector, $window) {

    var CallNumber = $window.plugins && $window.plugins.CallNumber;
    
    if ($window.cordova && CallNumber) {
      return $injector.get('callNumberCordova');
    } else {
      return $injector.get('callNumber');
    }
  }
})();