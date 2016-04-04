


var appURL = "https://playsafewaymonopoly.firebaseio.com";
var ref = new Firebase(appURL);
var userRef = new Firebase(appURL + "/users");
var boardsRef = new Firebase(appURL + "/boards");
var defaultBoardRef = new Firebase(appURL + "/default_board")

PlayCntrl.$inject = ['$scope', 'Auth', '$location', '$firebaseObject'];
function PlayCntrl($scope, Auth, $location, $firebaseObject){
	$scope.provider = '';
	$scope.authData;
	$scope.userBoard;
	$scope.nav  = { tabIndex : 1 };
	$scope.user;

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
