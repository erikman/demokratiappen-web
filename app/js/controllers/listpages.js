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

  democracyControllers.controller('ListPagesController', ['$scope', 'LoginService', function($scope, LoginService) {
    $scope.loginService = LoginService;

    function queryPage() {
      if (LoginService.stateLoggedIn !== LoginService.LOGGED_IN) {
        return;
      }

      var currentUser = Parse.User.current();

      var query = new Parse.Query('Page');
      query.equalTo('user', currentUser);
      query.include(['positive_tags']);
      query.include(['negative_tags']);
      query.include(['topic']);
      query.limit(20);

      query.find().then(function(articles) {
        $scope.articles = _.map(articles, function(article) {
          var a = {
            title: article.get('title'),
            url: article.get('url'),
            topic: article.get('topic'),
            tags: [ ]
          };

          a.tags = a.tags.concat(_.map(article.get('positive_tags'),
            function(tag) {
              var tagName = 'unknown';
              if (tag) {
                tagName = tag.get('name');
              }
              return {name: tagName, type: 'success' };
            }));
          a.tags = a.tags.concat(_.map(article.get('negative_tags'),
            function(tag) {
              var tagName = 'unknown';
              if (tag) {
                tagName = tag.get('name');
              }
              return {name: tagName, type: 'danger' };
            }));

          return a;
        });

        $scope.$apply();
      });
    }

    $scope.$watch(function() {
      return LoginService.stateLoggedIn;
    }, queryPage);
  }]);
}());
