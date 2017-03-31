ng-meumobi-utils was built to help make app development with meumobi faster and more efficient than ever before. It gives you simple AngularJS wrappers for the most popular Cordova and PhoneGap plugins available. 

# Best Practices

## Don't Forget To Cancel $timeout Timers
https://www.bennadel.com/blog/2548-don-t-forget-to-cancel-timeout-timers-in-your-destroy-events-in-angularjs.htm

## Promises - reject vs. throw

The .then() handler catches the thrown exception and turns it into a rejected promise automatically.

http://stackoverflow.com/questions/33445415/javascript-promises-reject-vs-throw

## localStorage.getItem('item') vs localStorage.item or localStorage['item']?
http://stackoverflow.com/questions/12632463/is-localstorage-getitemitem-better-than-localstorage-item-or-localstoragei

## Promise: always add catch
https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html

## The Deferred anti-pattern
In Deferred anti-pattern, "deferred" objects are created for no reason, complicating code.

https://blog.domenic.me/the-revealing-constructor-pattern/
https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns#the-deferred-anti-pattern

## The .then(success, fail) anti-pattern
https://github.com/petkaantonov/bluebird/wiki/Promise-anti-patterns#the-thensuccess-fail-anti-pattern

```javascript

    function getUUID() {
      
      return new Promise(function (resolve, reject) {
        
        var cb_uuid = {
          success: function(uuid) {
            resolve(uuid);
          },
          fail: function() {
            throw new Error('Unable to retrieve Device uuid');
          }
        };
        
        var uniqueDeviceID = $window.plugins && $window.plugins.uniqueDeviceID;
        
        if (uniqueDeviceID) {
          uniqueDeviceID.get(cb_uuid.success, cb_uuid.fail);
        } else {
          throw new Error('Missing cordova-plugin-uniquedeviceid Plugin');
        }      
      });
    }
```
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
[Measuring the mobile Experience](http://blog.katworksgames.com/2015/10/24/measuring-the-mobile-experience/)
## Usage
Add module 'ngMeumobi.Utils.analytics' as a dependency to your app unless you have already included one of its super-modules.
On cordova add Plugin 'google-analytics-plugin' on config.xml.

## Init
On Bootstrap and after deviceready event fired init module:

```js
deviceReady(function() {
  ...
  meuAnalytics.startTrackerWithId(trackId);
  ...
}
```

## Track View
On main controller

```js
  /*
    Track current page
  */
	$rootScope.$on('$routeChangeSuccess', function(e, current, prev) {
    if (current.$$route)
      deviceReady(function(){
        meuAnalytics.trackView(current.$$route.title);
      });
	});

```

## Track Event
[Event in Google Analytics](https://www.optimizesmart.com/event-tracking-guide-google-analytics-simplified-version/) is the user’s interaction /activity with a webpage element.

- **Event Category** – It is the name assigned to the group of similar events you want to track. For example: Profitable engagement, Reading, YouTube Videos etc
- **Event Action** – It is the name assigned to the type of event you want to track for a particular webpage element. For example: play, pause, 0% etc.
- **Event Label** – It is the name assigned to the web page element, whose users’ interaction you want to track. Event label can be a title of a video, title tag of a web page, name of a gadget, name of the downloadable file etc.
- **Event value** – It is the numerical value assigned to the event you want to track. For example, an event value can be: download time, length of the video footage played


TrackEvent: meuAnalytics.trackEvent(Category, Action, Label, Value);

|----|----|----|----|
|Category|Action|Label|Value|
|----|----|----|----|
|Events|Add to calendar|{Title}|-|
|Media|Open|{Title}|{Length}|
|Media|Download|{Title}|{Length}|
|Media|Play {media.type|name}|{Title}|{Duration}|
|Media|Delete|{Title}|{Length}|
|Social|Share {item.type || media}|{Title}|-|
|External Links|Click|{Title}|-|
|Authentication|Error||-|
|Authentication|Forget Password||-|
|Authentication|Login||-|
|Authentication|Logout||-|
|Account|Change Password||-|
|Contact|Send||-|
|Contact|Send||-|
|Navigation|Swipe-left|{category.title}|-|
|Navigation|Swipe-right|{category.title}|-|
|Navigation|Scroll load|{category.title}|-|
|Navigation|Open SideBar-left||-|
|Navigation|Open SideBar-right||-|
|Navigation|Close SideBar-left||-|
|Navigation|Close SideBar-right||-|
|Social|Rate Android app|{value}|-|
|Social|Rate iOS app|{value}|-|
|Polls|Vote|{index}|-|

## Change GA Id during navigation

## Track by User Id (custom) instead of default Client Id
https://www.optimizesmart.com/complete-guide-cross-device-tracking-user-id-google-analytics/
https://developers.google.com/analytics/devguides/collection/analyticsjs/cookies-user-id

# Calendar
## Dependencies

- Cordova Plugin: [cordova-plugin-calendar](https://www.npmjs.com/package/cordova-plugin-calendar) allows you to manipulate the native calendar.
- JS Libraries: 
  - [moment](http://momentjs.com/): Parse, validate, manipulate, and display dates.
  - [moment-timezone](http://momentjs.com/timezone/): Parse and display dates in any timezone.
  - [angular-moment](https://github.com/urish/angular-moment): Moment.JS directives for Angular.JS (timeago and more).

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