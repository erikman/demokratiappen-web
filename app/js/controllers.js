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
   'LoginService', 'ParseErrorService', function($scope, $location, LoginService, ParseErrorService) {
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

  $scope.errorMessage = '';

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
  }

  $scope.isUnchanged = function() {
    return LoginService.username == '' && LoginService.password == '';
  };
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


democracyControllers.controller('TopicController', ['$scope', 'LoginService', 'nvd3LineChartDirective', function($scope, LoginService) {
  $scope.loginService = LoginService;

  $scope.topicData = { };
  function queryPage() {
      $scope.topicData = [
                {
                    "key": "Series 1",
                    "values": [ [ 1025409600000 , 0] , [ 1028088000000 , -6.3382185140371] , [ 1030766400000 , -5.9507873460847] , [ 1033358400000 , -11.569146943813] , [ 1036040400000 , -5.4767332317425] , [ 1038632400000 , 0.50794682203014] , [ 1041310800000 , -5.5310285460542] , [ 1043989200000 , -5.7838296963382] , [ 1046408400000 , -7.3249341615649] , [ 1049086800000 , -6.7078630712489] , [ 1051675200000 , 0.44227126150934] , [ 1054353600000 , 7.2481659343222] , [ 1056945600000 , 9.2512381306992] , [ 1059624000000 , 11.341210982529] , [ 1062302400000 , 14.734820409020] , [ 1064894400000 , 12.387148007542] , [ 1067576400000 , 18.436471461827] , [ 1070168400000 , 19.830742266977] , [ 1072846800000 , 22.643205829887] , [ 1075525200000 , 26.743156781239] , [ 1078030800000 , 29.597478802228] , [ 1080709200000 , 30.831697585341] , [ 1083297600000 , 28.054068024708] , [ 1085976000000 , 29.294079423832] , [ 1088568000000 , 30.269264061274] , [ 1091246400000 , 24.934526898906] , [ 1093924800000 , 24.265982759406] , [ 1096516800000 , 27.217794897473] , [ 1099195200000 , 30.802601992077] , [ 1101790800000 , 36.331003758254] , [ 1104469200000 , 43.142498700060] , [ 1107147600000 , 40.558263931958] , [ 1109566800000 , 42.543622385800] , [ 1112245200000 , 41.683584710331] , [ 1114833600000 , 36.375367302328] , [ 1117512000000 , 40.719688980730] , [ 1120104000000 , 43.897963036919] , [ 1122782400000 , 49.797033975368] , [ 1125460800000 , 47.085993935989] , [ 1128052800000 , 46.601972859745] , [ 1130734800000 , 41.567784572762] , [ 1133326800000 , 47.296923737245] , [ 1136005200000 , 47.642969612080] , [ 1138683600000 , 50.781515820954] , [ 1141102800000 , 52.600229204305] , [ 1143781200000 , 55.599684490628] , [ 1146369600000 , 57.920388436633] , [ 1149048000000 , 53.503593218971] , [ 1151640000000 , 53.522973979964] , [ 1154318400000 , 49.846822298548] , [ 1156996800000 , 54.721341614650] , [ 1159588800000 , 58.186236223191] , [ 1162270800000 , 63.908065540997] , [ 1164862800000 , 69.767285129367] , [ 1167541200000 , 72.534013373592] , [ 1170219600000 , 77.991819436573] , [ 1172638800000 , 78.143584404990] , [ 1175313600000 , 83.702398665233] , [ 1177905600000 , 91.140859312418] , [ 1180584000000 , 98.590960607028] , [ 1183176000000 , 96.245634754228] , [ 1185854400000 , 92.326364432615] , [ 1188532800000 , 97.068765332230] , [ 1191124800000 , 105.81025556260] , [ 1193803200000 , 114.38348777791] , [ 1196398800000 , 103.59604949810] , [ 1199077200000 , 101.72488429307] , [ 1201755600000 , 89.840147735028] , [ 1204261200000 , 86.963597532664] , [ 1206936000000 , 84.075505208491] , [ 1209528000000 , 93.170105645831] , [ 1212206400000 , 103.62838083121] , [ 1214798400000 , 87.458241365091] , [ 1217476800000 , 85.808374141319] , [ 1220155200000 , 93.158054469193] , [ 1222747200000 , 65.973252382360] , [ 1225425600000 , 44.580686638224] , [ 1228021200000 , 36.418977140128] , [ 1230699600000 , 38.727678144761] , [ 1233378000000 , 36.692674173387] , [ 1235797200000 , 30.033022809480] , [ 1238472000000 , 36.707532162718] , [ 1241064000000 , 52.191457688389] , [ 1243742400000 , 56.357883979735] , [ 1246334400000 , 57.629002180305] , [ 1249012800000 , 66.650985790166] , [ 1251691200000 , 70.839243432186] , [ 1254283200000 , 78.731998491499] , [ 1256961600000 , 72.375528540349] , [ 1259557200000 , 81.738387881630] , [ 1262235600000 , 87.539792394232] , [ 1264914000000 , 84.320762662273] , [ 1267333200000 , 90.621278391889] , [ 1270008000000 , 102.47144881651] , [ 1272600000000 , 102.79320353429] , [ 1275278400000 , 90.529736050479] , [ 1277870400000 , 76.580859994531] , [ 1280548800000 , 86.548979376972] , [ 1283227200000 , 81.879653334089] , [ 1285819200000 , 101.72550015956] , [ 1288497600000 , 107.97964852260] , [ 1291093200000 , 106.16240630785] , [ 1293771600000 , 114.84268599533] , [ 1296450000000 , 121.60793322282] , [ 1298869200000 , 133.41437346605] , [ 1301544000000 , 125.46646042904] , [ 1304136000000 , 129.76784954301] , [ 1306814400000 , 128.15798861044] , [ 1309406400000 , 121.92388706072] , [ 1312084800000 , 116.70036100870] , [ 1314763200000 , 88.367701837033] , [ 1317355200000 , 59.159665765725] , [ 1320033600000 , 79.793568139753] , [ 1322629200000 , 75.903834028417] , [ 1325307600000 , 72.704218209157] , [ 1327986000000 , 84.936990804097] , [ 1330491600000 , 93.388148670744]]
                }];
  }

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
