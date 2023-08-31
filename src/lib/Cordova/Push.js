(function() {
	'use strict';

	angular
	.module('ngMeumobi.Cordova.push', [])
	.factory('pushwoosh', initPushwoosh)
	.factory('onesignal', OneSignalImpl);
  
  /*
    https://www.npmjs.com/package/pushwoosh-pgb-plugin
    http://docs.pushwoosh.com/docs/phonegap-build
  */
  function initPushwoosh($log, $window, $document, $exceptionHandler) {
        
    var service = {};
    
    service.config = config;
    service.register = register;
    
    return service;
    
    var googleProjectNumber;
    var applicationCode;
	
    function config(g, a) {
      googleProjectNumber = g;
      applicationCode = a;
    };
    
    // Initialize Pushwoosh. This will trigger all pending push notifications on start.
    function register(success, fail) {
      
      try {   
        var pushNotification = angular.isDefined($window.cordova) && $window.cordova.require('pushwoosh-cordova-plugin.PushNotification');
      
        if (pushNotification) {
          // Should be called before pushwoosh.onDeviceReady
          $document.on('push-notification', function(event) {
            var notification = event.notification;
            /*
            handle push open here
            notification.message
            notification.userData = {
              'category_id': ...,
              'item_id': ...
            }
            */ 
            $log.debug('event.notification');
            $log.debug(notification);
          });

          pushNotification.onDeviceReady({ 
            projectid: googleProjectNumber,
            pw_appid: applicationCode}
          );

          //register for push notifications
          pushNotification.registerDevice(
            function(status) {
              var pushIds = {};
              
              pushIds.token = status.pushToken;
              success(pushIds);
            }, 
            function(status) {
              throw new Error('Push: Can\'t register device');
              fail(status);
            }
          );
          //clear the app badge
          pushNotification.setApplicationIconBadgeNumber(0);
        } else {
          throw new Error('Missing Plugin: pushwoosh-cordova-plugin');
        }
      } catch (error) {
        $exceptionHandler(error);
      }
    };
  }
	
  /*
    https://www.npmjs.com/package/onesignal-cordova-plugin
    https://documentation.onesignal.com/docs/phonegap-sdk
  */
  
	function OneSignalImpl($log, $window, $exceptionHandler, $rootScope, $q) {

    var service = {};
    
    service.config = config;
    service.register = register;
    service.sendTag = sendTag;
    service.setSubscription = setSubscription;
    
    return service;
    
    var googleProjectNumber;
		var appId;
	
		function config(g, a) {
			googleProjectNumber = g;
			appId = a;
		};
		
  /**
   * @ngdoc function
   * @name ngMeumobi.Utils.push.meuPush#setProvider
   * @methodOf ngMeumobi.Utils.push.meuPush
   *
   * @description
   * Sets current Push provider (by default 'pushwoosh').
   *
   * @param {string} provider name {'pushwoosh', 'onesignal'}.
   */
    
    function sendTag(key, value) {
      return $q(function(resolve, reject) {
        try {
          var pushNotification = $window.plugins && $window.plugins.OneSignal;
          
          if (pushNotification) {
            pushNotification.sendTag(key, value);
          } else {
            throw new Error('Missing Plugin: onesignal-cordova-plugin');
          }
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
    
    function setSubscription(bool) {
      return $q(function(resolve, reject) {
        try {
          var pushNotification = $window.plugins && $window.plugins.OneSignal;
          
          if (pushNotification) {
            pushNotification.setSubscription(bool);
          } else {
            throw new Error('Missing Plugin: onesignal-cordova-plugin');
          }
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
    
    function register(success, error) {
      try {
        var pushNotification = $window.plugins && $window.plugins.OneSignal;

        if (pushNotification) {
          pushNotification.setAppId(appId);

          pushNotification.addPermissionObserver(function (stateChanges) {
            $log.debug(
              "Push permission state changed: " +
                JSON.stringify(stateChanges, null, 2)
            );
          });
          pushNotification.getDeviceState(function (stateChanges) {
            $log.debug(
              "OneSignal getDeviceState: " + JSON.stringify(stateChanges)
            );
            var pushIds = {};
            pushIds.token = stateChanges.pushToken;
            pushIds.uuid = stateChanges.userId;

            success(pushIds);
          });

          pushNotification.setNotificationOpenedHandler(function (jsonData) {
            $log.debug(
              "notificationOpenedCallback: " + JSON.stringify(jsonData)
            );
            $rootScope.$emit("open-notification", jsonData);
          });

          //Prompts the user for notification permissions.
          //    * Since this shows a generic native prompt, we recommend instead using an In-App Message to prompt for notification permission (See step 6) to better communicate to your users what notifications they will get.
          pushNotification.promptForPushNotificationsWithUserResponse(function (
            accepted
          ) {
            $log.debug("User accepted notifications: " + accepted);
          });
          
          pushNotification.getTags(function(tags) {
            //alert('get Push Tags:\n' + angular.toJson(tags));
            $log.debug('Tags Received: ' + angular.toJson(tags));
          });
        } else {
          throw new Error('Missing Plugin: onesignal-cordova-plugin');
        }
      } catch (error) {
        $exceptionHandler(error);
      }
    };
	}
})();