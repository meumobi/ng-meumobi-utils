/* global angular */
/* eslint no-undef: "error" */
/*
  TODO: should release minified (.min.js) and not (.js)
*/
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils', [
    //'ngMeumobi.Utils.files',
    //'ngMeumobi.Utils.api',
    'ngMeumobi.Utils.loading',
    //'ngMeumobi.Utils.connection',
    'ngMeumobi.Utils.calendar',
    'ngMeumobi.Utils.analytics',
    'ngMeumobi.Utils.socialSharing',
    'ngMeumobi.Utils.dialogs',
    'ngMeumobi.Utils.files'
    //'ngMeumobi.Utils.filters'
  ]);
  
})();
