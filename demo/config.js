module.exports = function(config) {

	// Output directory
	config.dest = 'www';
	
  // version of the App
	config.version = "1.0.0"; 
  
	// Inject cordova script into html
	config.cordova = true;
  
	// Images minification
	config.minify_images = true;
  
	config.weinre.httpPort = 8080;
	// How to get local ip: $ ifconfig |grep inet
	config.weinre.boundHost = '192.168.1.44';

	// Comment to enable weinre, uncomment to disable weinre 
	config.weinre = false;
	config.debug = true;
    
	// 3rd party components
	config.vendor.js.push('./bower_components/ng-meumobi-utils/dist/ng-meumobi-utils.js');
	//config.vendor.fonts.push('.bower_components/font/dist/*');
};
