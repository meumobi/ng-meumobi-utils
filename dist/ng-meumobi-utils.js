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
(function() {
	'use strict';

	loadingInterceptor.$inject = ["$q", "$rootScope", "$log"];
	angular
	.module('ngMeumobi.Utils.loading', [])
	.factory('loadingInterceptor', loadingInterceptor);
	
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
})();

(function () {
  'use strict';
  
	mediaClickLabel.$inject = ["MIMES"];
	mediaIconClass.$inject = ["MIMES"];
angular
	.module('ngMeumobi.Utils.files', ['slugifier'])
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
  .provider('meuFiles', meuFiles); 
        
  function meuFiles() {
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
      angular.extend(options, options);
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
})();
(function() {
	'use strict';

  meuDialogs.$inject = ["$q", "$window"];
	angular
	.module('ngMeumobi.Utils.dialogs', [])
	.factory('meuDialogs', meuDialogs);
  
  /*
    install   :     cordova plugin add cordova-plugin-dialogs nl.x-services.plugins.toast
    link      :     https://github.com/apache/cordova-plugin-dialogs
    link      :     https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin  
  */
  
  function meuDialogs($q, $window) {
    
    var service = {};
    
    service.alert = alert;
    service.confirm = confirm;
    service.toast = toast;
    
    return service;
    
    function alert (message, title, buttonName) {
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
    
    function confirm (message, title, buttonLabels) {
      var q = $q.defer();

      if (!$window.navigator.notification) {
        if ($window.confirm(message)) {
          q.resolve(1);
        } else {
          q.resolve(2);
        }
      } else {
        navigator.notification.confirm(message, function (buttonIndex) {
          q.resolve(buttonIndex);
        }, title, buttonLabels);
      }

      return q.promise;
    };
    
    function toast (message) {
      var q = $q.defer();
			var toast = $window.plugins && $window.plugins.toast;
      
			if (toast) {
        toast.showLongBottom(message, function (response) {
          q.resolve(response);
        }, function (error) {
          q.reject(error);
        });
      } else {
        alert(message);
      }
      
      return q.promise;
    };
  }
})();
(function() {
	'use strict';

	angular
	.module('ngMeumobi.Utils.calendar', [])
	.factory('meuCalendar', ['$q', '$window', 'striptagsFilter', 'br2nlFilter', meuCalendar]);
  
  /*
    cordova plugin add https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin.git
    If start and end_date equal 00:00 then the event occurs all day long
  */
  
  function meuCalendar($q, $window, striptags, br2nl) {
    
    var service = {};
    
    service.createEventInteractively = createEventInteractively;
    
    return service;
    
    function createEventInteractively(options) {
      var d = $q.defer(),
        defaultOptions = {
          title: null,
          address: null,
          description: '',
          start_date: null,
          end_date: null
        };

      defaultOptions = angular.extend(defaultOptions, options);

      $window.plugins.calendar.createEventInteractively(
        striptags(defaultOptions.title),
        striptags(defaultOptions.address),
        striptags(br2nl(defaultOptions.description)),
        new Date(defaultOptions.start_date  * 1000),
        new Date(defaultOptions.end_date  * 1000),
        function (message) {
          d.resolve(message);
        }, function (error) {
          d.reject(error);
        }
      );

      return d.promise;
    }
  }
})();
(function() {
	'use strict';
  
	googleAnalyticsCordova.$inject = ["$cordovaGoogleAnalytics", "$log"];
	googleAnalytics.$inject = ["$log", "$q"];
  $cordovaGoogleAnalytics.$inject = ["$q", "$window", "$log"];
	meuAnalytics.$inject = ["$injector", "$window"];
	angular
	.module('ngMeumobi.Utils.analytics', [])
	.factory('googleAnalyticsCordova', googleAnalyticsCordova)
	.factory('googleAnalytics', googleAnalytics)
  .factory('$cordovaGoogleAnalytics', $cordovaGoogleAnalytics)
	.factory('meuAnalytics', meuAnalytics);
  
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
  
	function meuAnalytics($injector, $window) {

		if ($window.cordova) {
			return $injector.get('googleAnalyticsCordova');
		} else {
		  return $injector.get('googleAnalytics');
		}
	}
})();
/* global angular */
/* eslint no-undef: "error" */
(function () {
  'use strict';

  angular.module('ngMeumobi.Utils.filters', [])
  .filter('isEmpty', isEmpty)
  .filter('br2nl', br2nl)
  .filter('striptags', striptags);

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
})();

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
