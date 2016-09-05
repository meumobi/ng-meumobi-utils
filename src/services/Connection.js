(function() {
	'use strict';
	
	angular
	.module('ngMeumobi.Utils.connection', [])
	.factory('meuConnection', meuConnection);
	
  /*
    cordova-plugin-network-information, fallback navigator.onLine
  */
  
	function meuConnection() {
		var service = {};
		
		service.isOnline = isOnline;
    
    return service;
	}
  
  
	function networkState() {
		var networkState = navigator.connection.type;
		var states = {};
		
		states[Connection.UNKNOWN] = false;
		states[Connection.ETHERNET] = true;
		states[Connection.WIFI] = true;
		states[Connection.CELL_2G] = true;
		states[Connection.CELL_3G] = true;
		states[Connection.CELL_4G] = true;
		states[Connection.CELL] = true;
		states[Connection.NONE] = false;
		
		return states[networkState];
	}

	function isOnline() {
		var connection = navigator.connection && navigator.connection.type;
		if (connection) {
			return networkState();
		} else {
			return navigator.onLine;
		}
	}
})();