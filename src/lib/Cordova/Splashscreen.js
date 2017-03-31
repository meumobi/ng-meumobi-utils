(function() {
  'use strict';

  angular
  .module('ngMeumobi.Cordova.splashscreen', [])
  .factory('meuSplashscreen', splashscreen);
  
  /*
  install   :     cordova plugin add cordova-plugin-splashscreen
  
  How to use it: 
  meuCordova.splashscreen.hide()
  .then(function() {})
  .catch(function() {});
  */
  
  function splashscreen($q, $window, $log, $exceptionHandler) {
    
    return {
      show: function() {
        return $q(function(resolve, reject) {
          try {
            if ($window.navigator.splashscreen) {
              $window.navigator.splashscreen.show();
              resolve();
            }
          } catch (e) {
            $exceptionHandler(e);
            reject(e);
          };
        });
      },
    
      hide: function() {
        return $q(function(resolve, reject) {
          try {
            if ($window.navigator.splashscreen) {
              $window.navigator.splashscreen.hide();
              resolve();
            }
          } catch (e) {
            $exceptionHandler(e);
            reject(e);
          };
        });
      }
    };
  }
})();