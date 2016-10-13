(function() {
	'use strict';

	angular
	.module('ngMeumobi.Utils.socialSharing', [])
	.factory('meuSocialSharing', ['$q', '$window', 'striptagsFilter', 'br2nlFilter', '$log', meuSocialSharing]);
  
  /*
    cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
  */
  
  function meuSocialSharing($q, $window, striptags, br2nl, $log) {
    
    var service = {};
    var options = {
      postfix: ''
    };
    
    service.shareItem = shareItem;
    service.shareMedia = shareMedia;
    service.setOption = setOption;
    service.setOptions = setOptions;
    service.share = share;
    service.shareViaWhatsAppToReceiver = shareViaWhatsAppToReceiver;
    
    return service;

    function setOptions(options) {
      angular.extend(options, options);
    }

    function setOption(name, value) {
      options.name = value;
    }

		function shareViaWhatsAppToReceiver(receiver) {
      var social = $window.plugins && $window.plugins.socialsharing;
		  
      social.shareViaWhatsAppToReceiver(receiver, 'Message via WhatsApp', null /* img */, null /* url */, function() {$log.debug('share ok');});
		}
    
    function shareItem(item) {
			
			var params = {
			  message: item.description,
        subject: item.title,
        files: [],
        url: item.hasOwnProperty('link') ? item.link : null
			};

      if (item.thumbnails.length > 0) {
				params.files.push(item.thumbnails[0].url);
			}

			return share(params);
		}

		function shareMedia(media) {

			var params = {
			  message: media.title,
        subject: media.title,
        files: [],
        url: media.url
			};
			
			// If media is saved locally (media.path) then share it
			// Else share its link (media.url)
			// Couldn't share together local pdf and link
			if (media.hasOwnProperty('path')) {
				params.files.push(media.path);
				params.url = null;
			} else if (media.thumbnails.length > 0) {
				params.files.push(media.thumbnails[0].url);
			}
			
			return share(params);
		}
		
		function share(params) {
    /*
      this is the complete list of currently supported params you can pass to the plugin (all optional)
      var options = {
        message: 'share this', // not supported on some apps (Facebook, Instagram)
        subject: 'the subject', // fi. for email
        files: ['', ''], // an array of filenames either locally or remotely
        url: 'https://www.website.com/foo/#bar?a=b',
        chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title
      }
    */
      var d = $q.defer();			
      var social = $window.plugins && $window.plugins.socialsharing;
      
      // If params.description is null
    
			if (social) {
        if (options.postfix) {
  				params.subject += options.postfix;
        }
      
        params.message = params.message && striptags(br2nl(params.message));
        params.subject = params.subject && striptags(br2nl(params.subject));
        var cb_share = {
          success: function(result) {
            d.resolve(result);
          },
          fail: function(msg) {
            d.reject(msg);
          }  
        };
        
        $log.debug('shareWithOptions');
        $log.debug(params);
        social.shareWithOptions(params, cb_share.success, cb_share.fail); 
			} else {
			  d.reject('Plugin socialsharing missing');
			}
      
      return d.promise;
		}
  }
})();