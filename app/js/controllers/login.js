/* Copyright (C) 2014 Demokratiappen.
 *
 * This file is part of Demokratiappen.
 *
 * Demokratiappen is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Demokratiappen is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Demokratiappen.  If not, see <http://www.gnu.org/licenses/>.
 */
(function() {
  'use strict';

  var democracyControllers = angular.module('democracy.controller');

  democracyControllers.controller('LoginController', ['$scope', '$location',
     'LoginService', 'ParseErrorService', function($scope, $location, LoginService, ParseErrorService) {
    $scope.loginService = LoginService;

    // The state decides if we shoould show the login or the signup fields. We can
    // show the login view on multiple sub-pages, but only show signup on the
    // dedlicated signup page.
    var states = {
      LOGIN: 0,
      SIGNUP: 1,
      currentState: 0
    };
    $scope.state = states;
    $scope.state.currentState = ($location.path() === '/signup') ? states.SIGNUP : states.LOGIN;

    $scope.errorMessage = '';

    // When the stateLoggedIn changes we check if we are on one of the dedlicated
    // login pages and if we are then we redirect to the statistics page on a
    // successful login.
    $scope.$watch(function() {
      return LoginService.stateLoggedIn;
    }, function() {
      if (LoginService.stateLoggedIn === LoginService.LOGGED_IN) {
        if (($location.path() === '/login') || ($location.path() === '/signup')) {
          $location.path('/dashboard');
        }
      }
    });

    $scope.login = function() {
      LoginService.login().fail(function (error) {
        $scope.$apply(function() {
          $scope.errorMessage = ParseErrorService.translateLoginError(error);
        });
      });
    };

    $scope.signup = function() {
      LoginService.signup().fail(function (error) {
        $scope.$apply(function() {
          $scope.errorMessage = ParseErrorService.translateLoginError(error);
        });
      });
    };

    $scope.loginOrSignupFacebook = function() {
      LoginService.loginOrSignupFacebook().fail(function (error) {
        $scope.$apply(function() {
          $scope.errorMessage = ParseErrorService.translateLoginError(error);
        });
      });
    };

    $scope.loginAsGuest = function() {
      LoginService.username = 'Sandra';
      LoginService.password = 'guest';
      LoginService.login().fail(function (error) {
        $scope.$apply(function() {
          $scope.errorMessage = ParseErrorService.translateLoginError(error);
        });
      });
    };

    $scope.isUnchanged = function() {
      return LoginService.username === '' && LoginService.password === '';
    };
  }]);
}());
