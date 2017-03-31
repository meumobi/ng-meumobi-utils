(function() {
  'use strict';

  angular
  .module('ngMeumobi.Cordova.spinnerDialog', [])
  .factory('meuSpinnerDialog', spinnerDialog);
  
  /*
  install   :     cordova plugin add cordova-plugin-spinnerdialog
  
  How to use it: 
    meuSpinnerDialog.show()
    .then(function(result) {})
    .catch(function(error) {});
  */
  
  function spinnerDialog($q, $window, $log, $exceptionHandler) {
    
    var service = {};
    
    service.show = show;
    service.hide = hide;
    
    return service;

    function show() {
      return $q(function(resolve, reject) {
        try {
          var spinner = $window.plugins && $window.plugins.spinnerDialog;
        
          if (spinner) {
            spinner.show();
            resolve();
          } else {
            throw new Error('[PLUGIN MISSING]: cordova-plugin-spinnerdialog');
          }      
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }
      });
    };
    
    function hide() {
      return $q(function(resolve, reject) {
        try {
          var spinner = $window.plugins && $window.plugins.spinnerDialog;
        
          if (spinner) {
            spinner.hide();
          } else {
            throw new Error('[PLUGIN MISSING]: cordova-plugin-spinnerdialog');
          }      
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }
      });
    };
  }
})();