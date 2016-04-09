


var appURL = "https://playsafewaymonopoly.firebaseio.com";
var ref = new Firebase(appURL);
var userRef = new Firebase(appURL + "/users");
var boardsRef = new Firebase(appURL + "/boards");
var defaultBoardRef = new Firebase(appURL + "/default_board")
var cityUsers = new Firebase(appURL + "/city_users");

PlayCntrl.$inject = ['$scope', 'Auth', '$location', '$firebaseObject', '$http', '$firebaseArray'];
function PlayCntrl($scope, Auth, $location, $firebaseObject, $http, $firebaseArray){
	$scope.provider = '';
	$scope.authData;
	$scope.userBoard;
	$scope.nav  = { tabIndex : 1 };
	$scope.user = {};

	Auth.$onAuth(function(authData){
		$scope.authData = authData;
		if(authData) {
			$scope.cachedProfile = getCachedProfile();
			createUser();
			$scope.creteBoardForUser();
			getUserBoardData();
			//$location.path("/authenticated");
		}
		console.log($scope.authData);
	});

	$scope.login = function(provider) {
		Auth.$authWithOAuthPopup(provider,  { scope: 'email' })
		.catch(function(error){
			console.error(error);
		})
	}

	$scope.logout = function() {
		Auth.$unauth();
	}

	var createUser = function() {
		userRef.child($scope.authData.uid).once('value', function(snapshot) {
			var exists = (snapshot.val() !== null);
			if (!exists) {
				ref.child("users").child($scope.authData.uid).set({
					provider: $scope.authData.provider,
					name: getCachedProfile().name,
					email: getCachedProfile().email
				});
				$scope.user = $firebaseObject(userRef.child($scope.authData.uid));
			}
			else {
				console.log("User already exists");
				$scope.user = $firebaseObject(userRef.child($scope.authData.uid));
			}
		});
	}

	var getCachedProfile = function() {
		if(!$scope.authData) return "";
		switch($scope.authData.provider) {
			case "google":
				return $scope.authData.google.cachedUserProfile;
			break;
			default:
			return "";
		}
	}

	$scope.getUserImage = function() {
		if(!$scope.authData) return "";
		switch($scope.authData.provider) {
			case "google":
				return $scope.authData.google.profileImageURL ? $scope.authData.google.profileImageURL : "";
			break;
			default:
			return "";
		}
	}

	// $scope.getDefaultBoard = function() {
	// 	if($scope.authData) {
	// 		defaultBoardRef.on("value", function(snapshot){
	// 			console.log(snapshot.val());
	// 		}, function(errorObject) {
	// 			console.log("The read failed for default board");
	// 		})
	// 	}
	// }

	$scope.creteBoardForUser = function() {
		boardsRef.child($scope.authData.uid).on("value", function(snapshot){
			if(snapshot.val() !== null) {
				console.log("board exists for user");
			} else {
				defaultBoardRef.on("value", function(snapshot){
					var data = snapshot.val();
					boardsRef.child($scope.authData.uid).set({
						data
					});
				}, function(errorObject) {
					console.log("failed to read default board");
				})
			}
		}, function(errorObject) {
			console.log("failed to read board for user");
		});
	}

	var getUserBoardData = function() {
		$scope.userBoard = $firebaseObject(boardsRef.child($scope.authData.uid));
	}

	$scope.states;
	var getStates = function() {
		$http.get("www.geonames.org/childrenJSON?geonameId=6252001&style=short")
		.then(function(response) {
			$scope.states = response.data.geonames;
			console.log($scope.states);
		}, function(error) {
			console.log(error);
		});
	}

	$scope.conties;
	$scope.getCounties = function(stateName, geonameId) {
		$scope.state = {name: stateName, geonameId: geonameId};
		$scope.county = {name: "Select County"};
		$http.get("www.geonames.org/childrenJSON?geonameId=" + geonameId + "&style=short")
		.then(function(response) {
			$scope.counties = response.data.geonames;
		}, function(error) {
			console.log(error);
		});
	}

	$scope.cities;
	$scope.getCities = function(countyName, geonameId) {
		$scope.county = {name: countyName, geonameId: geonameId};
		$scope.city = {name: "Select City"};
		$http.get("www.geonames.org/childrenJSON?geonameId=" + geonameId + "&style=short")
		.then(function(response) {
			$scope.cities = response.data.geonames;
		}, function(error) {
			console.log(error);
		});
	}

	$scope.selectCity = function(cityName, geonameId) {
		$scope.city = {name: cityName, geonameId: geonameId};
	}


	var addUserToCity = function(user) {
		var thiCityUsers = new Firebase(appURL + "/city_users/" + user.city.geonameId);
		var thisCityUserRef = thiCityUsers.push();
		thisCityUserRef.set({user: $scope.authData.uid});
	}

	var removeUserFromOldCity = function(userWithOldCity) {
		if(userWithOldCity.city != undefined) {
			var oldCity = userWithOldCity.city.geonameId;
			var thiCityUsersRef = new Firebase(appURL + "/city_users/" + oldCity);
			var oldCityUsers = $firebaseArray(thiCityUsersRef);

			oldCityUsers.$loaded(
				function(x) {
					for(i in oldCityUsers) {
						if(oldCityUsers[i].user === $scope.authData.uid) {
							oldCityUsers.$remove(oldCityUsers[i]);
						}
					}
	  			}, function(error) {
	    			console.error("Error in removing user from old city list:", error);
	  			}
			);
		}
	}

	$scope.saveProfile = function() {

		removeUserFromOldCity($scope.user);

		$scope.user.state = $scope.state;
		$scope.user.county = $scope.county;
		$scope.user.city = $scope.city;
		$scope.user.$save();

		addUserToCity($scope.user);
	}

	$scope.state = {name: "Select State"};
	$scope.county = {name: "Select County"};
	$scope.city = {name: "Select City"};
	getStates();

	// get my tickets with status false
	// look for users in my city
	// look for tickets with extra > 0 in users found above

	$scope.missingTickets = [];
	var getMyMissingTickets = function() {
		$scope.missingTickets = [];
		for(i in $scope.userBoard.data)
		{
			var prize = $scope.userBoard.data[i];
			for(t in prize.tickets)
			{
				var ticket = prize.tickets[t];
				if(ticket.status == false) {
					$scope.missingTickets.push(ticket);
					getUsersInTheCityWithThisExtraTicket($scope.user.city.geonameId, ticket.code)
				}
			}
		}
		console.log($scope.missingTickets);
	}

	$scope.usersWithExtraTickets = {results: []};
	var getUsersInTheCityWithThisExtraTicket = function(cityGeoNameId, ticketCode) {
		var thisCityUsersRef = new Firebase(appURL + "/city_users/" + cityGeoNameId);
		var cityUsers = $firebaseArray(thisCityUsersRef);

		cityUsers.$loaded(
			function(x) {
				if(cityUsers.length != 0)
				{
					angular.forEach( cityUsers, function(cityUser){
						var cityUserBoard = $firebaseObject(boardsRef.child(cityUser.user));
						cityUserBoard.$loaded(
							function(x){
								if(cityUser.user !== $scope.user.$id) {
									for(k in cityUserBoard.data)
									{
										var prize = cityUserBoard.data[k];
										for(t in prize.tickets)
										{
											var ticket = prize.tickets[t];
											// console.log(ticket.code , ticketCode);

											if(ticket.code === ticketCode && ticket.extra > 0 ) {
												$scope.usersWithExtraTickets.results.push({ticket: ticketCode, user: $firebaseObject(userRef.child(cityUser.user))});
											}
										}
									}
								}
								console.log($scope.usersWithExtraTickets.results);
							}
						)
					}, $scope);
				}
  			}, function(error) {
    			console.error("Error in getUsersInTheCityWithThisExtraTicket", error);
  			}
		);
	}

	var getUsersInTheCityWithExtraTickets = function() {
		$scope.usersWithExtraTickets = {results: []};
		angular.forEach($scope.missingTickets, function(ticket){
			getUsersInTheCityWithThisExtraTicket($scope.searchInCity.geonameId, ticket.code)
		})
	}

	$scope.selectedTicketCode = "Select Ticket";
	$scope.selectTicketCode = function(key) {
		$scope.selectedTicketCode = key;
	}

	$scope.selectSearchInCity = function(name, geonameId) {
		$scope.searchInCity = {name: name, geonameId: geonameId};
		getUsersInTheCityWithExtraTickets();
	}

	$scope.searchForMissingTickets = function() {
		$scope.searchInCity = $scope.user.city;
		$scope.getCities($scope.user.county.name, $scope.user.county.geonameId);
		$scope.usersWithExtraTickets = {results: []};
		getMyMissingTickets();
	}

	$scope.searchText = "";


	var infoTemplate = "<h3>Lets play together and beat the system!!</h3>\
	<p>\
		I am also trying to win something from this Safeway monopoly game. Haven't won anything yet.\
		Many people must be getting same tickets again and again like me, and somebody might not be getting that ticket at all.\
		May be somebody need what I have and somebody might have one extra which I need. So below is the idea.\
	</p>\
	<h3>How this should work</h3>\
	<ul>\
		<li>\
			Manage your board by marking tickets which you have.\
		</li>\
		<li>\
			Use + and - icon to keep count of repeating ticket. ( I hope you have kept those repeating tickets.)\
		</li>\
		<li>\
			Will search for people who has extra tickets which you don't have in your city.\
		</li>\
		<li>\
			Contact them and make arrangement for getting ticket. What will be the arrangement? - that is upto you.\
		</li>\
		<li>\
			<strong>By Log in to this website you are aggreeing to share your information to others. Your Name, Email Id, City, Board  and ticket details etc will and may be available to other users.</strong>\
			That is what we are here for. To share and collabrate. isn't it?\
		</li>\
		<li>\
			<strong>Copyright © 2016 Sumant Chhunchha. All rights reserved.</strong>\
		</li>\
		<li>\
			For Help and issues please email me at <strong><a href=\"mailto:playsafewaymonopolytogether@gmail.com?Subject=\" target=\"_top\">playsafewaymonopolytogether@gmail.com</a></strong>\
		</li>\
	</ul>";

	$("#help-model-body").append(infoTemplate);
	$("#info-help-body").append(infoTemplate);
};

