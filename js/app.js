


var appURL = "https://playsafewaymonopoly.firebaseio.com";
var ref = new Firebase(appURL);
var userRef = new Firebase(appURL + "/users");
var boardsRef = new Firebase(appURL + "/boards");
var defaultBoardRef = new Firebase(appURL + "/default_board")
var cityUsers = new Firebase(appURL + "/city_users");

var rare_tickets = "$618H,?625G,A502C,B506B,C513D,D515A,E524D,F528C,Z608B,Y603A,X602D,W597C,V592B,U590D,T585C,S579A,R575A,Q573C,P568B,O565C,N562D,M556B,L551A,K549C,G531A,H538D,I541C,J544B,$613C,?622D,A504E,B505A,C514E,D517C,E525E,F527B";
PlayCntrl.$inject = ['$scope', 'Auth', '$location', '$firebaseObject', '$http', '$firebaseArray', '$q'];
function PlayCntrl($scope, Auth, $location, $firebaseObject, $http, $firebaseArray, $q){
	$scope.provider = '';
	$scope.authData;
	$scope.userBoard;
	$scope.nav  = { tabIndex : 1 };
	$scope.user = {};
	var debug = false;

	$scope.cityOptions = options = {
		types: '(cities)',
		country: 'us'
	}

	Auth.$onAuth(function(authData){
		$scope.authData = authData;
		if(authData) {
			$scope.cachedProfile = getCachedProfile();
			createUser();
			$scope.creteBoardForUser();
			getUserBoardData();
			//$location.path("/authenticated");
		}
		log($scope.authData);
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

	var log = function(msg) {
		if(debug) console.log(msg);
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
				log("User already exists");
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

	$scope.creteBoardForUser = function() {
		boardsRef.child($scope.authData.uid).on("value", function(snapshot){
			if(snapshot.val() !== null) {
				log("board exists for user");
			} else {
				defaultBoardRef.on("value", function(snapshot){
					var data = snapshot.val();
					boardsRef.child($scope.authData.uid).set({
						data
					});
				}, function(errorObject) {
					log("failed to read default board");
				})
			}
		}, function(errorObject) {
			log("failed to read board for user");
		});
	}

	var getUserBoardData = function() {
		$scope.userBoard = $firebaseObject(boardsRef.child($scope.authData.uid));
	}

	var addUserToCity = function(user) {
		var thiCityUsers = new Firebase(appURL + "/city_users/" + user.city);
		var thisCityUserRef = thiCityUsers.push();
		thisCityUserRef.set({user: $scope.authData.uid});
	}

	var removeUserFromOldCity = function(userWithOldCity) {
		if(userWithOldCity.city != undefined) {
			var oldCity = userWithOldCity.city;
			var thiCityUsersRef = new Firebase(appURL + "/city_users/" + oldCity);
			var oldCityUsers = $firebaseArray(thiCityUsersRef);

			oldCityUsers.$loaded(
				function(x) {
					for(var i in oldCityUsers) {
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

	var sendEmail = function(ticket) {


// curl -s --user 'api:key-126248d42ef9442a93b9704cc128e3d3' 'https://api.mailgun.net/v3/sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org/messages' -F from='postmaster@sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org' -F to='mr.chhunchha@gmail.com' -F subject='Hello' -F text='Testing some Mailgun awesomness!'
//
// curl -s
// --user 'api:key-126248d42ef9442a93b9704cc128e3d3'
// 'https://api.mailgun.net/v3/sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org/messages'
// -F from='postmaster@sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org'
// -F to='mr.chhunchha@gmail.com'
// -F subject='Hello'
// -F text='Testing some Mailgun awesomness!'

// curl -s 'https://api:key-126248d42ef9442a93b9704cc128e3d3@api.mailgun.net/v3/sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org/messages' -F from='postmaster@sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org' -F to='mr.chhunchha@gmail.com' -F subject='Hello' -F text='Testing some Mailgun awesomness!'

		var url = "https://api.mailgun.net/v3/sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org/messages";
		var dataJSON = {
			to: "mr.chhunchha@gmail.com",
			subject: "Alert: " + ticket.code + " found",
			text: "Alert: " + ticket.code + " found",
			from: "Play safeway monopoly <postmaster@sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org>"
		}

		var req = {
			method : 'POST',
			url: url,
			headers : {
				'Authorization' : 'Basic api:key-126248d42ef9442a93b9704cc128e3d3'
			},
			data: dataJSON
		}
		$http(req).then(function(data){
			console.log(data);
		}, function(data){
			console.log(data);
		})
	}


	//
	//
	// $http({
	//    method: method,
	//    url: url +
	// 	   "to=" + "mr.chhunchha@gmail.com" +
	// 	   "&subject=" + "Alert: " + ticket.code + " found" +
	// 	   "&text=" + "Alert: " + ticket.code + " found" +
	// 	   "&from=" + "postmaster@sandbox8fdcaab93be5418c82af52d73590aa18.mailgun.org"
	// }).
	// var sendEmail = function(ticket) {
	// 	var mailJSON ={
	// 		"key": "8wLNsT_uBLlbeVlwwaeTyQ",
	// 		"message": {
	// 			"html": "Alert: " + ticket.code + " found",
	// 			"text": "Alert: " + ticket.code + " found",
	// 			"subject": "Alert: " + ticket.code + " found",
	// 			"from_email": "playsafewaymonopolytogether@gmail.com",
	// 			"from_name": "Play safeway monopoly together",
	// 			"to": [
	// 				{
	// 					"email": "mr.chhunchha@gmail.com",
	// 					"name": "Play Safeway monopoly together",
	// 					"type": "to"
	// 				}
	// 			],
	// 			"important": false,
	// 			"track_opens": null,
	// 			"track_clicks": null,
	// 			"auto_text": null,
	// 			"auto_html": null,
	// 			"inline_css": null,
	// 			"url_strip_qs": null,
	// 			"preserve_recipients": null,
	// 			"view_content_link": null,
	// 			"tracking_domain": null,
	// 			"signing_domain": null,
	// 			"return_path_domain": null
	// 		},
	// 		"async": false,
	// 		"ip_pool": "Main Pool"
	// 	};
	// 	var apiURL = "https://mandrillapp.com/api/1.0/messages/send.json";
	// 	$http.post(apiURL, mailJSON).
	// 	success(function(data, status, headers, config) {
	// 		//alert('successful email send.');
	// 		$scope.form={};
	// 		console.log('successful email send.');
	// 		console.log('status: ' + status);
	// 		console.log('data: ' + data);
	// 		console.log('headers: ' + headers);
	// 		console.log('config: ' + config);
	// 	}).error(function(data, status, headers, config) {
	// 		console.log('error sending email.');
	// 		console.log('status: ' + status);
	// 	});
	// }

	$scope.updateTicketStatus = function(ticket) {
		ticket.status = !ticket.status;
		if((ticket.status || ticket.extra > 0 ) && rare_tickets.indexOf(ticket.code) != -1 ) {
			sendEmail(ticket);
		}
		$scope.userBoard.$save();
	}

	$scope.saveProfile = function() {

		removeUserFromOldCity($scope.user);
		$scope.user.city = $scope.city;
		$scope.user.$save();

		addUserToCity($scope.user);
	}

	$scope.missingTickets = [];
	var getMyMissingTickets = function() {
		$scope.missingTickets = [];
		for(var i in $scope.userBoard.data)
		{
			var prize = $scope.userBoard.data[i];
			for(var t in prize.tickets)
			{
				var ticket = prize.tickets[t];
				if(ticket.status == false && ticket.extra <= 0) {
					$scope.missingTickets.push(ticket);
					getUsersInTheCityWithThisExtraTicket($scope.user.city, ticket.code)
				}
			}
		}
		log($scope.missingTickets);
	}

	$scope.usersWithExtraTickets = {results: []};
	var getUsersInTheCityWithThisExtraTicket = function(city, ticketCode) {
		var thisCityUsersRef = new Firebase(appURL + "/city_users/" + city);
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
									for(var k in cityUserBoard.data)
									{
										var prize = cityUserBoard.data[k];
										for(var t in prize.tickets)
										{
											var ticket = prize.tickets[t];
											// log(ticket.code , ticketCode);

											if(ticket.code === ticketCode && ticket.extra > 0 ) {
												$scope.usersWithExtraTickets.results.push({prize: prize, ticket: ticket, user: $firebaseObject(userRef.child(cityUser.user))});
											}
										}
									}
								}
								log($scope.usersWithExtraTickets.results);
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
			getUsersInTheCityWithThisExtraTicket($scope.searchInCity, ticket.code);
		});
	}

	var getUsersWithThisExtraTicket = function(ticketCode) {
		var boardsRef = new Firebase(appURL + "/boards/");
		var boards = $firebaseArray(boardsRef);

		boards.$loaded(
			function(x) {
				if(boards.length != 0)
				{
					angular.forEach( boards, function(userBoard){
						if(userBoard.$id !== $scope.user.$id) {
							for(var k in userBoard.data)
							{
								var prize = userBoard.data[k];
								for(var t in prize.tickets)
								{
									var ticket = prize.tickets[t];
									// log(ticket.code , ticketCode);

									if(ticket.code === ticketCode && (ticket.extra > 0 || ticket.status == true)) {
										$scope.usersWithExtraTickets.results.push({prize: prize, ticket: ticket, user: $firebaseObject(userRef.child(userBoard.$id))});
									}
								}
							}
						}
					}, $scope);
				}
			}, function(error) {
				console.error("Error in getUsersWithThisExtraTicket", error);
			}
		);
	}

	var getUsersWithExtraTickets = function() {
		$scope.usersWithExtraTickets = {results: []};
		angular.forEach($scope.missingTickets, function(ticket){
			getUsersWithThisExtraTicket(ticket.code);
		});
	}

	$scope.selectedTicketCode = "Select Ticket";
	$scope.selectTicketCode = function(key) {
		$scope.selectedTicketCode = key;
	}

	$scope.searchInAllUsers = function() {
		$scope.searchText = "";
		$scope.usersWithExtraTickets = {results: []};
		$scope.prizesCouldBeWon = [];
		getMyMissingTickets();
		getUsersWithExtraTickets();
	}

	$scope.selectSearchInCity = function(city) {
		if(city == undefined || city == "" || city == null)
			city = $scope.user.city;

		$scope.searchInCity = city;
		getUsersInTheCityWithExtraTickets();
	}

	$scope.searchForMissingTickets = function() {
		$scope.searchInCity = $scope.user.city;
		//$scope.getCities($scope.user.county.name, $scope.user.county.geonameId);
		$scope.usersWithExtraTickets = {results: []};
		getMyMissingTickets();
	}

	$scope.prizesCouldBeWon = [];

	$scope.whatPrizesCanBeWon = function() {
		$scope.prizesCouldBeWon = [];

		for(var j in $scope.userBoard.data)
		{
			var missingTicketsForThisPrize = [];
			var prize = $scope.userBoard.data[j];
			for(var t in prize.tickets)
			{
				var ticket = prize.tickets[t];
				var canWinPrize = false;
				if(ticket.status == false && ticket.extra <= 0) {
					missingTicketsForThisPrize.push(ticket);
				}
			}

			var foundAllMissing = true;
			for(var k in missingTicketsForThisPrize) {
				var foundMissing = false;
				for(var m in $scope.usersWithExtraTickets.results) {
					if(missingTicketsForThisPrize[k].code === $scope.usersWithExtraTickets.results[m].ticket.code) {
						foundMissing = true;
						break;
					}
				}
				if(foundMissing == false) {
					foundAllMissing = false;
					break;
				}
			}

			if(foundAllMissing) {
				$scope.prizesCouldBeWon.push(prize);
			}
			//console.log($scope.prizesCouldBeWon);
		}
	}

	$scope.searchText = "";

	var infoTemplate = "<h3>Lets play together and beat the system!!</h3>\
	<p>\
		I am also trying to win something from this Safeway monopoly game. Haven't won anything yet.\
		Many people must be getting same tickets again and again like me, and somebody might not be getting that ticket at all.\
		May be somebody need what I have and somebody might have one extra which I need. So below is the idea.\
	</p>\
	<h3>How this should work</h3>\
	<div class='ticket-gif'>\
		<img src='/images/ticket2.gif'></img>\
	</div>\
	<ul class='how-works'>\
		<li>\
			Manage your board by marking tickets which you have.\
		</li>\
		<li>\
			Use + and - icon to keep count of repeating ticket. ( I hope you have kept those repeating tickets.)\
		</li>\
		<li>\
			Will search for people who has  tickets which you don't have.\
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
			For Help and issues please email at <strong><a href=\"mailto:playsafewaymonopolytogether@gmail.com?Subject=\" target=\"_top\">playsafewaymonopolytogether@gmail.com</a></strong>\
		</li>\
	</ul>";

	$("#help-model-body").append(infoTemplate);
	$("#info-help-body").append(infoTemplate);
};

var app = angular.module("playsafewaymonopoly", ["firebase","ngRoute","customFilter","angular-toArrayFilter","ngAutocomplete"]);

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
