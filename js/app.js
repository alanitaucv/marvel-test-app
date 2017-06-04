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
      $rootScope.apiKey = '64b478c2ce8591ad0d3598e18352bb5c';
      $rootScope.apiKeyP= '70fdd466e51bc7197ca0cd8a0a7cc5694a5a222d';
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

	app.controller('mainController', ['$scope', '$http', '$rootScope','$filter', "$window",  function($scope, $http, $rootScope, $filter, $window){
    $scope.classCSS=['one','two','three','four','five','six','seven','eight','nine','ten'];
    $scope.searchName='';
    $scope.classFav='add-fav';
    $scope.ed='';
    $scope.comicsFavs = new Array();
    $scope.alert='';
    $scope.pagination=[];
    $scope.search={'param':'name','name':''};
    $scope.model={
      'characters' : []
    };

    if (localStorage.getItem('comicsFavoritos')!=undefined && localStorage.getItem('comicsFavoritos')!=null){
      $scope.comicsFavs=JSON.parse(localStorage.getItem('comicsFavoritos'));
    }

    this.keydown = function(ev, type){
      if (ev.which === 13 || ev.which === 9) {//Enter or tab
        if ($scope.pagination!=undefined)
          $scope.currentPage=$scope.pagination[0];
        $scope.pageOffset=0;
        $scope.comicDescription ={};
        if (type==0) this.loadCharacters(0, $scope.orderFilter, $scope.searchName);
        else this.loadCharacters(0, $scope.orderFilter,$scope.search.name);
      }
    }

    this.loadCharacters = function(offset, orderBy, name){
      $scope.searchName=name;
      $scope.notFound=false;
      $window.scrollTo(0, 0);

      var skip = offset * $rootScope.limit;
      var url = $rootScope.url + 'characters?offset='+skip+'&limit='+$rootScope.limit;

      $scope.orderFilter=orderBy;
      $scope.select(offset+1);
      $scope.isActive($scope.currentPage);

      if (orderBy!='' && orderBy!=undefined)
          url +='&orderBy='+orderBy;
      if (name!='' && name!=undefined && $scope.search.param=='name')
          url +='&name='+name;
      if (name!='' && name!=undefined && $scope.search.param=='nameStartsWith')
          url +='&nameStartsWith='+name;
      if (name!='' && name!=undefined && $scope.search.param=='modifiedSince')
          url +='&modifiedSince='+name;
      if (name!='' && name!=undefined && $scope.search.param=='comics')
          url +='&comics='+name;
      if (name!='' && name!=undefined && $scope.search.param=='series')
          url +='&series='+name;
      if (name!='' && name!=undefined && $scope.search.param=='events')
          url +='&events='+name;
      if (name!='' && name!=undefined && $scope.search.param=='stories')
          url +='&stories='+name;

      var ts = new Date().getTime();
      var hash = CryptoJS.MD5(ts + $rootScope.apiKeyP + $rootScope.apiKey, 'hex');
      url +='&apikey='+$rootScope.apiKey+"&ts="+ts+"&hash="+hash;

      $http({
         method: 'GET',
         headers: $rootScope.headers,
         url: url
      }).then(function (data, status, success){
          console.log('Paso! ');
          $scope.model.characters = data.data.data.results;
          var charactersTotal = data.data.data.total;
          if (data.data.data.total==0){
            $scope.notFound=true;
            $scope.search={'param':'nameStartsWith'};
          }
          //Me aseguro que cree el arreglo la 1ra vez y las siguientes veces evalua si hay cambio en la cantidad de
          if ($scope.pagination==undefined || $scope.pagination.length!=charactersTotal)
            $scope.pagination=Array.from(new Array(Math.ceil(charactersTotal/$rootScope.limit)),(val,index)=>index+1);

          for(var i = 0; i<$scope.model.characters.length; ++i){
            $scope.model.characters[i].comics.items=$filter('azar')($scope.model.characters[i].comics.items);
          }
      },function (data, status, error){
          console.log("Error consumiendo el servicio");
      });
    };


    if ($scope.pagination!=undefined)
      $scope.currentPage=$scope.pagination[0];
    $scope.pageOffset=0;

    this.loadComic = function(comicPath){
      $scope.alert='';
      $scope.comicDescription ={};
      $scope.classFav='add-fav';
      $scope.comicDescription.title ='';
      $scope.comicDescription.id ='';
      $scope.comicDescription.description = '';
      $scope.comicDescription.image ='';
      $scope.comicDescription.carLink='';
      $scope.comicDescription.price='';
      $scope.ed='';

      var url = $rootScope.url + 'comics/'+comicPath.split('/').slice(-1)[0];

      //meter esto en una funcion
      var ts = new Date().getTime();
      var hash = CryptoJS.MD5(ts + $rootScope.apiKeyP + $rootScope.apiKey, 'hex');
      url +='?apikey='+$rootScope.apiKey+"&ts="+ts+"&hash="+hash;

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

          if ($scope.isComicAddedFav($scope.comicDescription)!=-1){
            $scope.classFav="added-fav";
            $scope.ed = "ed";
          }

      },function (data, status, error){
          console.log("Error consumiendo el servicio");
      });
    };


    //to localStorage
    this.addComic = function(comic){
      if ($scope.comicsFavs.length<3 && $scope.isComicAddedFav(comic)==-1){
          $scope.comicsFavs.push(comic);
          $scope.classFav="added-fav";
          $scope.ed = "ed";
          if (typeof(Storage) !== "undefined") {
            localStorage.setItem("comicsFavoritos", JSON.stringify($scope.comicsFavs));
          } else {
            console.log("This browser doesn't support localStorage");
          }
      }else if ($scope.comicsFavs.length==3){
        $scope.alert='<div class="alert alert-info" role="alert">Your favourite list is full!.<br/> For add an additional comic please remove one first.</div>';
        console.log('localStorage full');
      }

  //    console.log($scope.comicsFavs);
    }

    $scope.isComicAddedFav = function(comic){
        for(var c=0; c<$scope.comicsFavs.length;++c){
          if ((comic!=null && comic!=undefined && comic!="") && $scope.comicsFavs[c].id == comic.id){
            $scope.classFav="added-fav";
            $scope.ed = "ed";
            return c;
          }
        }
      $scope.classFav="add-fav";
      $scope.ed = "";
      return -1;
    }

    // from localStorage
    this.deleteComic = function(comic){
      $scope.comicsFavs.splice($scope.comicsFavs.indexOf(comic),1);
      if (typeof(Storage) !== "undefined") {
        localStorage.setItem("comicsFavoritos", JSON.stringify($scope.comicsFavs));
      } else {
        console.log("This browser doesn't support localStorage");
      }
    };

    // pagination
    $scope.select= function(item) {
        $scope.currentPage = item;
    };
    $scope.isActive = function(item) {
        return $scope.currentPage === item;
    };
    this.addOnePage=function(){
      ($scope.pageOffset+1<$scope.pagination.length) ? $scope.pageOffset+=1 : $scope.pageOffset;
    };
    this.removeOnePage=function(){
     ($scope.pageOffset-1>=0) ? $scope.pageOffset-=1 : $scope.pageOffset=0;
    };
    this.characterInfo=function(character){
      $scope.characterInfo=character;
    }

	}]);

})();
