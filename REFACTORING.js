For better UX, prevent loading news at each visit to /items/list #153
"bowerize" meumobi-api #16
Replace httpwithfallback by angular-http-tag #230
replace ng-switch by itemHeadline directive #227
replace services by ng-meumobi-utils bower package #214

MeuMobi.downloads.directory

meuPushNotification.init
  meuPush.token

meuDownloads.init
  meuDownloads.directory

meuConnection.init
  meuConnection.isOnline


// Load APP or filled w/ gulp
.config(function (MeuAPIProvider, APP) {
  MeuAPIProvider.setOptions({
    cdnUrl: , // APP.cdnUrl
    apiUrl: , // APP.apiUrl
    domains: , // APP.DOMAINS
    languages: ,// localStorage.language ? localStorage.language : "pt";
    allowedTypes: // events, articles, etc.
  })
})

=== DONE
+ Helpers.lookup

controllers/Items $rootScope.items = lookup(items)
  replace by MeuAPI.Helpers.s
  getItemsByCategoryId

:category_id : [
  :item_id: {},
  :item_id: {},
  ...
],
:category_id: [...]

getItemsLatest => call API to sync (loading) on bootstrap and pull during session
    
controllers/
  Events, main_controllers, show_controllers use $rootScope.items[:id], should be replaced by
  

=== TODO
Component items-headlines
  dynamic templateUrl (see IRmobi)












- need to sync/erase performance and provide getters
- decorateItem: items.load Next/Previous
- separate get Device fingerPrint and save it => Device.setProperty(name, value) & Device.getProperties() & API.Devices.save
- reset APP datas (as 1st launch)

- get performance without to call API
- get current Category
- get current Item
- Helpers: getCategoriesTree
- Private: getApiUrl
- Helpers: getAssetsUrl
- thumbify = function(imagePath, prefix), display thumb of image, media or item. Merge w/ getImage on #infomobi
- Helpers: isAndroid/iOS/App/Browser. ImgCache.helpers.isCordova())
- load all categories content => promise.all && $rootScope.$broadcast("loading:start/stop")

## Language
Should load available languages and select preferred, from saved preferences or device configuration

## Separate Core and API meumobi

=== From IRmobi src/js/lib/angular-meumobi.js

/*
  getSiteBuilderApiUrl(path)
  Settings.apiUrl + getDomain() + path
  #infomobi buildUrl function on meumobi-api.js
*/
service.getSiteBuilderApiUrl = getSiteBuilderApiUrl;

/*
  getAssetUrl(path)
  cdnUrl + path
  #infomobi $rootScope.getImage = function(path){...}
*/
service.getAssetUrl = getAssetUrl;

+ headlines_controller
data.cover = coverPath ? meumobiSite.getAssetUrl(coverPath) : coverPath;
+ main_controller
data.logo = meumobiSite.getAssetUrl(data.site.logo);

/*
  @param array of categories
  @return a tree of categories: array with (sub)categories 
*/
service.getCategoriesTree = getCategoriesTree;

+ headlines_controller
data.categories = meumobiSite.getCategoriesTree(response.data.categories);
+ main_controller
data.categories = meumobiSite.getCategoriesTree(response.data.categories);


/*
  @param path: api endpoint and params
  httpWithFallback.get(getSiteBuilderApiUrl(path))
*/
service.apiRequest = apiRequest;

- NOT USED

/*
  httpWithFallback.get(getSiteBuilderApiUrl("/performance")
*/
service.performance = performance;

- NOT USED

/*
  @param lang
  used only if multi-language then: 

			function getSiteBuilderApiUrl(path) {
				var lang = getLanguage();
				return that.apiUrl + that.domains[lang] + path;
			}
*/
service.setLanguage = setLanguage;

+ main_controller
meumobiSite.setLanguage(language);
+ Language_meumobi.services
function setLanguage(lang) {
	// Check if language is available, if not log and cancel action
	var availableLanguages = getAvailableLanguages();
	if (availableLanguages.indexOf(lang) > -1) {
		localStorage['Settings.language'] = lang;
		meumobiSite.setLanguage(lang);
		//$rootScope = language;
	} else {
		console.log("Lang not available: " + lang);
	}
}

/*
  @param lang
*/
service.setDefaultLanguage = setDefaultLanguage;

- NOT USED

service.cdnUrl = that.cdnUrl;
service.apiUrl = that.apiUrl;
service.domains = that.domains;
service.httpTimeout = that.httpTimeout;

/*
  #infomobi not exists, always sync
*/
service.getWebAppData = getWebAppData;

+ contact_controllers
function activate() {
	meumobiSite.getWebAppData()
	.then(function(response) {
		vm.business = response.data.business;
		vm.site = response.data.site;
	})
	.catch(function(response) {
		console.log(response);
	})
}
+ headlines_controller.js
+ main_controller.js
+ stock_controller.js

/*
  @params id
  Check if categories exist on meuWebApp Object
  If not then id is wrong
*/
service.getCategory = getCategory;

+ app/app.js
var resolveCategory = function($route, meumobiSite) {
	return meumobiSite.getCategory($route.current.params.id).then(function(data) {
...	  
	})
}

/*
  @param id
*/
service.setSelectedItem = setSelectedItem;

+ app/app.js
$rootScope.goToItem = function(item) {
	meumobiSite.setSelectedItem(item);
	try {
		$location.path("/items/" + item._id);
	} catch (e) {
		console.log(e);
	}	
};

/*
  return var selectedItem
  #infomobi $rootScope.news[$routeParams.id];
*/
service.getSelectedItem = getSelectedItem;

return $q.when(selectedItem);

+ app/app.js
viewName: function($route, meumobiSite) {
	return meumobiSite.getSelectedItem().then(function(item) {
		$route.current.$$route.title =  item.title;
		$route.current.$$route.view = '/items/' + item.id;
		return item;
	});
}

/*
  #infomobi done by AuthService.logout();
*/
service.resetWebApp = resetWebApp;

+ main_controller
//Select language and reload the site
$scope.setLanguage = function(language) {
	if (LanguageService.getLanguage() != language ) {
		LanguageService.setLanguage(language);
    amMoment.changeLocale(language);
		meumobiSite.setLanguage(language);
		meumobiSite.resetWebApp();
		activate();
		reload();
		$translate.use(language);
		$location.path('/');
	}
}

/*
  @param {json} options
  #infomobi done by DeviceService.save(token);
*/
service.saveDevice = saveDevice;

+ Bootstrap_meumobi.services

/*
  Should be replaced by loadNext(path), if path.indexOf("/api") == 0 then slice(4) 
*/
service.apiFullPathRequest = apiFullPathRequest;

return httpWithFallback.get(that.cdnUrl + path)

+ events_controller
function loadNextPage(path) {
  vm.scrollDisabled = true;
  if (path) {
    meumobiSite.apiFullPathRequest(path).then(
      cb_loadNextPage.success, 
      cb_loadNextPage.fail
    );
  }
}

+ item_controller

==== From infomobi src/js/services/Cloud_meumobi.services.js

/*
  @description call performance
*/
service.syncPerformance = syncPerformance;

api.getPerformance()
.then(function(response) {
	fulfill(response, success);
})

+ login_controller
var authenticateUser = function() {
	MeumobiCloud.syncPerformance(
		function(response) {
			var data = response.data;
+ main_controller