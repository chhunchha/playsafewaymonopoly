


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
		boardsRef.on("value", function(snapshot){
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
		$http.get("http://www.geonames.org/childrenJSON?geonameId=6252001&style=short")
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
		$http.get("http://www.geonames.org/childrenJSON?geonameId=" + geonameId + "&style=short")
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
		$http.get("http://www.geonames.org/childrenJSON?geonameId=" + geonameId + "&style=short")
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

	$scope.usersWithExtraTickets = {results: {'Select Ticket' : []}};
	var getUsersInTheCityWithThisExtraTicket = function(cityGeoNameId, ticketCode) {
		var thisCityUsersRef = new Firebase(appURL + "/city_users/" + cityGeoNameId);
		var cityUsers = $firebaseArray(thisCityUsersRef);

		cityUsers.$loaded(
			function(x) {
				$scope.usersWithExtraTickets.results[ticketCode] = [];
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
											if(ticket.code === ticketCode && ticket.extra > 0 ) {
												$scope.usersWithExtraTickets.results[ticketCode].push(cityUser.user);
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

	$scope.selectedTicketCode = "Select Ticket";
	$scope.selectTicketCode = function(key) {
		$scope.selectedTicketCode = key;
	}

	$scope.selectSearchInCity = function(name, geonameId) {
		$scope.searchInCity = {name: name, geonameId: geonameId};
	}
	$scope.searchForMissingTickets = function() {
		$scope.searchInCity = $scope.user.city;
		$scope.getCities($scope.user.county.name, $scope.user.county.geonameId);
		getMyMissingTickets();
	}
};

var app = angular.module("playsafewaymonopoly", ["firebase","ngRoute"]);

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
