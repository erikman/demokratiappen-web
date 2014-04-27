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

var democracyControllers = angular.module('democracy.controller', ['democracy.service']);

democracyControllers.controller('MainController', [ '$scope', '$location',
   'LoginService', function($scope, $location, LoginService) {
  $scope.loginService = LoginService;

  // We use this function for selecting which tab that corresponds to our
  // current route.
  $scope.isActive = function(route) {
    return route === $location.path();
  }
}]);


democracyControllers.controller('LoginController', ['$scope', '$location',
   'LoginService', function($scope, $location, LoginService) {
  $scope.loginService = LoginService;

  // The state decides if we shoould show the login or the signup fields. We can
  // show the login view on multiple sub-pages, but only show signup on the
  // dedlicated signup page.
  var states = {
    LOGIN: 0,
    SIGNUP: 1,
    currentState: 0
  }
  $scope.state = states;
  $scope.state.currentState = ($location.path() == '/signup') ? states.SIGNUP : states.LOGIN;

  // When the stateLoggedIn changes we check if we are on one of the dedlicated
  // login pages and if we are then we redirect to the statistics page on a
  // successful login.
  $scope.$watch(function() {
    return LoginService.stateLoggedIn;
  }, function() {
    if (LoginService.stateLoggedIn == LoginService.LOGGED_IN) {
      if (($location.path() == '/login') || ($location.path() == '/signup')) {
        $location.path('/statistics');
      }
    }
  });

  $scope.loginAsGuest = function() {
    LoginService.username = 'Sandra';
    LoginService.password = 'guest';
    LoginService.login();
  }
}]);


