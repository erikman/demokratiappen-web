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

  democracyControllers.controller('ListTagsController', ['$scope', 'LoginService', function($scope, LoginService) {
    $scope.loginService = LoginService;
    $scope.tags = [];
    $scope.tagCount = 0;

    function queryPage() {
      if (LoginService.stateLoggedIn !== LoginService.LOGGED_IN) {
        return;
      }

      var UserTag = Parse.Object.extend('UserTag');

      var currentUser = Parse.User.current();
      var query = new Parse.Query(UserTag);
      query.equalTo('user', currentUser);

      query.find({
        success: function(tags) {
          var tagCount = 0;
          for (var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            $scope.tags[i] = {
              name: tag.get('name'),
              positiveCount: tag.get('positiveCount'),
              negativeCount: tag.get('negativeCount')
            };
            tagCount += $scope.tags[i].positiveCount +
              $scope.tags[i].negativeCount;
          }
          $scope.tagCount = tagCount;
          $scope.$apply();
        }
      });
    }

    $scope.$watch(function() {
      return LoginService.stateLoggedIn;
    }, queryPage);
  }]);
}());
