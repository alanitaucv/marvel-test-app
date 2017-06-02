(function() {

  'use strict';

	var app = angular.module('app', ['ngSanitize', 'ngRoute', 'ngAnimate']);

	app.config (['$routeProvider', '$locationProvider',
	 function($routeProvider, $locationProvider){
	  $routeProvider
			.when('/', {
				templateUrl : 'views/view-characters.html',
				controller : 'mainController'
			})
			.otherwise({
				 redirectTo: '/'
			});
	}]);

  app.run(["$rootScope", "$location", function($rootScope, $location) {
      $rootScope.host = 'https://gateway.marvel.com';
      $rootScope.port = '443';
      $rootScope.basePath = '/v1/public/';
      $rootScope.url = $rootScope.host + ':' + $rootScope.port+$rootScope.basePath;
      $rootScope.url1 = 'http://gateway.marvel.com/v1/public/';
      $rootScope.apiKey = '64b478c2ce8591ad0d3598e18352bb5c';
      $rootScope.apiKeyP= '70fdd466e51bc7197ca0cd8a0a7cc5694a5a222d';
      $rootScope.limit = 10;
      $rootScope.headers =  {
        "Content-Type" : "application/json",
        "Accept": "application/json",
        'Authorization':'Basic YWxhbml0YXVjdkBnbWFpbC5jb206WmFzbzE5ODQq',
         'Accept': '*/*',
         'Access-Control-Allow-Origin': '*'
      };
  }]);

	app.controller('mainController', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope){

    this.loadCharacters = function(offset, orderBy, name){
      var skip = offset * $rootScope.limit;
      var ts = new Date().getTime();
      var url = $rootScope.url + 'characters?offset='+skip+'&limit='+$rootScope.limit+'&apikey='+$rootScope.apiKey;
      var hash = CryptoJS.MD5(ts + $rootScope.apiKeyP + $rootScope.apiKey, 'hex');
      url += "&ts="+ts+"&hash="+hash;
      console.log(url);
      url = 'https://gateway.marvel.com/v1/public/characters?offset=0&limit=10&apikey=64b478c2ce8591ad0d3598e18352bb5c&ts=1496282040288&hash=25cccf0ff4013fde152a82a1cf69edf9';
      $http({
         method: 'GET',
         headers: $rootScope.headers,
         url: url
      }).then(function (success){
          console.log('Paso');
      },function (error){
          console.log("Error consumiendo el servicio");
      });
      // $http.get(url, $rootScope.headers)
      //   .success( function (data, status, headers, config){
      //     console.log('Paso');
      //   })
      //   .error( function (data, status, headers, config){
      //     console.log("Error consumiendo el servicio");
      //   });
    };

	}]);

})();
