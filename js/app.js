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
      $rootScope.apiKey = 'aquiVaTuApiKeyPublica';
      $rootScope.apiKeyP= 'aquiVaTuApiKeyPrivada';
      $rootScope.limit = 10;
      $rootScope.headers =  {
        "Content-Type" : "application/json",
        "Accept": "application/json"
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

      $http({
         method: 'GET',
         headers: $rootScope.headers,
         url: url
      }).then(function (data, status, success){
          console.log('Paso'+angular.toJson(data));
      },function (data, status, error){
          console.log("Error consumiendo el servicio");
      });
    };

	}]);

})();