democracyControllers.controller('AddPageController', ['$scope', '$location',
    '$window', '$timeout', 'LoginService',
    function($scope, $location, $window, $timeout, LoginService) {
  $scope.loginService = LoginService;
  $scope.tags = [];

  // State variable for this controller
  var AddPageState = {
    LOADING_TAGS: 0,
    WAIT_FOR_USER_INPUT: 1,
    SAVING: 2,
    SAVED: 3,
    SAVE_ERROR: 4,
    LOAD_ERROR: 5
  };
  $scope.AddPageState = AddPageState;
  $scope.addPageState = AddPageState.LOADING_TAGS;

  var indexOf = function(array, x) {
    var result = -1;
    for (var i = 0; i < array.length; i++) {
      if (array[i].id === x.id) {
        result = i;
        break;
      }
    }
    return result;
  }

  // Update user tags table
  // Return promise when the tags are updated
  function updateUserTags(positiveTags, negativeTags) {
    // Add tags to the user object, first update the tags we already have
    var UserTag = Parse.Object.extend("UserTag");
    var currentUser = Parse.User.current();
    var allTags = positiveTags.concat(negativeTags);

    var query = new Parse.Query("UserTag");
    query.containedIn("tag", allTags);
    query.equalTo("user", currentUser);
    query.limit(allTags.length + 1);

    return query.find().then(function(userTags) {
      var tagsToSave = [];

      for (var t = 0; t < userTags.length; t++) {
        var userTag = userTags[t];
        var tag = userTag.get("tag");

        // Check if this tag is positive
        var isPositive = (indexOf(positiveTags, tag) >= 0);
        var isNegative = (indexOf(negativeTags, tag) >= 0);

        // Update the user tag
        if (isPositive) {
          userTag.increment("positiveCount");
        }
        if (isNegative) {
          userTag.increment("negativeCount");
        }
        tagsToSave[tagsToSave.length] = userTag;
      }

      // Create new user tags for the ones not contained in returned set.
      for (var i = 0; i < allTags.length; i++) {
        var tag = allTags[i];

        var needNewObject = true;
        for (var j = 0; needNewObject && (j < userTags.length); j++) {
          var userTag = userTags[j];
          var userTagTag = userTag.get("tag");
          needNewObject = !(userTagTag.id === tag.id);
        }

        if (needNewObject) {
          // Check if this tag is positive
          var isPositive = (indexOf(positiveTags, tag) >= 0);
          var isNegative = (indexOf(negativeTags, tag) >= 0);

          // Create new UserTag object and initialize
          var userTag = new UserTag();
          userTag.set("tag", tag);
          userTag.set("name", tag.get("name"));
          userTag.set("positiveCount", isPositive ? 1 : 0);
          userTag.set("negativeCount", isPositive ? 0 : 1);
          userTag.set("user", currentUser);
          userTag.setACL(new Parse.ACL(currentUser));
          tagsToSave[tagsToSave.length] = userTag;
        }
      }
      return Parse.Object.saveAll(tagsToSave);
    });
  }


  $scope.post = function () {
    if (($scope.title.length > 0) && ($scope.url.length > 0)) {
      $scope.addPageState = AddPageState.SAVING;

      // Create new page object to fill in
      var Page = Parse.Object.extend("Page");
      var page = new Page();
      var currentUser = Parse.User.current();

      page.set("title", $scope.title);
      page.set("url", $scope.url);
      page.set("user", currentUser);
      page.setACL(new Parse.ACL(currentUser));
      page.set("topic", $scope.topic);

      // Create upTags or downTags array from the tags the user pressed
      var tagCount = $scope.tags.length;
      var upTags = [];
      var downTags = [];
      for (var index = 0; index < tagCount; index++) {
        var tag = $scope.tags[index];
        if (tag.up) {
          upTags = upTags.concat(tag);
        }
        else if (tag.down) {
          downTags = downTags.concat(tag);
        }
        delete tag.up;
        delete tag.down;
      }
      page.set("positive_tags", upTags);
      page.set("negative_tags", downTags);

      // Update user tags and save the page object
      Parse.Promise.when([
        updateUserTags(upTags, downTags),
        page.save()]).then(function() {
          $scope.$apply(function() {
            $scope.addPageState = AddPageState.SAVED;
          });

          // Start timer so user has a chance to read the saved message
          var promise = new Parse.Promise();
          $timeout(function() {
            promise.resolve();
          }, 500);
          return promise;
        }).then(function() {
          $scope.$apply(function() {
            // Clear the entry from
            $scope.title = "";
            $scope.url = "";
            $scope.topic = undefined;
            $scope.addPageForm.$setPristine();
          });
          $window.history.back();
        }, function(error) {
          $scope.$apply(function() {
            $scope.addPageState = AddPageState.SAVE_ERROR;
          });

          // Execute any logic that should take place if the save fails.
          // error is a Parse.Error with an error code and description.
          console.log("Error while saving page:");
          console.log(error);
        });
    }
  };

  $scope.showMoreTags = function() {
    $scope.tags = $scope.allTags;
  }

  $scope.abort = function() {
    $window.history.back();
  };

  $scope.resetTag = function(tag) {
    tag.up = false;
    tag.down = false;
  };

  /**
   * Retrieve topics from Parse.
   *
   * @return Promise that is fulilled when topics are loaded.
   */
  var getTopics = function() {
    $scope.topics = [];
    $scope.allTopics = [];

    var query = new Parse.Query("Tag");
    query.equalTo("type", "topic");
    return query.find().then(function (topics) {
      $scope.$apply(function() {
        $scope.topics = _.sortBy(topics, function(topic) {
          return topic.get("name");
        });
      });
      return Parse.Promise.as();
    });
  }

  // Sort list by relevance
  //
  // input: [ { relevance: 0.8, tag: Parse.Object('Tag' } ]
  // output: list sorted in descending order by relevance
  function sortTagsByRelevance(relevanceTags) {
    var sortedDescendingListOfRelevance
      = _.sortBy(relevanceTags, function(tagWithRelevance) {
        return tagWithRelevance.relevance;
    }).reverse();
    return sortedDescendingListOfRelevance;
  }

  // Filter which tags we should show to the user
  //
  // input: [ { relevance: 0.8, tag: Parse.Object('Tag' } ]
  // output: Array of Parse.Object.Tag objects
  function filterSortedTags(sortedDescendingListOfRelevance) {
    var tagIdList = _.pluck(_.take(sortedDescendingListOfRelevance, 5), 'tag');
    return tagIdList;
  }

  /**
   * Retrieve tags from Parse.
   *
   * @return Promise when tags are retrieved
   */
  var getTags = function(urlid) {
    // We got a url-id through the argument list, look it up in the database
    // and present the associated tags.
    // This became somewhat ugly because Parse.Query.include doesn't work
    // with our combination of relevance and a Tag object,
    // and Parse.Object.fetchAll seems to have a bug so it only throws
    // exceptions when used.
    var tags;
    var urlQuery = new Parse.Query('Url');
    return urlQuery.get(urlid).then(function (urlObject) {
      var relevanceTags = urlObject.get('relevanceTags');
      var sortedTags = sortTagsByRelevance(relevanceTags);

      // Strip the relevance from the tags
      var allTags = _.pluck(sortedTags, 'tag');
      $scope.allTags = allTags;

      // Filter out which tags we display in the first round to the user.
      tags = filterSortedTags(sortedTags);

      // We have our tags, need to do fetch on them to get the names.
      return Parse.Object.fetchAll(allTags);
    }).then(function () {
      $scope.$apply(function() {
        $scope.tags = tags;
      });
      return Parse.Promise.as();
    });
  }

  // We can get here several times since we have watchers that will trigger
  // this function. So we wrap the initialization so we only make queries
  // to parse once.
  var init = _.once(function(urlid) {
    Parse.Promise.when([getTags(urlid), getTopics()]).then(function() {
      $scope.$apply(function() {
        $scope.addPageState = AddPageState.WAIT_FOR_USER_INPUT;
      });
    }, function(error) {
      console.log('Error loading tags ' + JSON.stringify(error));
      $scope.$apply(function() {
        $scope.addPageState = AddPageState.LOAD_ERROR;
      })
    });
  });

  function queryPage() {
    var title = $location.search().title;
    if (title) {
      $scope.title = title;
    }
    var url = $location.search().url;
    if (url) {
      $scope.url = url;
    }
    var urlid = $location.search().urlid;

    if (LoginService.stateLoggedIn == LoginService.LOGGED_IN && urlid) {
     init(urlid);
    }
  }

  $scope.$watch(function() {
    return $location.search();
  }, queryPage);
  $scope.$watch(function() {
    return LoginService.stateLoggedIn;
  }, queryPage);
}]);


