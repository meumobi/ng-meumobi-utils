

- [gulp-angular-filesort](https://www.npmjs.com/package/gulp-angular-filesort): Automatically sort AngularJS app files depending on module definitions and usage
- [gulp-sourcemaps](https://www.npmjs.com/package/gulp-sourcemaps)


# Downloads
cordova-open use the extension of file to discover the mime-type. To maintain it we need to provide on App an up-to-date hash of mime-type/extension.
It's why we should prefer to use fileOpener2 and use the mime-type provided by backend.

				DeviceService.getDownloadDir(function(dir) {
					fileTransfer.download(uri, dir + "/" + fileName, transfer.success, transfer.error, false);
				});

				var directory = null;
				if (device.platform == "Android") {
					directory = cordova.file.externalDataDirectory;
					$log.debug("[Android] Set download dir: " + directory)
				} else {
	        directory = cordova.file.dataDirectory;
					$log.debug("[iOS] Set download dir: " + directory);
				}

See $cordovaFileTransfer.download

# List Plugins installed
https://www.raymondcamden.com/2014/11/19/Determing-installed-plugins-at-runtime-for-Cordova-and-PhoneGap-applications/:
var md = cordova.require("cordova/plugin_list").metadata;

# API Requests
module ngMeumobi.Utils.api

```js
.config(function (meuAPIProvider) {
  meuAPIProvider.setOptions({
    apiUrl: "http://meumobi.com/api/"
  })
})
```

  - Events: "loading:start/stop", "connection:on/off". $rootScope.$on('loading:stop', function () {...})
  Check #IRmobi .factory('httpInterceptor', httpInterceptor);
	//handle http errors
	$httpProvider.interceptors.push('loadingInterceptor');
  $httpProvider.interceptors.push('errorInterceptor');
  
Promise.all: https://github.com/meumobi/IRmobi/issues/205
# Analytics
.module('ngMeumobi.Utils.analytics') 
w/ Plugin google-analytics-plugin
No need of ngCordova

On Bootstrap

```js
deviceReady(function() {
  meuAnalytics.init(CONFIG.ANALYTICS.trackId);
```

TrackView
meuAnalytics.trackView(current.$$route.title);

TrackEvent
meuAnalytics.trackEvent(...);

/!\ Could we change trackId during navigation (pre/post Auth)

# Calendar
## create event interactively
Add Service 'meuCalendar'

// if item.type == 'event'
meuCalendar.createEventInteractively(item)
  .then(
    function(result) {
      /*
        The Calendar App should emit msg to confirm Event creation
      */
      $log.debug("Success: " + JSON.stringify(result));
    }
  )
  .error(
    function(err) {
      UtilsService.toast(translateFilter("Error: " + angular.toJson(err))); 
    }
  ) 
         
## display Event

## dayLong 
if start_date == end_date And are equal to 0 then the event is 'All day'.

# Authentication

# Network
- Helpers: isOn/OffLine
  document.addEventListener("online", $rootScope.toggleCon, false);
  document.addEventListener("offline", $rootScope.toggleCon, false);
# Languages
## set
## select
## translations

# Locales

# Images
## cache
## thumbs

# Categories
## Tree

# Items
## Cache
## Load Next/Previous

# Site.data
## Cache
## Categories
## Business
## Skin