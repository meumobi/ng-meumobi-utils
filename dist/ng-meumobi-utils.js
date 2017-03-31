(function() {
  'use strict';
  
  angular
  .module('ngMeumobi.Utils.localStorage', [])
  .factory('meuLocalStorage', localStorage);
  
  function localStorage() {
    
    var service = {};
    
    service.getObject = getObject;
    service.setObject = setObject;
    service.removeObject = removeObject;
    service.contains = contains;
    
    return service;
    
    function getObject(key) {
      return angular.fromJson(localStorage.getItem(key));
    };

    function setObject(key, value) {
      localStorage.setItem(key, angular.toJson(value));
    };

    function removeObject(key) {
      localStorage.removeItem(key);
    };

    function contains(key) {
      return localStorage.getItem(key) ? true : false;
    };
  }
})();
(function() {
  'use strict';

  httpWithFallback.$inject = ["$q", "$log", "$exceptionHandler", "$http"];
  angular
  .module('ngMeumobi.Utils.httpWithFallback', [])
  .factory('meuHttpWithFallback', httpWithFallback);
  
  function httpWithFallback($q, $log, $exceptionHandler, $http) {

    // Constructor function, using $http as prototype
    function HttpWithFallback() { }
    HttpWithFallback.prototype = $http;
    HttpWithFallback.prototype.constructor = HttpWithFallback;

    var httpWithFallback = new HttpWithFallback();

    var prepareStoredResponse = function(storedResponse) {
      // Data was successfully retrieved from local storage, resolve with status 200
      storedResponse = angular.fromJson(storedResponse);
      var headers = storedResponse.headers;
      storedResponse.headers = function() { return headers; };
      return storedResponse;
    };

    var makeRequest = function(url, config, deferred) {
      $http.get(url, config)
      .then(
        function(response) {
          $log.debug('[httpWithFallback]: then response success status:' + response.status);
          // Store in local storage when status === 200
          if (!response.config.dontStoreFallback && response.status === 200) {
            localStorage.setItem(url, angular.toJson({
              data: response.data,
              status: response.status,
              config: response.config,
              headers: response.headers(),
              isFallback: true
            }));
          }
          // Resolve with original response
          if (response.headers('etag') === response.config['If-None-Match'])
            response.unchanged = true;
          deferred.resolve(response);
        },
        function(response) {
          $log.debug('[httpWithFallback]: then response fail status:' + response.status);
          // Try to retrieve from local storage
          var storedResponse = localStorage.getItem(url);
          if (storedResponse) {
            return deferred.resolve(prepareStoredResponse(storedResponse));
          }

          // Try config.fallback
          if (response.config.fallback) {
            return deferred.resolve({
              data: config.fallback,
              status: response.status,
              headers: response.headers,
              config: response.config,
              isFallback: true
            });
          }

          // Reject with original error response
          return deferred.reject(response);
        }
      );

      // Decorate promise with success and error functions to be compatible with the promise returned by $http.get
      var promise = deferred.promise;

      promise.success = function(fn) {
        promise.then(function(response) {
          fn(response.data, response.status, response.headers, config, response.isFallback);
        });
        return promise;
      };

      promise.error = function(fn) {
        promise.then(null, function(response) {
          fn(response.data, response.status, response.headers, config);
        });
        return promise;
      };

      return promise;
    };
    /**
    * Override $http.get to catch the promise.error
    */
    httpWithFallback.get = function(url, config) {
      // Client doesn't support local storage
      if (!localStorage) {
        // If no fallback defined, just just $http.get
        if (!config.fallback) {
          return $http.get(url, config);
        }
        // Local storage won't be used
        config.dontStoreFallback = true;
      }

      // Delegate get to $http
      var deferred = $q.defer();
      var storedResponse = localStorage.getItem(url);

      if (storedResponse) {
        //second promise to update data after request
        var deferredRequest = $q.defer();
        storedResponse = prepareStoredResponse(storedResponse);
        var cache = storedResponse;          
        // If config is undefined, ie httpWithFallback.get(PATH)
        // config = typeof config !== 'undefined' ? config : {};
        config = angular.isDefined(config) ? config : {};         
        if (cache && cache.headers())
          config['If-None-Match'] = cache.headers().etag;
        storedResponse.promise = makeRequest(url, config, deferredRequest);
        deferred.resolve(storedResponse);
        return deferred.promise;
      }
      //don't have local, continue to request
      return makeRequest(url, config, deferred);
    };

    return httpWithFallback;
  };
})();
(function() {
	'use strict';

	loadingInterceptor.$inject = ["$q", "$rootScope", "$log"];
  errorInterceptor.$inject = ["$q", "$rootScope", "$log"];
	angular
	.module('ngMeumobi.Utils.httpInterceptors', [])
	.factory('meuLoadingInterceptor', loadingInterceptor)
  .factory('meuErrorInterceptor', errorInterceptor);
	
	function loadingInterceptor($q, $rootScope, $log) {
		
		var numLoadings = 0;
		
		return {
			request: function(config) {
        if (!numLoadings++) {
          $rootScope.$broadcast('loading:start');
        }

				return config || $q.when(config);
			},
			response: function(response) {
				if (!(--numLoadings)) {
					$rootScope.$broadcast('loading:stop');
				}

				return response || $q.when(response);
			},
			requestError: function(request) {
				if (!(--numLoadings)) {
					$rootScope.$broadcast('loading:stop');
				}

				return $q.reject(request);
			},
			responseError: function(response) {
				if (!(--numLoadings)) {
					$rootScope.$broadcast('loading:stop');
				}
				
				return $q.reject(response);
			}
		};
	}
  
  function errorInterceptor($q, $rootScope, $log) {
    
  	return {
  		request: function(config) {
        
  			return config || $q.when(config);
  		},
  		requestError: function(request) {
        
  			return $q.reject(request);
  		},
  		response: function(response) {
        
  			return response || $q.when(response);
  		},
  		responseError: function(response) {
  			$log.debug('[API:errorInterceptor]: BEGIN');
        $log.debug('Response Status: ' + response.status);
  			$log.debug(response);
  			$log.debug('[API:errorInterceptor]: END');
  			if (response && response.status === 0) {} // network offline or CORS error
  			if (response && response.status === 404) {}
  			if (response && response.status === 401) {
          $rootScope.$broadcast('error:401');
  			}
  			if (response && response.status === 408) {} // Server timed out waiting for the request.
  			if (response && response.status >= 500) {}
        
  			return $q.reject(response);
  		}
  	};
  }
})();
(function() {
	'use strict';
  
	deviceReady.$inject = ["$log", "$window"];
	angular
	.module('ngMeumobi.Utils.deviceReady', [])
	.factory('meuDeviceReady', deviceReady);
  
  /*
  
    How to use it: 
      meuDeviceReady(function() {
        ...
      });
  */
  
	function deviceReady($log, $window) {
		return function(done) {
			if (angular.isObject($window.cordova)) {
        /*eslint-disable angular/document-service */
        document.addEventListener('deviceready', function(event) {
					done();
				}, false);
        /*eslint-enable angular/document-service */
			} else {
				done();
			}
		};
	}
})();
(function() {
  'use strict';
  
  authentication.$inject = ["$http", "$rootScope", "$timeout"];
  angular
  .module('ngMeumobi.Utils.authentication', [])
  .factory('meuAuthentication', authentication);
  
  /*
  Inspired by Jason Watmore Blog Post
  http://jasonwatmore.com/post/2014/05/26/angularjs-basic-http-authentication-example
  */

  function authentication($http, $rootScope, $timeout) {
    
    var service = {};
    service.SetCredentials = function (data) { 
      /*
      *  data.visitor && data.token
      */
      $rootScope.auth = data;

      $http.defaults.headers.common['X-Visitor-Token'] = data.token;
      localStorage.globals = angular.toJson($rootScope.auth);
    };

    service.ClearCredentials = function () {
      $rootScope.auth = {};
      localStorage.removeItem('auth');
      delete $http.defaults.headers.common['X-Visitor-Token'];
    };

    return service;
  }
})();
(function() {
  'use strict';

  statusbar.$inject = ["$q", "$window", "$log", "$exceptionHandler"];
  angular
  .module('ngMeumobi.Utils.statusbar', [])
  .factory('meuStatusbar', statusbar);
  
  /*
  install   :     cordova plugin add cordova-plugin-statusbar
  
  How to use it: 
    meuCordova.statusbar.call()
    .then(function(result) {})
    .catch(function(error) {});
  */
  
  function statusbar($q, $window, $log, $exceptionHandler) {
    
    var service = {};
    var options = {};
    
    service.setOption = setOption;
    service.setOptions = setOptions;
    service.call = call;
    
    return service;

    function setOptions(opt) {
      angular.extend(options, opt);
    }

    function setOption(name, value) {
      options[name] = value;
    }
    
    function call() {
      return $q(function(resolve, reject) {
        try {
          
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
  }
})();
(function() {
  'use strict';

  splashscreen.$inject = ["$q", "$window", "$log", "$exceptionHandler"];
  angular
  .module('ngMeumobi.Cordova.splashscreen', [])
  .factory('meuSplashscreen', splashscreen);
  
  /*
  install   :     cordova plugin add cordova-plugin-splashscreen
  
  How to use it: 
  meuCordova.splashscreen.hide()
  .then(function() {})
  .catch(function() {});
  */
  
  function splashscreen($q, $window, $log, $exceptionHandler) {
    
    return {
      show: function() {
        return $q(function(resolve, reject) {
          try {
            if ($window.navigator.splashscreen) {
              $window.navigator.splashscreen.show();
            }
          } catch (e) {
            $exceptionHandler(e);
            reject(e);
          };
        });
      },
    
      hide: function() {
        return $q(function(resolve, reject) {
          try {
            if ($window.navigator.splashscreen) {
              $window.navigator.splashscreen.hide();
            }
          } catch (e) {
            $exceptionHandler(e);
            reject(e);
          };
        });
      }
    };
  }
})();
(function() {
  'use strict';

  spinnerDialog.$inject = ["$q", "$window", "$log", "$exceptionHandler"];
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
(function() {
	'use strict';

	angular
	.module('ngMeumobi.Cordova.socialSharing', [])
	.factory('meuSocialSharing', ['$q', '$window', 'striptagsFilter', 'br2nlFilter', '$log', socialSharing]);
  
  /*
    cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
  
  How to use it: 
    meuSocialSharing.shareItem()
    .then(function(result) {})
    .catch(function(error) {});
  
    meuSocialSharing.shareMedia()
  */
  
  function socialSharing($q, $window, striptags, br2nl, $log, $exceptionHandler) {
    
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
      angular.extend(options, opt);
    }

    function setOption(name, value) {
      options[name] = value;
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

      if (item.thumbnails && item.thumbnails.length > 0) {
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
			if (media.hasOwnProperty('fullPath')) {
				params.files.push(media.fullPath);
				params.url = null;
			} else if (media.thumbnails && media.thumbnails.length > 0) {
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
      return $q(function(resolve, reject) {
        
        var cb_share = {
          success: function(result) {
            resolve(result);
          },
          fail: function(msg) {
            throw new Error('[CALLBACK FAILURE]: social.shareWithOptions');
          }  
        };
        
        try {
          var social = $window.plugins && $window.plugins.socialsharing;
    
    			if (social) {
            if (options.postfix) {
      				params.subject += options.postfix;
            }
      
            params.message = params.message && striptags(br2nl(params.message));
            params.subject = params.subject && striptags(br2nl(params.subject));

            social.shareWithOptions(params, cb_share.success, cb_share.fail); 
    			} else {
    			  throw new Error('[PLUGIN MISSING]: cordova-plugin-x-socialsharing');
    			}          
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
		}
  }
})();
(function() {
	'use strict';

  initPushwoosh.$inject = ["$log", "$window", "$document", "$exceptionHandler"];
	OneSignalImpl.$inject = ["$log", "$window", "$exceptionHandler", "$rootScope"];
	angular
	.module('ngMeumobi.Cordova.push', [])
	.factory('pushwoosh', initPushwoosh)
	.factory('onesignal', OneSignalImpl);
  
  /*
    https://www.npmjs.com/package/pushwoosh-pgb-plugin
    http://docs.pushwoosh.com/docs/phonegap-build
  */
  function initPushwoosh($log, $window, $document, $exceptionHandler) {
        
    var service = {};
    
    service.config = config;
    service.register = register;
    
    return service;
    
    var googleProjectNumber;
    var applicationCode;
	
    function config(g, a) {
      googleProjectNumber = g;
      applicationCode = a;
    };
    
    // Initialize Pushwoosh. This will trigger all pending push notifications on start.
    function register(success, fail) {
      
      try {   
        var pushNotification = angular.isDefined($window.cordova) && $window.cordova.require('pushwoosh-cordova-plugin.PushNotification');
      
        if (pushNotification) {
          // Should be called before pushwoosh.onDeviceReady
          $document.on('push-notification', function(event) {
            var notification = event.notification;
            /*
            handle push open here
            notification.message
            notification.userData = {
              'category_id': ...,
              'item_id': ...
            }
            */ 
            $log.debug('event.notification');
            $log.debug(notification);
          });

          pushNotification.onDeviceReady({ 
            projectid: googleProjectNumber,
            pw_appid: applicationCode}
          );

          //register for push notifications
          pushNotification.registerDevice(
            function(status) {
              var pushIds = {};
              
              pushIds.token = status.pushToken;
              success(pushIds);
            }, 
            function(status) {
              throw new Error('Push: Can\'t register device');
              fail(status);
            }
          );
          //clear the app badge
          pushNotification.setApplicationIconBadgeNumber(0);
        } else {
          throw new Error('Missing Plugin: pushwoosh-cordova-plugin');
        }
      } catch (error) {
        $exceptionHandler(error);
      }
    };
  }
	
  /*
    https://www.npmjs.com/package/onesignal-cordova-plugin
    https://documentation.onesignal.com/docs/phonegap-sdk
  */
  
	function OneSignalImpl($log, $window, $exceptionHandler, $rootScope) {

    var service = {};
    
    service.config = config;
    service.register = register;
    
    return service;
    
    var googleProjectNumber;
		var appId;
	
		function config(g, a) {
			googleProjectNumber = g;
			appId = a;
		};
		
  /**
   * @ngdoc function
   * @name ngMeumobi.Utils.push.meuPush#setProvider
   * @methodOf ngMeumobi.Utils.push.meuPush
   *
   * @description
   * Sets current Push provider (by default 'pushwoosh').
   *
   * @param {string} provider name {'pushwoosh', 'onesignal'}.
   */
    
    function register(success, error) {
      try {
        var pushNotification = $window.plugins && $window.plugins.OneSignal;

        if (pushNotification) {
          $log.debug('Plugin OneSignal loaded');
        
          var iosSettings = {};
          iosSettings['kOSSettingsKeyAutoPrompt'] = true;
          iosSettings['kOSSettingsKeyInAppLaunchURL'] = false;
          
          var didReceiveRemoteNotificationCallBack = function(jsonData) {
            $rootScope.$emit('receive-notification', angular.toJson(jsonData));
          };
          var didOpenRemoteNotificationCallBack = function(jsonData) {
            $rootScope.$emit('open-notification', angular.toJson(jsonData));
          };

          pushNotification.startInit(appId)
          .handleNotificationReceived(didReceiveRemoteNotificationCallBack)
          .handleNotificationOpened(didOpenRemoteNotificationCallBack)
          .inFocusDisplaying(pushNotification.OSInFocusDisplayOption.None)
          .iOSSettings(iosSettings)
          .endInit();
          
          pushNotification.getIds(function(ids) {
            var pushIds = {};
            pushIds.token = ids.pushToken;
            pushIds.uuid = ids.userId;
            success(pushIds);
          });
          
          pushNotification.getTags(function(tags) {
            //alert('get Push Tags:\n' + angular.toJson(tags));
            $log.debug('Tags Received: ' + angular.toJson(tags));
          });
        } else {
          throw new Error('Missing Plugin: onesignal-cordova-plugin');
        }
      } catch (error) {
        $exceptionHandler(error);
      }
    };
	}
})();
(function () {
  'use strict';
  
mediaClickLabel.$inject = ["MIMES"];
mediaIconClass.$inject = ["MIMES"];
mediaOpenClass.$inject = ["MIMES"];
  angular
  .module('ngMeumobi.Cordova.files', ['slugifier'])
  .constant('MIMES', {
    'application/pdf': {
      class: 'fa-file-pdf-o',
      label: 'View',
      extension: 'pdf',
      download: true
    },
    'text/html': {
      class: 'fa-rss',
      label: 'Open',
      extension: 'html',
      download: false
    },
    'application/vnd.youtube.video+html': {
      class: 'fa-youtube-play',
      openClass: 'fa-play',
      label: 'Play',
      extension: 'html',
      download: false
    },
    'application/vnd.ms-excel': {
      class: 'fa-file-excel-o',
      label: 'View',
      extension: 'xls',
      download: true
    },
    'audio/mpeg': {
      class: 'fa-file-audio-o',
      label: 'Play',
      openClass: 'fa-play',
      extension: 'mp3',
      download: true
    },
    'application/vnd.ms-powerpoint': {
      class: 'fa-file-powerpoint-o',
      label: 'View',
      extension: 'ppt',
      download: true,
    },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      class: 'fa-file-excel-o',
      label: 'View',
      extension: 'xls',
      download: true
    }
  })
  .filter('mediaClickLabel', mediaClickLabel)
  .filter('mediaIconClass', mediaIconClass)
  .filter('mediaOpenClass', mediaOpenClass) 
  .provider('meuFiles', files); 
        
  function files() {
    var fileTransfers = {};
    var files = {};
    var options = {
      localFolder: 'Downloads'
    };
    var statuses = {
      download: 'download',
      downloading: 'downloading',
      downloaded: 'downloaded'
    };
    
    this.setOptions = function(options) {
      angular.extend(options, opt);
    };

    this.setOption = function(name, value) {
      options[name] = value;
    };

    this.$get = ["$q", "$log", "$window", "MIMES", "Slug", function($q, $log, $window, MIMES, Slug) {
      var api = {};
      var service = {};
      
      /**
      *  Api methods, available only on the inside the service
      */

      api.fileErrorHandler = function(e) {
        /*
        List of Errors cordova-plugin-file
        https://github.com/apache/cordova-plugin-file#list-of-error-codes-and-meanings
        For the meaning I recommend to read https://wicg.github.io/entries-api/#common-types
        */
        switch (e.code) {
        case FileError.NOT_FOUND_ERR:
          e.message = 'Requested file could not be found';
          break;
        case FileError.SECURITY_ERR:
          e.message = 'SECURITY_ERR';
          break;
        case FileError.ABORT_ERR:
          e.message = 'ABORT_ERR';
          break;
        case FileError.NOT_READABLE_ERR:
          e.message = 'NOT_READABLE_ERR';
          break;
        case FileError.ENCODING_ERR:
          e.message = 'Malformed URI';
          break;
        case FileError.NO_MODIFICATION_ALLOWED_ERR:
          e.message = 'NO_MODIFICATION_ALLOWED_ERR';
          break;
        case FileError.INVALID_STATE_ERR:
          e.message = 'INVALID_STATE_ERR';
          break;
        case FileError.SYNTAX_ERR:
          e.message = 'SYNTAX_ERR';
          break;
        case FileError.INVALID_MODIFICATION_ERR:
          e.message = 'INVALID_MODIFICATION_ERR';
          break;
        case FileError.QUOTA_EXCEEDED_ERR:
          e.message = 'QUOTA_EXCEEDED_ERR';
          break;
        case FileError.TYPE_MISMATCH_ERR:
          e.message = 'TYPE_MISMATCH_ERR';
          break;
        case FileError.PATH_EXISTS_ERR:
          e.message = 'PATH_EXISTS_ERR';
          break;
        default:
          e.message = 'Unknown Error';
          break;
        }
        $log.debug('Error: ' + e.message);
        
        return e;
      };
      
      api.fileTransferErrorHandler = function(e) {
        /*
        A FileTransferError object is passed to an error callback when an error occurs.
        https://github.com/apache/cordova-plugin-file-transfer#filetransfererror
        */
        switch (e.code) {
        case FileTransferError.FILE_NOT_FOUND_ERR:
          e.message = 'FILE_NOT_FOUND_ERR';
          break;
        case FileTransferError.INVALID_URL_ERR:
          e.message = 'INVALID_URL_ERR';
          break;
        case FileTransferError.CONNECTION_ERR:
          e.message = 'CONNECTION_ERR';
          break;
        case FileTransferError.ABORT_ERR:
          e.message = 'Operation aborted';
          break;
        case FileTransferError.NOT_MODIFIED_ERR:
          e.message = 'NOT_MODIFIED_ERR';
          break;
        default:
          e.message = 'Unknown Error';
          break;
        }
        $log.debug('Error: ' + e.message);
        
        return e;
      };

      api.getFilesFromLocalStorage = function() {
        /*
        Check if files is already loaded (if not is empty)
        TODO: is loading localStorage['files] for each media, should be optimized to only load once for all
        */
        if (!Object.keys(files).length  && localStorage['files']) { 
          var entries = angular.fromJson(localStorage['files']);
          files = api.checkRepositoryConsistency(entries);
        }
        return files;
      };
      
      api.getFileName = function(file) {
        var ext = file.extension || '';
        
        if (!ext && MIMES[file.type])
          ext = MIMES[file.type].extension;
                
        var name = file.title || '';
        
        if (!name) {
          name = md5(file.url);
        } else {
          name = Slug.slugify(name);
        }
                          
        return name + '.' + ext;
      };
      
      api.checkRepositoryConsistency = function(entries) {
        /*
        id must be equals to file.path
        and fullPath can be updated if App is updated (iOS)
        */
        var obj = {};
        Object.keys(entries).forEach(function(key,index) {
          obj[entries[key].path] = entries[key];
          obj[entries[key].path].fullPath = api.getFileFullPath(entries[key].path);
        });
        localStorage['files'] = angular.toJson(obj);

        return obj;
      };
      
      // Returns the full absolute path from the root to the FileEntry
      api.getFileFullPath = function (filePath) {
        var directory = null;
        if (device.platform == 'Android') {
          directory = cordova.file.externalDataDirectory;
        } else {
          directory = cordova.file.dataDirectory;
        }
        return directory + filePath;
      };
      
      api.getFilePath = function (fileName) {
        return options.localFolder + '/' + fileName;
      };
      
      //add file to localstorage
      api.addFile = function(file) {
        files[file.path] = file;
        localStorage['files'] = angular.toJson(files);
      };
      
      //remove file from localstorage
      api.removeFile = function(id) {
        delete files[id];
        localStorage['files'] = angular.toJson(files);
      };
      
      //get files handler
      api.getFileEntry = function (path) {
        var q = $q.defer();
        $window.resolveLocalFileSystemURL(
          path, 
          function(entry) {
            q.resolve(entry);
          },
          function(error) {
            $log.debug(error);
            error = api.fileErrorHandler(error);
            q.reject(error);
          }
        );
        return q.promise;
      };
      
      api.isDownloaded = function(filePath) {
        /*
        TODO: If status is downloaded but local file is missing then return FALSE
        Keep record on localstorage to appears as file already downloaded, user can re-download if needed
        */
        return !!api.getFilesFromLocalStorage()[filePath];
      };
      
      api.isDownloading = function(filePath) {
        return !!fileTransfers[filePath];     
      };
      
      api.getFileStatus = function(filePath) {
        if (api.isDownloaded(filePath)) {
          return statuses.downloaded;
        } else if (api.isDownloading(filePath)) {
          return statuses.downloading;
        } else {
          return statuses.download; 
        }
      };
    
      /**
      * Service methods, that are public and available for any resource
      */
      // File available statuses, best for debug and maitain than just string.
      
      service.download = download;
      service.decorateFile = decorateFile;
      service.remove = remove;
      service.list = api.getFilesFromLocalStorage;
      service.open = open;
      service.isDownloadable = isDownloadable;
      service.openFileOpener = openFileOpener;
      
      return service;
      
      /*
      Install: cordova plugin add cordova-plugin-file-opener2
      https://www.npmjs.com/package/cordova-plugin-file-opener2
      */
      
      function isDownloadable(file) {
        return (file.type in MIMES) ? MIMES[file.type].download : true;
      }
      
      function openFileOpener(uri, type) {
        var q = $q.defer();

        cordova.plugins.fileOpener2.open(uri, type, {
          error: function (e) {
            q.reject(e);
          }, success: function () {
            q.resolve();
          }
        });
        return q.promise;
      };
      
      function open(file) {
        var q = $q.defer();
        var cb_entry = {
          success: function(entry) {
            openFileOpener(entry.toURL(), file.type).then(
              function() {
                q.resolve();
              },
              function(e) {
                q.reject(e);
              }
            );
          },
          fail: function(e) {
            q.reject(e);
          }
        };
        
        file.fullPath = api.getFileFullPath(file.path);
        api.getFileEntry(file.fullPath)
        .then(function(entry) {
          cb_entry.success(entry);
        }, function(e) {
          cb_entry.fail(e);
        }
      );
        
      return q.promise;
    };
      
    function download(file) {
      var q = $q.defer();
      var ft = new FileTransfer();
      var uri = encodeURI(file.url);
        
      file.status = statuses.downloading;
      file.fullPath = api.getFileFullPath(file.path);
      fileTransfers[file.path] = ft;

      ft.onprogress = function (progress) {
        q.notify(progress);
      };

      q.promise.abort = function () {
        ft.abort();
      };

      var cb_download = {
        success: function(fileEntry) {
          file.status = statuses.downloaded;
          api.addFile(file);
          delete fileTransfers[file.path];
          q.resolve(file);
        },
        fail: function(error) {
          $log.debug(error);
          file.status = statuses.download;
          error = api.fileTransferErrorHandler(error);
          delete fileTransfers[file.path];
          q.reject(error);
        }
      };
      ft.download(uri, file.fullPath, cb_download.success, cb_download.fail, false);
        
      return q.promise;
    };
      
    function remove(file) {
      var q = $q.defer();

      file.fullPath = api.getFileFullPath(file.path);
      api.getFileEntry(file.fullPath)
      .then(function(entry) {
        entry.remove(
          function (status) {
            api.removeFile(file.path);
            file.status = statuses.download;
            q.resolve(file);
          },function (error) {
            q.reject(error);
          }
        );
      }, function(error) {
        file.status = statuses.download;
        q.reject(error);
      }
    );
        
    return q.promise;
  }
      
  function decorateFile(file) {
    file.name = file.name || api.getFileName(file);
    file.path = file.path || api.getFilePath(file.name);
    file.status = api.getFileStatus(file.path);
        
    /*
    If device not exists then app run on browser
    */
    if (!typeof(device)) {
      var fullPath = api.getFileFullPath(file.path);
      if (api.isDownloaded(fullPath))
        file.fullPath = fullPath;
    };

    return file;
  };
}];
};
  
function mediaClickLabel(MIMES) {
  return function(type) {
    return MIMES[type] ? MIMES[type].label : 'Open';
  };
}
	
function mediaIconClass(MIMES) {
  return function(type) {
    return MIMES[type] ? MIMES[type].class : 'fa-external-link';
  };
}
  
function mediaOpenClass(MIMES) {
  return function(type) {
    return (MIMES[type] && MIMES[type].openClass )? MIMES[type].openClass : 'fa-eye';
  };
}
})();
(function() {
	'use strict';

  dialogs.$inject = ["$q", "$window", "$exceptionHandler"];
	angular
	.module('ngMeumobi.Cordova.dialogs', [])
	.factory('meuDialogs', dialogs);
  
  /*
    install   :     cordova plugin add cordova-plugin-dialogs nl.x-services.plugins.toast
    link      :     https://github.com/apache/cordova-plugin-dialogs
    link      :     https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin  
  */
  
  function dialogs($q, $window, $exceptionHandler) {
    
    var service = {};
    
    service.alert = alert;
    service.confirm = confirm;
    service.toast = toast;
    
    return service;
    
    function alert(message, title, buttonName) {
      var q = $q.defer();

      if (!$window.navigator.notification) {
        $window.alert(message);
        q.resolve();
      } else {
        navigator.notification.alert(message, function () {
          q.resolve();
        }, title, buttonName);
      }

      return q.promise;
    };
    
    /*
      
      buttonLabels: Array of strings specifying button labels. (Array) (Optional, defaults to [OK,Cancel])
    */
    function confirm(message, title, buttonLabels) {
      return $q(function(resolve, reject) {
        try {
          title = (angular.isDefined(title)) ? title : 'Confirm';

          if (!$window.navigator.notification) {
            if ($window.confirm(message)) {
              resolve(1);
            } else {
              resolve(2);
            }
          } else {
            navigator.notification.confirm(message, function (buttonIndex) {
              resolve(buttonIndex);
            }, title, buttonLabels);
          }
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
    
    function toast(message) {
      return $q(function(resolve, reject) {
        try {
    			var toast = $window.plugins && $window.plugins.toast;
      
    			if (toast) {
            toast.showLongBottom(message, function (response) {
              resolve(response);
            }, function (error) {
              reject(error);
            });
          } else {
            alert(message);
          }          
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
  }
})();
(function() {
	'use strict';
  
	cdvDevice.$inject = ["$log", "$window", "$q", "$exceptionHandler"];
	angular
	.module('ngMeumobi.Cordova.device', [])
	.factory('meuDevice', cdvDevice);
  
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
  
	function cdvDevice($log, $window, $q, $exceptionHandler) {
    
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
          $exceptionHandler(e);
          reject(e);
        } 
      });
    }
	}
})();
(function() {
  'use strict';
  
  callNumberCordova.$inject = ["$log", "$window", "$q", "$exceptionHandler"];
  callNumber.$inject = ["$log", "$window", "$q", "$exceptionHandler"];
  meuCallNumber.$inject = ["$injector", "$window"];
  angular
  .module('ngMeumobi.Cordova.callNumber', [])
  .factory('callNumberCordova', callNumberCordova)
  .factory('callNumber', callNumber)
  .factory('meuCallNumber', meuCallNumber);
  
  /*
  install   :     cordova plugin add https://github.com/Rohfosho/CordovaCallNumberPlugin.git
  
  npm install https://www.npmjs.com/package/call-number
  
  How to use it: 
  meuCordova.callNumber(number, true)
  .then(function(result) {})
  .catch(function(error) {});
  */
		
  function callNumberCordova($log, $window, $q, $exceptionHandler) {
    
    return function(number, bypassAppChooser) {
      
      return $q(function(resolve, reject) {
        try {
          if (angular.isUndefined(bypassAppChooser)) {
            bypassAppChooser = false;
          }
          var cb_callNumber = {
            success: function(result) {
              resolve(result);
            },
            fail: function(result) {
              $log.debug(result);
              reject(result);
            }
          };
      
          var CallNumber = $window.plugins && $window.plugins.CallNumber;
      
          if (CallNumber) {
            CallNumber.callNumber(cb_callNumber.success, cb_callNumber.fail, number, bypassAppChooser);
          } else {
            throw new Error('Missing CordovaCallNumber Plugin');
          }
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
  }
  
  function callNumber($log, $window, $q, $exceptionHandler) {
    
    return function(number, bypassAppChooser) {
      return $q(function(resolve, reject) {
        try {
          if (angular.isUndefined(bypassAppChooser)) {
            bypassAppChooser = false;
          }
          var passedNumber = encodeURIComponent(number);
          $window.location = 'tel:' + passedNumber;
          resolve();
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    };
  }
  
  function meuCallNumber($injector, $window) {

    var CallNumber = $window.plugins && $window.plugins.CallNumber;
    
    if ($window.cordova && CallNumber) {
      return $injector.get('callNumberCordova');
    } else {
      return $injector.get('callNumber');
    }
  }
})();
(function() {
	'use strict';

	angular
	.module('ngMeumobi.Cordova.calendar', [])
	.factory('meuCalendar', ['$q', '$window', 'striptagsFilter', 'br2nlFilter', calendar]);
  
  /*
    cordova plugin add https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git
    If start and end_date equal 00:00 then the event occurs all day long
  */
  
  function calendar($q, $window, striptags, br2nl, $exceptionHandler) {
    
    var service = {};
    
    service.createEventInteractively = createEventInteractively;
    
    return service;
    
    function createEventInteractively(options) {
      var defaultOptions = {
        title: null,
        address: null,
        description: '',
        start_date: null,
        end_date: null
      };

      defaultOptions = angular.extend(defaultOptions, options);
      
      return $q(function(resolve, reject) {
        try {
          $window.plugins.calendar.createEventInteractively(
            striptags(defaultOptions.title),
            striptags(defaultOptions.address),
            striptags(br2nl(defaultOptions.description)),
            new Date(defaultOptions.start_date  * 1000),
            new Date(defaultOptions.end_date  * 1000),
            function (message) {
              resolve(message);
            }, function (e) {
              reject(e);
            }
          );
        } catch (e) {
          $exceptionHandler(e);
          reject(e);
        };
      });
    }
  }
})();
(function() {
	'use strict';
  
	googleAnalyticsCordova.$inject = ["$cordovaGoogleAnalytics", "$log"];
	googleAnalytics.$inject = ["$log", "$q"];
  $cordovaGoogleAnalytics.$inject = ["$q", "$window", "$log"];
	analytics.$inject = ["$injector", "$window"];
	angular
	.module('ngMeumobi.Cordova.analytics', [])
	.factory('googleAnalyticsCordova', googleAnalyticsCordova)
	.factory('googleAnalytics', googleAnalytics)
  .factory('$cordovaGoogleAnalytics', $cordovaGoogleAnalytics)
	.factory('meuAnalytics', analytics);
  
  /*
    Inspired by ngCordova
    We've extracted only required methods 
  
    install   :     cordova plugin add https://github.com/danwilson/google-analytics-plugin.git
  */

  function $cordovaGoogleAnalytics($q, $window, $log) {
    
    var service = {};
    
    service.startTrackerWithId = startTrackerWithId;
    service.debugMode = debugMode;
    service.trackView = trackView;
    service.trackEvent = trackEvent;
    service.setUserId = setUserId;
    
    return service;

    function setUserId(id) {
      var d = $q.defer();

      $log.debug('Set User Id: ' + id);
      
      $window.analytics.setUserId(id, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }

    function startTrackerWithId(id) {
      var d = $q.defer();

      $log.debug('Start tracking GA Id: ' + id);

      $window.analytics.startTrackerWithId(id, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }

    function debugMode() {
      var d = $q.defer();

      $window.analytics.debugMode(function (response) {
        d.resolve(response);
      }, function () {
        d.reject();
      });

      return d.promise;
    }

    function trackView(screenName) {
      var d = $q.defer();
      
      $log.debug('Track View: ' + screenName);
      
      $window.analytics.trackView(screenName, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }

    function trackEvent(category, action, label, value) {
      var d = $q.defer();

      var ev = [category, action, label, value];
      $log.debug('Track Event: ' + ev.toString());
      
      $window.analytics.trackEvent(category, action, label, value, function (response) {
        d.resolve(response);
      }, function (error) {
        d.reject(error);
      });

      return d.promise;
    }
  }
		
	function googleAnalyticsCordova($cordovaGoogleAnalytics, $log) {
    
    var service = {};
    
    service.init = init;
    service.debugMode = $cordovaGoogleAnalytics.debugMode;
    service.trackView = $cordovaGoogleAnalytics.trackView;
    service.trackEvent = $cordovaGoogleAnalytics.trackEvent;
    service.startTrackerWithId = $cordovaGoogleAnalytics.startTrackerWithId;
    service.setUserId = $cordovaGoogleAnalytics.setUserId;
    
    return service;
    
    function init(trackId) {
      $cordovaGoogleAnalytics.startTrackerWithId(trackId);
    }
	}
  
	function googleAnalytics($log, $q) {
    
    var service = {};
    
    service.init = init;
    service.debugMode = debugMode;
    service.trackView = trackView;
    service.trackEvent = trackEvent;
    service.startTrackerWithId  = startTrackerWithId;
    service.setUserId = setUserId;
    
    return service;
    
    function init(trackId) {
      $log.debug('Google Analytics track Id: ' + trackId);
    }
    
    function debugMode() {
      $log.debug('Enable Debug');
    }
    
    function trackView(title) {
      $log.debug('Tracking Page: ' + title);
    }
    
    function trackEvent(category, action, label, value) {
      $log.debug('Tracking Event: ' + action);
    }
    
    function startTrackerWithId(id) {
      var msg = 'Tracking GA Id: ' + id;
      var d = $q.defer();

      d.resolve(msg);

      return d.promise;
    }
    
    function setUserId(id) {
      $log.debug('Tracking User: ' + id);
    }
	}
  
	function analytics($injector, $window) {

		if ($window.cordova) {
			return $injector.get('googleAnalyticsCordova');
		} else {
		  return $injector.get('googleAnalytics');
		}
	}
})();
(function(global) {
  'use strict';

  utils.$inject = ["meuLocalStorage", "meuDeviceReady", "meuLoadingInterceptor", "meuErrorInterceptor", "meuHttpWithFallback"];
  angular
  .module('ngMeumobi.Utils', [
    'ngMeumobi.Utils.localStorage',
    'ngMeumobi.Utils.deviceReady',
    'ngMeumobi.Utils.httpInterceptors',
    'ngMeumobi.Utils.authentication',
    'ngMeumobi.Utils.httpWithFallback'
  ])
  .factory('meuUtils', utils);
  
  function utils(
    meuLocalStorage,
    meuDeviceReady,
    meuLoadingInterceptor,
    meuErrorInterceptor,
    meuHttpWithFallback
  ) {
	
    var service = {};
	
    service.localStorage = meuLocalStorage;
    service.deviceReady = meuDeviceReady;
    service.loadingInterceptor = meuLoadingInterceptor;
    service.errorInterceptor = meuErrorInterceptor;
    service.httpWithFallback = meuHttpWithFallback;
      
    return service;
  }
})(this);

(function() {
  'use strict';

  cordova.$inject = ["meuAnalytics", "meuCalendar", "meuCallNumber", "meuDevice", "meuDialogs", "meuFiles", "meuSocialSharing", "meuSpinnerDialog", "meuSplashscreen"];
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
(function() {
  'use strict';

  API.$inject = ["$rootScope", "$http", "$log", "$exceptionHandler", "meuHttpWithFallback"];
  angular
  .module('ngMeumobi.Utils')
  .provider('meuCloud', meuCloudProvider)
  .factory('meuAPI', API);
  
  function meuCloudProvider() {
    
    meuCloud.$inject = ["$q", "$window", "$log", "$exceptionHandler", "meuUtils", "meuAPI"];
    var options = {},
        data = {};
    
    this.setOptions = function(opt) {
      angular.extend(options, opt);
    };

    this.setOption = function(name, value) {
      options[name] = value;
    };
    
    this.$get = meuCloud;
    
    function meuCloud($q, $window, $log, $exceptionHandler, meuUtils, meuAPI) {
    
/*
  Helpers
*/
      var Helpers = {
        lookup: function(array) {
          var token = 'id';
          // Identify if it's an array of items (item._id) or category (category.id)
          if (array[0] && array[0].hasOwnProperty('_id'))
            token = '_id';
          return Helpers.lookupByToken(array, token);
        },
        lookupByToken: function(array, token) {
          var lookup = [];
          for (var i = 0, len = array.length; i < len; i++) {
              lookup[array[i][token]] = array[i];
          }
          return lookup;
        },
        isFreshResponse: function(response) {
          var isFallback = response.hasOwnProperty('isFallback') ? response.isFallback : null;
          var unchanged = response.hasOwnProperty('unchanged') ? response.unchanged : null;
        
          return !(unchanged || isFallback);
        },
        getCategoriesTree: function(categories) {
          var children = [];
          children[0] = [];
          for(var key in categories) {
            var parent_id = categories[key].parent_id != null ? categories[key].parent_id : 0;
            if (!children[parent_id])
              children[parent_id] = [];
            children[parent_id].push(categories[key]);
          }
          for(var key in categories) {
            var category = categories[key];
            category.children = [];
            if (children[category.id])
              category.children = children[category.id];
          }
          return children[0];
        }
      };

/****************************************************************/ 
    
      var service = {};

      service.helpers = Helpers;
      service.getCategory = getCategory;
      service.syncPerformance = syncPerformance;
      service.API = meuAPI;
      service.init = init;
      service.getSiteLogoUrl = getSiteLogoUrl;
      service.getSiteProperty = getSiteProperty;
      service.getAssetUrl = getAssetUrl;
    
      return service;
    
      /*
        meuCloud.API.Site.performance()
        .then(function(response) {
          updateData(response);
          if (response.promise)
            return response.promise;
        })
        // If response contains a promise, means is from cache and promise will sync w/ Server
        .then(function(response) {
          updateData(response)
        })
        .catch(function(e) {
          $exceptionHandler(e);
        })
      
      */
      
      function init() {
        if (options.hasOwnProperty('apiUrl'))
          meuAPI.Config.setProperty('apiUrl', options.apiUrl);
      }
           
      function getCategory(id) {
        try {
          var categories = Helpers.lookup(data.categories);
          if (categories.hasOwnProperty(id)) {
            return categories[id];
          } else {
            return null;
          }
        } catch (e) {
          $exceptionHandler(e);
        };
      }
  
      function getData(property) {
        try {
          return data[property]; 
        } catch (e) {
          $exceptionHandler(e);
          return {};
        }
      }
      
      function getSiteProperty(property) {
        try {
          return data.site[property]; 
        } catch (e) {
          $exceptionHandler(e);
          return {};
        }
      }
      
      function getCategories() {
        return getData('categories');
      }
  
      function setCategories(categories) {
        data.categories = categories;
      }
      
      function setSite(site) {
        data.site = site;
      }
      
      function setVisitor(visitor) {
        data.visitor = visitor;
      }
      
      function getVisitor() {
        return data.visitor;
      }
      
      function getSiteLogoUrl() {
        try {
          return options.cdnUrl + data.site.logo; 
        } catch (e) {
          $exceptionHandler(e);
          return null;
        } 
      }
      
      function getAssetUrl(path) {
        try {
          return options.cdnUrl + path; 
        } catch (e) {
          $exceptionHandler(e);
          return null;
        } 
      }
      
      function setBusiness(business) {
        data.business = business;
      }
      
      function syncPerformance(data) {
        return $q(function(resolve, reject) {
          try {
            setCategories(data.categories);
            setSite(data.site);
            setBusiness(data.business);
            resolve(data);
          } catch (e) {
            $exceptionHandler(e);
            reject(e);
          };
        });
      }
    }
  }
  
  function API($rootScope, $http, $log, $exceptionHandler, meuHttpWithFallback) {
  
    var config = {};
    
    var convertJsonAsUriParameters = function(data) {
      var url = Object.keys(data).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }).join('&');
    
      return url;
    };

    var buildUrl = function(endp) {
      try {
        /*
          If config.domain is null then use domain empty
        */
        var domain = config.domain !== null ? config.domain : '';
        
        return config.apiUrl + domain + endp; 
      } catch (e) {
        $exceptionHandler(e);
      }
    };

    var api = (function() {
      return {
        get: function(endp, config) {
          var url = buildUrl(endp);
      
          return meuHttpWithFallback.get(url, config);
        },
        post: function(endp, obj) {
          return $http({
            method: 'POST',
            url: buildUrl(endp),
            data: angular.toJson(obj),
            responseType: 'json',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        },
        put: function(endp, obj) {
          return $http({
            method: 'PUT',
            url: buildUrl(endp),
            data: angular.toJson(obj),
            responseType: 'json',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        },
        del: function(endp, id) {
          return $http({
            method: 'DELETE',
            url: buildUrl(endp),
            responseType: 'json',
          });
        }
      };
    })();

    var app = {
      Categories: (function() {
        var path = '/categories/';
        return {
          query: function() {
            // TODO: Need to be tested
            return api.get(path, {});
          },
          items: function(category_id, config) {
            return api.get(path + category_id + '/items', config);
          }
        };
      })(),
      Items: (function() {
        var path = '/items/';
        return {
          latest: function() {
            return api.get(path + 'latest', {});
          },
          search: function(obj) {
            var url = path + 'search?' + convertJsonAsUriParameters(obj);
            return api.get(url, {});
          }
        };
      })(),
      Site: (function() {
        var path = '/performance';
        return {
          performance: function() {
            return api.get(path, {});
          }
        };
      })(),
      Login: (function() {
        var path = '/visitors/';
        return {
          signin: function(obj) {
            return api.post(path + 'login', obj);
          },
          get: function() {
            return api.get(path, {});
          },
          save: function(obj) {
            return api.put(path, obj);
          },
          // TODO: Need to be tested
          device: function(obj) {
            return api.post(path + 'devices', obj);
          },
          // TODO: Need to be tested
          update: function(obj) {
            return api.put(path + 'devices/' + obj.uuid);
          },
          reset: function(obj) {
            return api.post(path + 'forgot_password', obj);
          }
        };
      })(),
      Devices: (function() {
        var path = '/devices/';
        return {
          save: function(obj) {
            return api.put(path + obj.uuid, obj);
          } 
        };
      })(),
      Poll: (function() {
        var path = '/items/';
        return {
          submit: function(obj) {
            return api.post(path + obj.id + '/poll', obj.params);
          }
        };
      })(),
      Mail: (function() {
        var path = '/mail/';
        return {
          save: function(obj) {
            return api.post(path, obj);
          }
        };
      })(),
      Config: (function() {
        return {
          setProperties: function(prop) {
            angular.extend(config, prop);
          },
          getProperties: function() {
            return config;
          },
          setProperty: function(name, value) {
            config[name] = value;
          },
          getProperty: function(name) {
            return config[name];
          }
        };
      })()
    };
    
    return app;
  }
})();
/* global angular */
/* eslint no-undef: "error" */
(function () {
  'use strict';

  hrefToJS.$inject = ["$sce", "$sanitize"];
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
