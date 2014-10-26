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

  democracyControllers.controller('TagsPerDateController', ['$scope', 'LoginService', function($scope, LoginService) {

    function queryPage() {
      if (LoginService.stateLoggedIn !== LoginService.LOGGED_IN) {
        return;
      }

      var currentUser = Parse.User.current();
      var pageQuery = new Parse.Query('Page');
      pageQuery.equalTo('user', currentUser);
      pageQuery.include('positive_tags');
      pageQuery.include('negative_tags');

      pageQuery.descending('createdAt');

      pageQuery.find().then(function(pages) {
        var result = [];
        for (var i = 0; i < pages.length; i++) {
          var j;
          var positiveTags = pages[i].get('positive_tags');
          if (positiveTags) {
            for (j = 0; j < positiveTags.length; j++) {
              var positiveTag = positiveTags[j];
              if (positiveTag) {
                var positiveResultTag = {
                  id: positiveTag.id,
                  date: pages[i].createdAt,
                  name: positiveTag.get('name'),
                  score: 1
                };
                result[result.length] = positiveResultTag;
              }
            }
          }

          var negativeTags = pages[i].get('negative_tags');
          if (negativeTags) {
            for (j = 0; j < negativeTags.length; j++) {
              var negativeTag = negativeTags[j];
              if (negativeTag) {
                var negativeResultTag = {
                  id: negativeTag.id,
                  date: pages[i].createdAt,
                  name: negativeTag.get('name'),
                  score: -1
                };
                result[result.length] = negativeResultTag;
              }
            }
          }
        }

        // Format the data as csv
        var csvResult = 'id; date; name; score\n';
        for (var resultId = 0; resultId < result.length; resultId++) {
          csvResult += result[resultId].id + ';' + result[resultId].date + ';' +
            result[resultId].name + ';' + result[resultId].score + '\n';
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
