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

	app.controller('mainController', ['$scope', '$http', '$rootScope','$filter', "$window", '$q',  function($scope, $http, $rootScope, $filter, $window, $q){

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
      getCharacters($rootScope, $scope, $http, url, $filter);
    };

    //Set pagina inicial
    if ($scope.pagination!=undefined)
      $scope.currentPage=$scope.pagination[0];
      $scope.pageOffset=0;

    //Carga la informacion del comic seleccionado por el usuario
      $scope.loadComic = function(comicPath, type){
      initComicDescription($scope);

      //Construye la url para consumir servicio de api marvel
      var url = $rootScope.url + 'comics/'+comicPath.split('/').slice(-1)[0];
      url += '?'+buildHash($rootScope);

      //consume el servicio de marvel
      getComic($rootScope, $scope, $http, url, type);

    };


    //Agregar comic a lista de favoritos en localStorage
    $scope.addComic = function(comic){
      //Evalua Si el comic no esta en la lista de favoritos
      if ($scope.isComicAddedFav(comic)==-1){
          $scope.comicsFavs.push(comic);
          $scope.classFav="added-fav";
          $scope.ed = "ed";

          //persistencia en localStorage
          if (typeof(Storage) !== "undefined") {
            localStorage.setItem("comicsFavoritos", JSON.stringify($scope.comicsFavs));
          } else {
            console.log("This browser doesn't support localStorage");
          }
      }
    }

    //Evalua si el comic ya esta presente en la lista de favoritos
    $scope.addThreeComicsRandom= function(){

      for (var i = 0; i<$scope.comics.length; ++i){
        if($scope.isComicAddedFav({'id':$scope.comics[i].resourceURI.split('/').slice(-1)[0]})!=-1){
            $scope.comics.splice(i,1);
        }
      }

      for (var i=0; i<$scope.comics.length && i<3; ++i){
        var comicIndex = createRandom();
        var comicId = $scope.comics[comicIndex].resourceURI.split('/').slice(-1)[0];

        //Mientras el comic este en favoritos genera otro random
        while(($scope.isComicAddedFav({'id':comicId})!=-1)){
          comicIndex = createRandom();
          comicId = $scope.comics[comicIndex].resourceURI.split('/').slice(-1)[0];
          if($scope.isComicAddedFav({'id':comicId})!=-1){
              $scope.comics.splice(comicIndex,1);
          }

        }

        $scope.loadComic($scope.comics[comicIndex].resourceURI, 1);
      }
    }


    function createRandom() {
      return Math.floor((Math.random() * $scope.comics.length));
    }

    $scope.charactersHasComics= function(){
      $scope.charactersWithComics = [];
      for (var j=0 ; j< $scope.model.characters.length; ++j){
        if ($scope.model.characters[j].comics.items.length>0){
          $scope.charactersWithComics.push(j);
        }
      }
      // console.log("Personajes con comics"+angular.toJson($scope.charactersWithComics));
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
    $scope.comicDescription.uri='';
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

  //Obtener personajes consumiendo servicio rest
  function getCharacters($rootScope, $scope, $http, url, $filter){
    $http({
       method: 'GET',
       headers: $rootScope.headers,
       url: url
    }).then(function (data, status, success){ //servicio consumido satisfactoriamente
        console.log('Paso! ');
        $scope.charactersTotal = 0;

        //actualiza modelo de datos con los resultados encontrados
        $scope.model.characters = data.data.data.results;
        var charactersTotal = data.data.data.total;
        // console.log($scope.model.characters.length);

        $scope.charactersHasComics();
        $scope.comics = [];

        for (var k=0; k<$scope.charactersWithComics.length; ++k){
          $scope.comics = $scope.comics.concat($scope.model.characters[$scope.charactersWithComics[k]].comics.items);
        }

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

        }
    },function (data, status, error){ //Error en consumo de servicio
        console.log("Error consumiendo el servicio");
    });
  }

  //Obtener comic consumiendo servicio rest
  function getComic($rootScope, $scope, $http, url, type){
    $http({
       method: 'GET',
       headers: $rootScope.headers,
       url: url
    }).then(function (data, status, success){ //servicio consumido satisfactoriamente
        console.log('Paso! ');
        initComicDescription($scope);
        //Guarda los datos del comic en el scope
        $scope.comicDescription.title = data.data.data.results[0].title;
        $scope.comicDescription.id = data.data.data.results[0].id;
        $scope.comicDescription.description = data.data.data.results[0].description;
        $scope.comicDescription.image = data.data.data.results[0].thumbnail.path+'.'+data.data.data.results[0].thumbnail.extension;
        $scope.comicDescription.uri = data.data.data.results[0].resourceURI;

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

        if (type===1){
          $scope.addComic($scope.comicDescription);
          if($scope.isComicAddedFav($scope.comicDescription)!=-1){
              $scope.comics.splice($scope.comics.indexOf($scope.comicDescription),1);
          }
        }

    },function (data, status, error){ //Error en consumo de servicio
        console.log("Error consumiendo el servicio");
    });
  }
})();
