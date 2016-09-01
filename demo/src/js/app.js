var module = angular.module('meu-app', ['onsen', 'ngMeumobi.Utils']);
module.controller('AppController', function($scope) { });

module.controller('LatestController', function($scope) { 
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
    },
    {
      title: 'Go to the dentist',
      done: false,
    },
    {
      title: 'Buy milk',
      done: false,
    },
    {
      title: 'Play tennis',
      done: true,
    }
  ];
});

module.controller('PageController', function($scope) {
  ons.ready(function() {
    // Init code here
  });
});