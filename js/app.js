(function() {

  'use strict';

	var app = angular.module('app', ['ngSanitize', 'ngRoute', 'ngAnimate']);

  //Config de app
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

  //Inicializa el $rootScope con valores constantes
  app.run(["$rootScope", function($rootScope) {
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

  //Reorganiza una lista de manera aleatoria
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

  //Construye el valor hash para la conexion a la api de marvel
  function buildHash($rootScope){
    var ts = new Date().getTime();
    var hash = CryptoJS.MD5(ts + $rootScope.apiKeyP + $rootScope.apiKey, 'hex');
    return 'apikey='+$rootScope.apiKey+"&ts="+ts+"&hash="+hash;
  }

  //Construye la url con los parametros segun los valores indicados por el usuario
  function buildUrl(url, orderBy, name, $scope){
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
    return url;
  }

  //Inicializa el modelos de datos correspondiente a los comics
  function initComicDescription($scope){
    $scope.alert=''; // feedback para con el usuario
    $scope.classFav='add-fav';
    $scope.ed='';
    $scope.comicDescription ={};
    $scope.comicDescription.title ='';
    $scope.comicDescription.id ='';
    $scope.comicDescription.description = '';
    $scope.comicDescription.image ='';
    $scope.comicDescription.carLink='';
    $scope.comicDescription.price='';
  }

  //Incializa el scope
  function init($scope){
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
  }

	app.controller('mainController', ['$scope', '$http', '$rootScope','$filter', "$window",  function($scope, $http, $rootScope, $filter, $window){

    init($scope);

    //Carga los comics presentes en la lista de favoritos en el localStorage
    if (localStorage.getItem('comicsFavoritos')!=undefined && localStorage.getItem('comicsFavoritos')!=null){
      $scope.comicsFavs=JSON.parse(localStorage.getItem('comicsFavoritos'));
    }

    //Busca un personaje al presionar la tecla enter o tabular
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

    //Carga los personajes
    this.loadCharacters = function(offset, orderBy, name){
      $scope.searchName=name;
      $scope.notFound=false;

      //Regresa el scroll de la pagina al inicio al cargar un conjunto de personajes
      $window.scrollTo(0, 0);

      //calcula los siguientes personajes a mostrar
      var skip = offset * $rootScope.limit;
      var url = $rootScope.url + 'characters?offset='+skip+'&limit='+$rootScope.limit;

      //inicializa pagina inicial y el tipo de orden indicado por el usuario
      $scope.orderFilter=orderBy;
      $scope.select(offset+1);
      $scope.isActive($scope.currentPage);

      //Construye la url con los parametros necesarios
      url = buildUrl(url, orderBy, name, $scope) + '&'+buildHash($rootScope);

      //Consume servicio de marvel para obtener los personajes
      $http({
         method: 'GET',
         headers: $rootScope.headers,
         url: url
      }).then(function (data, status, success){ //servicio consumido satisfactoriamente
          console.log('Paso! ');

          //actualiza modelo de datos con los resultados encontrados
          $scope.model.characters = data.data.data.results;
          var charactersTotal = data.data.data.total;

          //Evalua si se encontraron resultados
          if (data.data.data.total==0){
            $scope.notFound=true;
            $scope.search={'param':'nameStartsWith'};
            $scope.pagination=[];
          }
          //Si se encontraron resultados entonces crea una paginacion y reorganiza la lista de comics
          if (!$scope.notFound){
            //Me aseguro que cree el arreglo la 1ra vez y las siguientes veces evalua si hay cambio en la cantidad de
            if ($scope.pagination==undefined || $scope.pagination.length!=charactersTotal)
              $scope.pagination=Array.from(new Array(Math.ceil(charactersTotal/$rootScope.limit)),(val,index)=>index+1);

            //Reorganiza de forma aleatoria la lista de comics asociados al personaje
            for(var i = 0; i<$scope.model.characters.length; ++i){
              $scope.model.characters[i].comics.items=$filter('azar')($scope.model.characters[i].comics.items);
            }
          }
      },function (data, status, error){ //Error en consumo de servicio
          console.log("Error consumiendo el servicio");
      });
    };

    //Set pagina inicial
    if ($scope.pagination!=undefined)
      $scope.currentPage=$scope.pagination[0];
    $scope.pageOffset=0;

    //Carga la informacion del comic seleccionado por el usuario
    this.loadComic = function(comicPath){
      initComicDescription($scope);

      //Construye la url para consumir servicio de api marvel
      var url = $rootScope.url + 'comics/'+comicPath.split('/').slice(-1)[0];
      url += '?'+buildHash($rootScope);

      //consume el servicio de marvel
      $http({
         method: 'GET',
         headers: $rootScope.headers,
         url: url
      }).then(function (data, status, success){ //servicio consumido satisfactoriamente
          console.log('Paso! ');
          //Guarda los datos del comic en el scope
          $scope.comicDescription.title = data.data.data.results[0].title;
          $scope.comicDescription.id = data.data.data.results[0].id;
          $scope.comicDescription.description = data.data.data.results[0].description;
          $scope.comicDescription.image = data.data.data.results[0].thumbnail.path+'.'+data.data.data.results[0].thumbnail.extension;

          //Busca el link de compra del comic
          for (var j=0; j<data.data.data.results[0].urls.length; ++j){
            if (data.data.data.results[0].urls[j].type=="purchase"){
              $scope.comicDescription.carLink=data.data.data.results[0].urls[j].url;
              break;
            }
          }
          //Busca el precio del comic digital
          for (var j=0; j<data.data.data.results[0].prices.length; ++j){
            if (data.data.data.results[0].prices[j].type=="digitalPurchasePrice"){
              $scope.comicDescription.price=data.data.data.results[0].prices[j].price;
              break;
            }
          }

          //Evalua si el comic cargado esta en la lista de comic favoritos y actualiza la clase css correspodiente
          if ($scope.isComicAddedFav($scope.comicDescription)!=-1){
            $scope.classFav="added-fav";
            $scope.ed = "ed";
          }

      },function (data, status, error){ //Error en consumo de servicio
          console.log("Error consumiendo el servicio");
      });
    };


    //Agregar comic a lista de favoritos en localStorage
    this.addComic = function(comic){
      //Evalua Si hay menos de 3 comics y el comic no esta en la lista de favoritos
      if ($scope.comicsFavs.length<3 && $scope.isComicAddedFav(comic)==-1){
          $scope.comicsFavs.push(comic);
          $scope.classFav="added-fav";
          $scope.ed = "ed";

          //persistencia en localStorage
          if (typeof(Storage) !== "undefined") {
            localStorage.setItem("comicsFavoritos", JSON.stringify($scope.comicsFavs));
          } else {
            console.log("This browser doesn't support localStorage");
          }
      }else if ($scope.comicsFavs.length==3){ //en caso contrario muestra un mensaje de alerta al usuario
        $scope.alert='<div class="alert alert-info" role="alert">Your favourite list is full!.<br/> For add an additional comic please remove one first.</div>';
        console.log('localStorage full');
      }
    }

    //Evalua si el comic ya esta presente en la lista de favoritos
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

    // Delete comic from localStorage
    this.deleteComic = function(comic){
      $scope.comicsFavs.splice($scope.comicsFavs.indexOf(comic),1);
      //Set el nuevo contenido de la lista de favoritos en el localStorage
      if (typeof(Storage) !== "undefined") {
        localStorage.setItem("comicsFavoritos", JSON.stringify($scope.comicsFavs));
      } else {
        console.log("This browser doesn't support localStorage");
      }
    };

    // Pagination
    //Set pagina actual
    $scope.select= function(item) {
        $scope.currentPage = item;
    };
    //Evalua si la pagina actual esta activa
    $scope.isActive = function(item) {
        return $scope.currentPage === item;
    };
    //Agrega una pagina adicional al hacer click en la flecha derecha
    this.addOnePage=function(){
      ($scope.pageOffset+1<$scope.pagination.length) ? $scope.pageOffset+=1 : $scope.pageOffset;
    };
    //Resta una pagina al hacer click en la flecha izquierda
    this.removeOnePage=function(){
     ($scope.pageOffset-1>=0) ? $scope.pageOffset-=1 : $scope.pageOffset=0;
    };

    //Ver mas informacion del personaje
    this.characterInfo=function(character){
      $scope.characterInfo=character;
    }
	}]);
})();
