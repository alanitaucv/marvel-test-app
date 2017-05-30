(function() {

  'use strict';

	var app = angular.module('app', ['ngSanitize', 'ngRoute']);


	app.config (['$routeProvider', '$locationProvider',
	 function($routeProvider, $locationProvider){
	  $routeProvider
			.when('/', {
				templateUrl : 'views/view-home.html',
				controller : 'mainController'
			})
			.otherwise({
				 redirectTo: '/'
			});

	}]);



	app.controller('appController', ['$scope', '$http', '$rootScope', function($scope, $http, $rootScope){


	}]);

})();