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



	app.controller('appController', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope){


	}]);

})();
