/*global angular, cordova*/
/*eslint no-undef: "error"*/
(function () {
  'use strict';
  angular.module('ngMeumobi.Utils.files', [])  
  /*
    TODO: Remove useless injections
  */
  .factory('meuFiles', [
    '$log',
    '$location',
    '$q',
    meuFiles
  ]);
  function meuFiles($log, $location, $q) {
    var service = {};
    service.open = open;
    return service;
    // install   :      cordova plugin add https://github.com/pwlin/cordova-plugin-file-opener2.git
    // link      :      https://github.com/pwlin/cordova-plugin-file-opener2
    function open(uri, type) {
      var q = $q.defer();
      var fileOpener = cordova.plugins && cordova.plugins.fileOpener2;
      var cb_open = {
        success: function () {
          q.resolve();
        },
        fail: function (e) {
          /*
            To homogeneize Android and iOS responses
          */
          if (e.message == 'File doest not exist') {
            e.message = 'File not found';
          } else {
            e.message = 'Couldn\'t open this file. No handler found on device for '.type;
          }
          q.reject(e);
        }
      };
      if (fileOpener) {
        fileOpener.open(uri, type, cb_open);
      } else {
        var error = { message: 'Missing Plugin: FileOpener2' };
        q.reject(error);
      }
      return q.promise;
    }
  }
}());