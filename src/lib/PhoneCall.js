(function() {
	'use strict';
  
	angular
	.module('ngMeumobi.Utils.phoneCall', [])
	.factory('phoneCallCordova', phoneCallCordova)
	.factory('phoneCall', phoneCall)
	.factory('meuPhoneCall', meuPhoneCall);
  
  /*
    install   :     cordova plugin add https://github.com/Rohfosho/CordovaCallNumberPlugin.git
  
    npm install https://www.npmjs.com/package/call-number
  
    How to use it: 
    meuPhoneCall(number, true)
    .then(function(result) {})
    .catch(function(error) {});
  */
		
	function phoneCallCordova($log, $window, $q) {
    
    var service = {};
    
    service.call = call;
    
    return service;
    
    function call(number, bypassAppChooser) {
      
      if (angular.isUndefined(bypassAppChooser)) {
        bypassAppChooser = false;
      }
      
      return $q(function (resolve, reject) {
        
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
      });
    }
	}
  
	function phoneCall($log, $window, $q) {
    
    var service = {};
    
    service.call = call;
    
    return service;
    
    function call(number, bypassAppChooser) {
      
      if (angular.isUndefined(bypassAppChooser)) {
        bypassAppChooser = false;
      }
      
      return $q(function (resolve, reject) {
        var passedNumber = encodeURIComponent(number);
        $window.location = 'tel:' + passedNumber;
        resolve();
      });
    }
	}
  
	function meuPhoneCall($injector, $window) {

    var CallNumber = $window.plugins && $window.plugins.CallNumber;
    
		if ($window.cordova && CallNumber) {
			return $injector.get('phoneCallCordova');
		} else {
		  return $injector.get('phoneCall');
		}
	}
})();