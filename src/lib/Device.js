(function() {
	'use strict';
  
	angular
	.module('ngMeumobi.Utils.device', [])
	.factory('meuDevice', meuDevice);
  
  /*
    npm install: 
      https://www.npmjs.com/package/cordova-plugin-device
      https://www.npmjs.com/package/cordova-plugin-uniquedeviceid
      https://www.npmjs.com/package/cordova-plugin-appversion
  
    install: cordova plugin add cordova-plugin-device cordova-plugin-uniquedeviceid cordova-plugin-appversion
  
    How to use it: 
      meuDevice.getUUID()
      .then(function(result) {})
      .catch(function(error) {});
  */
  
	function meuDevice($log, $window, $q, $exceptionHandler) {
    
    var service = {};
    
    service.getUUID = getUUID;
    service.getInformations = getInformations;
    service.getAppVersion = getAppVersion;
    
    return service;
    
    /*
      Return (String) Value
    */
    
    function getUUID() {
      
      return $q(function (resolve, reject) {
        
        var cb_uuid = {
          success: function(uuid) {
            resolve(uuid);
          },
          fail: function() {
            throw new Error('[CALLBACK FAILURE]: uniqueDeviceID.get');
          }
        };
        try {
          var uniqueDeviceID = $window.plugins && $window.plugins.uniqueDeviceID;
        
          if (uniqueDeviceID) {
            uniqueDeviceID.get(cb_uuid.success, cb_uuid.fail);
          } else {
            throw new Error('[PLUGIN MISSING]: cordova-plugin-uniquedeviceid');
          }      
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }
      });
    }
    
    /*
      Return Object {model: ..., platform: ..., platform_version: ..., manufacturer: ...}
    */
    
    function getInformations() {
                    
      return $q(function(resolve, reject) {
        var properties = {};
        
        try {
          /*eslint-disable angular/definedundefined */
          if (typeof device !== 'undefined') {
          /*eslint-enable angular/definedundefined */
    				properties.model = device.model;
    				properties.platform = device.platform;
    				properties.platform_version = device.version;
    				properties.manufacturer = device.manufacturer;
          } else {
    				// Running on Web Browser
    				properties.model = navigator.userAgent;
          }
          resolve(properties); 
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        }     
      });
    }
    
    /*
      Return Object {app_version: ..., app_build: ...}
    */
    
    function getAppVersion() {
      
      return $q(function(resolve, reject) {
        var properties = {};
      
        try {
          /*eslint-disable angular/definedundefined */
          if (typeof AppVersion !== 'undefined') {
          /*eslint-enable angular/definedundefined */
    				properties.app_version = AppVersion.version;
    				properties.app_build = AppVersion.build;
          } else {
            throw new Error('[PLUGIN MISSING]: cordova-plugin-appversion');
          }
          
          resolve(properties);
        } catch (e) {
          $exceptionHandler(e)
          reject(e);
        } 
      });
    }
	}
})();