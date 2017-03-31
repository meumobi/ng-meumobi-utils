/* global angular */
/* eslint no-undef: "error" */
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils.filters', ['ngSanitize'])
  .filter('isEmpty', isEmpty)
  .filter('br2nl', br2nl)
  .filter('striptags', striptags)
  .filter('bytesToSize', bytesToSize)
  .filter('hrefToJS', hrefToJS)
  .filter('capitalize', capitalize);

  function isEmpty() {
    return function (obj) {
      return !Object.keys(obj).length;
    };
  }

  function br2nl() {
    return function (text) {
      return text.replace(/<br\s*[\/]?>/gi, '\n');
    };
  }

  function striptags() {
    return function (text) {
      return angular
      .element('<div/>')
      .html(text)
      .text();
    };
  }
  
  function capitalize() {
    return function(input, scope) {
      if (input!=null)
      input = input.toLowerCase();
      return input.substring(0,1).toUpperCase()+input.substring(1);
    } 
  }
  
  function bytesToSize() {
    return function(bytes) {
      if (bytes == 0) return '0 Byte';
      var k = 1000;
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }
  }

  function hrefToJS ($sce, $sanitize) {
    return function(text) {
      var regex = /href="([\S]+)"/g;
      var newString = $sanitize(text).replace(regex, "onClick=\"window.open('$1', '_blank', 'location=yes')\"");
      return $sce.trustAsHtml(newString);
    }
  }
})();
