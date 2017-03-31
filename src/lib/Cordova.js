(function() {
  'use strict';

  angular
  .module('ngMeumobi.Cordova', [
    'ngMeumobi.Cordova.analytics',
    'ngMeumobi.Cordova.calendar',
    'ngMeumobi.Cordova.callNumber',
    'ngMeumobi.Cordova.device',
    'ngMeumobi.Cordova.dialogs',
    'ngMeumobi.Cordova.files',
    'ngMeumobi.Cordova.socialSharing',
    'ngMeumobi.Cordova.spinnerDialog',
    'ngMeumobi.Cordova.splashscreen',
    'ngMeumobi.Cordova.push'
  ])
  .factory('meuCordova', cordova);
  
  function cordova(
    meuAnalytics, 
    meuCalendar, 
    meuCallNumber, 
    meuDevice, 
    meuDialogs,
    meuFiles,
    meuSocialSharing,
    meuSpinnerDialog,
    meuSplashscreen
  ) {
	
    var service = {};
	
    service.analytics = meuAnalytics;
    service.calendar = meuCalendar;
    service.callNumber = meuCallNumber; 
    service.device = meuDevice;
    service.dialogs = meuDialogs;
    service.files = meuFiles;
    service.socialSharing = meuSocialSharing;
    service.spinnerDialog = meuSpinnerDialog;
    service.splashscreen = meuSplashscreen;
      
    return service;
  }
})();