var app = angular.module("playsafewaymonopoly", ["firebase","ngRoute","customFilter","angular-toArrayFilter"]);

app.config(['$routeProvider', '$locationProvider',function($routeProvider, $locationProvider){
	$routeProvider
	.when('/',{
		controller: "AuthCtrl",
		templateUrl: "/index.html"
	}).
	otherwise({
		redirectTo: '/'
	});
}]);

app.factory("Auth", function($firebaseAuth){
	return $firebaseAuth(ref);
});

app.controller('playCntrl', PlayCntrl);

angular.module('customFilter',[])
.filter('custom', function() {
  return function(input, search) {
    if (!input) return input;
    if (!search) return input;
    var expected = ('' + search).toLowerCase();
    var result = {};
    angular.forEach(input, function(value, key) {
      var actual = ('' + value).toLowerCase();
      if (actual.indexOf(expected) !== -1) {
        result[key] = value;
      }
    });
    return result;
  }
});

angular.module('angular-toArrayFilter', [])
.filter('toArray', function () {
  return function (obj, addKey) {
    if (!angular.isObject(obj)) return obj;
    if ( addKey === false ) {
      return Object.keys(obj).map(function(key) {
        return obj[key];
      });
    } else {
      return Object.keys(obj).map(function (key) {
        var value = obj[key];
        return angular.isObject(value) ?
          Object.defineProperty(value, '$key', { enumerable: false, value: key}) :
          { $key: key, $value: value };
      });
    }
  };
});
