var app = ons.bootstrap('meu-app', ['onsen', 'ui.router', 'ngMeumobi.Utils'])
//angular.module('meu-app', ['onsen', 'ui.router', 'ngMeumobi.Utils']);

app.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/master");

    $stateProvider
    .state('navigator', {
      abstract: true,
      // url: '/navigator', // Optional url prefix
      resolve: {
        loaded: function($rootScope) {
          $rootScope.meuTabbar.setActiveTab(0);
          return $rootScope.meuTabbar.loadPage('html/navigator.html');
        }
      }
    })  
    .state('navigator.master', {
      parent: "navigator",
      url: "/master",
      onEnter: ['$rootScope', function($rootScope) {
            $rootScope.navi.resetToPage('ons-templates/list.html');
          }]
    })
    .state('navigator.master.detail', {
      parent: "navigator.master",
      url: "/detail/:id",
      onEnter: ['$rootScope','$stateParams', function($rootScope,$stateParams) {
            $rootScope.navi.pushPage('ons-templates/items/show.html', {'id': $stateParams.id});
          }],
      onExit: function($rootScope) {
      	$rootScope.navi.popPage();
      }
    })
    .state('contact', {
      url: "/contact",
      resolve: {
        loaded: function($rootScope) {
          $rootScope.meuTabbar.setActiveTab(2);
          return $rootScope.meuTabbar.loadPage('ons-templates/contact.html');
        }
      }
    })
});

app.controller('MainController', function($scope) { });
app.controller('PageController', function($scope) {
  ons.ready(function() {
    // Init code here
  });
});

app.controller('LatestController', function($scope, meuFilesServices, $log) { 
    $scope.open = function(uri, type) {
      meuFilesServices.open(uri, type).then(
        function() {
          $log.debug("File open success");
        },
        function(e) {
          $log.debug("File open error");
        }
      )
    }

    this.items = [
      {
        title: 'Water the plants',
        done: false,
        images: [
          {path: '6932655.png'}
        ]
      },
      {
        title: 'Walk the dog',
        done: true,
        images: [
          {path: '6932655.png'}
        ]
      },
      {
        title: 'Go to the dentist',
        done: false,
        images: [
          {path: '6932655.png'}
        ]
      },
      {
        title: 'Buy milk',
        done: false,
        images: [
          {path: '6932655.png'}
        ]
      },
      {
        title: 'Play tennis',
        done: true,
        images: [
          {path: '6932655.png'}
        ]
      }
    ];
});