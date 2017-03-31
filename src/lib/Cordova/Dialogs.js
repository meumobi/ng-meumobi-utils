(function() {
	'use strict';

	angular
	.module('ngMeumobi.Cordova.dialogs', [])
	.factory('meuDialogs', dialogs);
  
  /*
    install   :     cordova plugin add cordova-plugin-dialogs nl.x-services.plugins.toast
    link      :     https://github.com/apache/cordova-plugin-dialogs
    link      :     https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin  
  */
  
  function dialogs($q, $window, $exceptionHandler) {
    
    var service = {};
    
    service.alert = alert;
    service.confirm = confirm;
    service.toast = toast;
    
    return service;
    
    function alert(message, title, buttonName) {
      var q = $q.defer();

      if (!$window.navigator.notification) {
        $window.alert(message);
        q.resolve();
      } else {
        navigator.notification.alert(message, function () {
          q.resolve();
        }, title, buttonName);
      }

      return q.promise;
    };
    
    /*
      
      buttonLabels: Array of strings specifying button labels. (Array) (Optional, defaults to [OK,Cancel])
    */
    function confirm(message, title, buttonLabels) {
      return $q(function(resolve, reject) {
        try {
          title = (angular.isDefined(title)) ? title : 'Confirm';

          if (!$window.navigator.notification) {
            if ($window.confirm(message)) {
              resolve(1);
            } else {
              resolve(2);
            }
          } else {
            navigator.notification.confirm(message, function (buttonIndex) {
              resolve(buttonIndex);
            }, title, buttonLabels);
          }
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
    
    function toast(message) {
      return $q(function(resolve, reject) {
        try {
    			var toast = $window.plugins && $window.plugins.toast;
      
    			if (toast) {
            toast.showLongBottom(message, function (response) {
              resolve(response);
            }, function (error) {
              reject(error);
            });
          } else {
            alert(message);
          }          
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
  }
})();