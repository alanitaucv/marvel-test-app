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

  app.filter('azar', function() {
      return function(a) {
          var r = [];
          while (a.length)
            r.push(
              a.splice((Math.floor(Math.random() * a.length)), 1)[0]
            );
          return r;
      }
    });

	app.controller('mainController', ['$scope', '$http', '$rootScope','$filter', function($scope, $http, $rootScope, $filter){
    $scope.classCSS=['one','two','three','four','five','six','seven','eight','nine','ten'];

    $scope.model={
      'characters' : []
    };

    this.loadCharacters = function(offset, orderBy, name){
      var skip = offset * $rootScope.limit;
      var ts = new Date().getTime();
      var url = $rootScope.url + 'characters?offset='+skip+'&limit='+$rootScope.limit;

      if (orderBy!='' && orderBy!=undefined)
          url +='&orderBy='+orderBy;

      var hash = CryptoJS.MD5(ts + $rootScope.apiKeyP + $rootScope.apiKey, 'hex');
      url +='&apikey='+$rootScope.apiKey+"&ts="+ts+"&hash="+hash;
      console.log(url);

      $http({
         method: 'GET',
         headers: $rootScope.headers,
         url: url
      }).then(function (data, status, success){
          console.log('Paso! ');
          $scope.model.characters = data.data.data.results;
          var charactersTotal = data.data.data.total;
          console.log(charactersTotal);
          //Me aseguro que cree el arreglo la 1ra vez y las siguientes veces evalua si hay cambio en la cantidad de
          if ($scope.pagination==undefined || $scope.pagination.length!=charactersTotal)
            $scope.pagination=Array.from(new Array(charactersTotal),(val,index)=>index+1);

          for(var i = 0; i<$scope.model.characters.length; ++i){
            $scope.model.characters[i].comics.items=$filter('azar')($scope.model.characters[i].comics.items);
          }

          // console.log("Characters: "+ angular.toJson($scope.model.characters));
      },function (data, status, error){
          console.log("Error consumiendo el servicio");
      });
    };
    if ($scope.pagination!=undefined)
      $scope.currentPage=$scope.pagination[0];
    $scope.pageOffset=0;
    $scope.comicDescription ={};

    this.loadComic = function(comicPath){
      $scope.comicDescription.title ='';
      $scope.comicDescription.id ='';
      $scope.comicDescription.description = '';
      $scope.comicDescription.image ='';
      $scope.comicDescription.carLink='/#';
      $scope.comicDescription.price='';

      var ts = new Date().getTime();
      var url = $rootScope.url + 'comics/'+comicPath.split('/').slice(-1)[0];
      var hash = CryptoJS.MD5(ts + $rootScope.apiKeyP + $rootScope.apiKey, 'hex');
      url +='?apikey='+$rootScope.apiKey+"&ts="+ts+"&hash="+hash;
      console.log(url);

      $http({
         method: 'GET',
         headers: $rootScope.headers,
         url: url
      }).then(function (data, status, success){
          console.log('Paso! ');
          $scope.comicDescription.title = data.data.data.results[0].title;
          $scope.comicDescription.id = data.data.data.results[0].id;
          $scope.comicDescription.description = data.data.data.results[0].description;
          $scope.comicDescription.image = data.data.data.results[0].thumbnail.path+'.'+data.data.data.results[0].thumbnail.extension;

          for (var j=0; j<data.data.data.results[0].urls.length; ++j){
            if (data.data.data.results[0].urls[j].type=="purchase"){
              $scope.comicDescription.carLink=data.data.data.results[0].urls[j].url;
              break;
            }
          }
          for (var j=0; j<data.data.data.results[0].prices.length; ++j){
            if (data.data.data.results[0].prices[j].type=="digitalPurchasePrice"){
              $scope.comicDescription.price=data.data.data.results[0].prices[j].price;
              break;
            }
          }

          console.log("Comic: "+ angular.toJson($scope.comicDescription));
      },function (data, status, error){
          console.log("Error consumiendo el servicio");
      });
    };

    // pagination
    $scope.select= function(item) {
        $scope.currentPage = item;
    };

   $scope.isActive = function(item) {
        return $scope.currentPage === item;
   };

   this.addOnePage=function(){
      $scope.pageOffset+=1;
   };
  //  this.addOneLastPage=function(){
  //     $scope.pageOffset+=1;
  //     $scope.select($scope.pagination[$scope.pageOffset+1]);
  //     $scope.currentPage=$scope.pagination[$scope.pageOffset+1];
  //  };
   this.removeOnePage=function(){
     ($scope.pageOffset-1>=0) ? $scope.pageOffset-=1 : $scope.pageOffset=0;
   };

	}]);

})();
