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

  democracyControllers.controller('AccumulatedTagsController', ['$scope',
      'LoginService', function($scope, LoginService) {

    function queryPage() {
      if (LoginService.stateLoggedIn !== LoginService.LOGGED_IN) {
        return;
      }

      var currentUser = Parse.User.current();
      var userTagQuery = new Parse.Query('UserTag');
      userTagQuery.equalTo('user', currentUser);

      userTagQuery.find().then(function(userTags) {
        var result = [];
        for (var i = 0; i < userTags.length; i++) {
          var resultTag = {
            id: userTags[i].id,
            name: userTags[i].get('name'),
            score: userTags[i].get('negativeCount') + userTags[i].get('positiveCount')
          };
          result[result.length] = resultTag;
        }

        result.sort(function(a, b) { return b.score - a.score; });

        // Format the data as csv
        var csvResult = 'id; name; score\n';
        for (var resultId = 0; resultId < result.length; resultId++) {
          csvResult += result[resultId].id + ';' + result[resultId].name + ';' +
            result[resultId].score + '\n';
        }

        $scope.tags = csvResult;
        $scope.$apply();
      }, function (error) {
        console.log(error);
      });
    }

    $scope.$watch(function() {
      return LoginService.stateLoggedIn;
    }, queryPage);
  }]);
}());