democracyControllers.controller('ListPagesController', ['$scope', 'LoginService', function($scope, LoginService) {
  $scope.loginService = LoginService;

  function queryPage() {
    if (LoginService.stateLoggedIn != LoginService.LOGGED_IN) {
      return;
    }

    var currentUser = Parse.User.current();

    var query = new Parse.Query("Page");
    query.equalTo("user", currentUser);
    query.include(["positive_tags"]);
    query.include(["negative_tags"]);
    query.include(["topic"]);
    query.limit(20);

    query.find().then(function(articles) {
      $scope.articles = _.map(articles, function(article) {
        var a = {
          title: article.get("title"),
          url: article.get("url"),
          topic: article.get("topic"),
          tags: [ ]
        };

        a.tags = a.tags.concat(_.map(article.get("positive_tags"),
          function(tag) {
            var tagName = 'unknown';
            if (tag) {
              tagName = tag.get('name');
            }
            return {name: tagName, type: 'success' };
          }));
        a.tags = a.tags.concat(_.map(article.get("negative_tags"),
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

democracyControllers.controller('StatisticsController', ['$scope', 'LoginService', function($scope, LoginService) {
  $scope.loginService = LoginService;
  $scope.tags = [];
  $scope.tagCount = 0;

  function queryPage() {
    if (LoginService.stateLoggedIn != LoginService.LOGGED_IN) {
      return;
    }

    var UserTag = Parse.Object.extend("UserTag");

    var currentUser = Parse.User.current();
    var query = new Parse.Query(UserTag);
    query.equalTo("user", currentUser);

    query.find({
      success: function(tags) {
        var tagCount = 0;
        for (var i = 0; i < tags.length; i++) {
          var tag = tags[i];
          $scope.tags[i] = {
            name: tag.get("name"),
            positiveCount: tag.get("positiveCount"),
            negativeCount: tag.get("negativeCount")
          };
          tagCount += $scope.tags[i].positiveCount
            + $scope.tags[i].negativeCount;
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

democracyControllers.controller('TagsPerDateController', ['$scope', 'LoginService', function($scope, LoginService) {

  function queryPage() {
    if (LoginService.stateLoggedIn != LoginService.LOGGED_IN) {
      return;
    }

    var currentUser = Parse.User.current();
    var pageQuery = new Parse.Query("Page");
    pageQuery.equalTo("user", currentUser);
    pageQuery.include("positive_tags");
    pageQuery.include("negative_tags");

    pageQuery.descending("createdAt");

    pageQuery.find().then(function(pages) {
      var result = [];
      for (var i = 0; i < pages.length; i++) {
        var positiveTags = pages[i].get("positive_tags");
        if (positiveTags) {
          for (var j = 0; j < positiveTags.length; j++) {
            var positiveTag = positiveTags[j];
            if (positiveTag) {
              var resultTag = {
                id: positiveTag.id,
                date: pages[i].createdAt,
                name: positiveTag.get("name"),
                score: 1
              };
              result[result.length] = resultTag;
            }
          }
        }

        var negativeTags = pages[i].get("negative_tags");
        if (negativeTags) {
          for (var j = 0; j < negativeTags.length; j++) {
            var negativeTag = negativeTags[j];
            if (negativeTag) {
              var resultTag = {
                id: negativeTag.id,
                date: pages[i].createdAt,
                name: negativeTag.get("name"),
                score: -1
              };
              result[result.length] = resultTag;
            }
          }
        }
      }

      // Format the data as csv
      var csvResult = "id; date; name; score\n";
      for (var i = 0; i < result.length; i++) {
        csvResult += result[i].id + ";" + result[i].date + ";" + result[i].name + ";" + result[i].score + "\n";
      }

      $scope.tags = csvResult;
      $scope.$apply();
    }, function (error) {
      alert(error);
    });
  }

  $scope.$watch(function() {
    return LoginService.stateLoggedIn;
  }, queryPage);
}]);


democracyControllers.controller('AccumulatedTagsController', ['$scope',
    'LoginService', function($scope, LoginService) {

  function queryPage() {
    if (LoginService.stateLoggedIn != LoginService.LOGGED_IN) {
      return;
    }

    var currentUser = Parse.User.current();
    var userTagQuery = new Parse.Query("UserTag");
    userTagQuery.equalTo("user", currentUser);

    userTagQuery.find().then(function(userTags) {
      var result = [];
      for (var i = 0; i < userTags.length; i++) {
        var resultTag = {
          id: userTags[i].id,
          name: userTags[i].get("name"),
          score: userTags[i].get("negativeCount") + userTags[i].get("positiveCount")
        };
        result[result.length] = resultTag;
      }

      result.sort(function(a, b) { return b.score - a.score; });

      // Format the data as csv
      var csvResult = "id; name; score\n";
      for (var i = 0; i < result.length; i++) {
        csvResult += result[i].id + ";" + result[i].name + ";" + result[i].score + "\n";
      }

      $scope.tags = csvResult;
      $scope.$apply();
    }, function (error) {
      alert(error);
    });
  }

  $scope.$watch(function() {
    return LoginService.stateLoggedIn;
  }, queryPage);
}]);

democracyControllers.controller('ListCollectionsController', ['$scope', 'LoginService', function($scope, LoginService) {
  function queryPage() {
    if (LoginService.stateLoggedIn != LoginService.LOGGED_IN) {
      return;
    }

    Parse.Cloud.run('listCollections', {}).then(function(result) {
      $scope.tags = result;
      $scope.$apply();
    }, function (error) {
      alert(error);
    });
  }

  $scope.$watch(function() {
    return LoginService.stateLoggedIn;
  }, queryPage);
}]);
