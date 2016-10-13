(function() {
	'use strict';

	angular
	.module('ngMeumobi.Utils.dialogs', [])
	.factory('meuDialogs', meuDialogs);
  
  /*
    install   :     cordova plugin add cordova-plugin-dialogs nl.x-services.plugins.toast
    link      :     https://github.com/apache/cordova-plugin-dialogs
    link      :     https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin  
  */
  
  function meuDialogs($q, $window) {
    
    var service = {};
    
    service.alert = alert;
    service.confirm = confirm;
    service.toast = toast;
    
    return service;
    
    function alert (message, title, buttonName) {
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
    
    function confirm (message, title, buttonLabels) {
      var q = $q.defer();

      if (!$window.navigator.notification) {
        if ($window.confirm(message)) {
          q.resolve(1);
        } else {
          q.resolve(2);
        }
      } else {
        navigator.notification.confirm(message, function (buttonIndex) {
          q.resolve(buttonIndex);
        }, title, buttonLabels);
      }

      return q.promise;
    };
    
    function toast (message) {
      var q = $q.defer();
			var toast = $window.plugins && $window.plugins.toast;
      
			if (toast) {
        toast.showLongBottom(message, function (response) {
          q.resolve(response);
        }, function (error) {
          q.reject(error);
        });
      } else {
        alert(message);
      }
      
      return q.promise;
    };
  }
})();