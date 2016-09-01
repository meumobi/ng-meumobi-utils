/*global angular, cordova*/
/*eslint no-undef: "error"*/
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils.services', [])
  /*
    TODO: Remove useless injections
  */
  .factory('meuFilesServices', ['$log', '$location', '$q', meuFilesServices]);

  function meuFilesServices($log, $location, $q) {
    var service = {};

    service.open = open;

    return service;

    // install   :      cordova plugin add https://github.com/pwlin/cordova-plugin-file-opener2.git
    // link      :      https://github.com/pwlin/cordova-plugin-file-opener2

    function open(uri, type) {
      var q = $q.defer();
      cordova.plugins.fileOpener2.open(uri, type, {
        error: function (e) {
          /*
            To homogeneize Android and iOS responses
          */
          if (e.message == 'File doest not exist') {
            e.message = 'File not found';
          } else {
            e.message = "Couldn't open this file. No handler found on device for " . type;
          }

          q.reject(e);
        }, success: function () {

          q.resolve();
        }
      });
      return q.promise;
    }
  }
})();
