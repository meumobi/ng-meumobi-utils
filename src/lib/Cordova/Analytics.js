(function() {
	'use strict';
  
	angular
    .module("ngMeumobi.Cordova.analytics", [])
    .factory("firebaseAnalytics", firebaseAnalytics)
    .factory("firebaseXAnalytics", firebaseXAnalytics)
    .factory("meuAnalytics", analytics);

  function firebaseAnalytics($q, $log, $exceptionHandler) {
    var service = {};

    service.trackView = trackView;
    service.trackEvent = trackEvent;
    service.events = {
      EVENT_SAVE: "irmobi_event_save",
      EMAIL_SEND: "irmobi_email_send",
      MEDIA_OPEN: "irmobi_media_open",
      MEDIA_DELETE: "irmobi_media_delete",
      MEDIA_DOWNLOAD: "irmobi_media_download",
      ITEM_SHARE: "irmobi_item_share",
      MEDIA_SHARE: "irmobi_media_share",
    };

    return service;

    function trackView(screenName) {
      return $q(function (resolve, reject) {
        try {
          var analytics = cordova.plugins.firebase.analytics;

          if (analytics) {
            return analytics
              .setCurrentScreen(screenName)
              .then((res) => {
                $log.debug("Track view: " + { name: screenName, result: res });
                resolve();
              })
              .catch((error) => {
                throw new Error("Failed to track view", {
                  cause: JSON.stringify(error),
                });
              });
          } else {
            throw new Error(
              "[PLUGIN MISSING]: cordova-plugin-firebase-analytics"
            );
          }
          // cordova.plugins.firebase.analytics.setCurrentScreen("User dashboard");
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }
      });
    }

    function trackEvent(name, params) {
      return $q(function (resolve, reject) {
        try {
          var analytics = cordova.plugins.firebase.analytics;

          if (analytics) {
            return analytics
              .logEvent(name, params)
              .then((res) => {
                $log.debug("Track event: ", {
                  name,
                  params,
                });
                resolve();
              })
              .catch((error) => {
                throw new Error("Failed to track event", {
                  cause: JSON.stringify(error),
                });
              });
          } else {
            throw new Error(
              "[PLUGIN MISSING]: cordova-plugin-firebase-analytics"
            );
          }
          // cordova.plugins.firebase.analytics.logEvent("my_event", {param1: "value1"});
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }
      });
    }
  }

  function firebaseXAnalytics($q, $log, $window, $exceptionHandler) {
    var service = {};

    service.trackView = trackView;
    service.trackEvent = trackEvent;
    service.events = {
      EVENT_SAVE: "irmobi_event_save",
      EMAIL_SEND: "irmobi_email_send",
      MEDIA_OPEN: "irmobi_media_open",
      MEDIA_DELETE: "irmobi_media_delete",
      MEDIA_DOWNLOAD: "irmobi_media_download",
      ITEM_SHARE: "irmobi_item_share",
      MEDIA_SHARE: "irmobi_media_share",
    };

    return service;

    function trackView(screenName) {
      return $q(function (resolve, reject) {
        try {
          var analytics = $window.FirebasePlugin;

          $log.debug($window);

          if (analytics) {
            FirebasePlugin.setScreenName(
              screenName,
              function () {
                $log.debug("Sent screen name: " + screenName);
                resolve();
              },
              function (error) {
                throw new Error("Failed to send screen name", {
                  cause: JSON.stringify(error),
                });
              }
            );
          } else {
            throw new Error(
              "[PLUGIN MISSING]: cordova-plugin-firebase-analytics"
            );
          }
          // cordova.plugins.firebase.analytics.setCurrentScreen("User dashboard");
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }
      });
    }

    function trackEvent(name, params) {
      return $q(function (resolve, reject) {
        try {
          var analytics = $window.FirebasePlugin;

          if (analytics) {
            FirebasePlugin.logEvent(
              name,
              params,
              function () {
                $log.debug("Track event: ", {
                  name,
                  params,
                });
                resolve();
              },
              function (error) {
                throw new Error("Failed to log event", {
                  cause: JSON.stringify(error),
                });
              }
            );
          } else {
            throw new Error(
              "[PLUGIN MISSING]: cordova-plugin-firebase-analytics"
            );
          }
          // cordova.plugins.firebase.analytics.logEvent("my_event", {param1: "value1"});
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }
      });
    }
  }

  function analytics($injector, $window) {
    return $injector.get("firebaseAnalytics");
  }
})();