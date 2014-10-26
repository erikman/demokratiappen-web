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

  democracyControllers.controller('TopicController', ['$scope', 'LoginService', 'DataProjectionService', 'nvd3MultiBarHorizontalChartDirective', function($scope, LoginService, DataProjectionService) {
    $scope.loginService = LoginService;
    $scope.dataProjectionService = DataProjectionService;

    $scope.topicData = [ ];
    function updateScopeTopicData() {
      var data = DataProjectionService.db.histogramBy('topic');
      $scope.topicData = DataProjectionService.histogramToD3Series(data, ['positive', 'negative']);
    }

    // Helper functions for extracting data for D3 from our structs
    $scope.getLabel = function(d) {
      return d.label;
    };
    $scope.getValue = function(d) {
      return d.value;
    };

    $scope.$watch(function() {
      return LoginService.stateLoggedIn;
    }, DataProjectionService.updateData);
    $scope.$watch(function() {
      return DataProjectionService.db;
    }, updateScopeTopicData);

  }]);
}());
