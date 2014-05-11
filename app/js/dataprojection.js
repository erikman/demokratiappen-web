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

/* exported dp */
var dp = (function() {
  'use strict';

  var dp = {
    version: '0.0.0'
  };

  /**
   * @brief This class describes one event created by the user.
   *
   * Example:
   * @code
   * var e = new Event();
   * e.addTag({type: 'Topic', name: 'Skatt'}); // Note no score
   * e.addTag({type: 'Political Party', name: 'Socialdemokraterna', score: -1});
   * e.addTag({type: 'Political Party', name: 'Vänsterpartiet', score: 1});
   * e.addTag({type: 'Person', name: 'Stefan Löfgren', score: -1});
   * @endcode
   */
  dp.Event = function(types) {
    this.types = types || {};
  };


  dp.Event.prototype.addTag = function(tag) {
    var types = this.types[tag.type];
    if (!types) {
      types = {};
      this.types[tag.type] = types;
    }

    types[tag.name] = {
      score: tag.score
    };
  };

  /**
   * @brief Calculate mean score form the tags
   */
  dp.Event.prototype.meanScore = function() {
    var scoreSum = 0;
    var scoreCount = 0;
    for (var typeKey in this.types) {
      var tagTypes = this.types[typeKey];
      for (var tagKey in tagTypes) {
        var tag = tagTypes[tagKey];
        if (tag.score) {
          scoreSum += tag.score;
          scoreCount += 1;
        }
      }
    }

    return (scoreCount > 0) ? scoreSum / scoreCount : 0;
  };


  /**
   * @brief The tag types we allow.
   */
  dp.Event.prototype.keys = function() {
    return ['Political Party', 'Topic', 'Person', 'Organization', 'Location'];
  };


  /**
   * @brief Internal class used for creating event filters
   */
  var EventFilterOP = {};

  EventFilterOP.Equals = function(type, value) {
    this.type = type;
    this.value = value;
  };

  EventFilterOP.Equals.prototype.filter = function(object) {
    var types = object.types[this.type];
    var value;
    if (types) {
      value = types[this.value];
    }
    return !!value;
  };


  /**
   * @brief Event filter class
   *
   * This is basically an array of event filter operations and some convenience functions
   * for creating them in a programmer friendly way.
   */
  dp.EventFilter = function() {
    this.filters = [];
  };

  dp.EventFilter.prototype.equalTo = function(type, value) {
    this.filters[this.filters.length] = new EventFilterOP.Equals(type, value);
  };

  dp.EventFilter.prototype.filter = function(object) {
    var result = true;
    for (var i = 0; result && (i < this.filters.length); i++) {
      result = result && this.filters[i].filter(object);
    }
    return result;
  };


  /**
   * @brief Class for projecting an event onto a type axis
   */
  var TypeProjection = function(type) {
    this.type = type;
  };


  /**
   * @brief Calculate distance from event to target type
   *
   * @return {name, distance, score} or undefined if no mapping was found.
   */
  TypeProjection.prototype.map = function(object) {
    // Check for direct result of this event
    var results = [];
    var typeTags = object.types[this.type];
    if (typeTags) {
      for (var key in typeTags) {
        var score = typeTags[key].score;
        if (!score) {
          score = object.meanScore();
        }

        results[results.length] = {
          type: this.type,
          name: key,
          score: score,
          distance: 0
        };
      }
    }

    // TODO: If no direct results are found, try to map the object onto the axis.
    return results;
  };


  // Distance 0 == very important
  TypeProjection.distanceToImportance = function(x) {
    var sigma = 1.0; // How to find distance form the graph?
    return Math.exp((x * x) / (2.0 * sigma * sigma));
  };


  /**
   * @brief The data base connection we will make queries against.
   */
  dp.Database = function(events) {
    this.events = events;
    this.filter = null;
  };


  /**
   * @brief Set filter which limits which events we are showing
   *
   * Example:
   * @code
   * var filter = new Filter();
   * filter.equalTo('Topic', 'Skatt');
   * db.setFilter(filter);
   * @endcode
   */
  dp.Database.prototype.setFilter = function(filter) {
    this.filter = filter;
  };

  dp.Database.prototype.getFilter = function() {
    return this.filter;
  };


  /**
   * @brief Project the events onto a main axis and calculate histogram.
   *
   * Example:
   * @code
   * var data = db.histogramBy('Topic');
   * data = {
   *  'Skatt': {negative: 5, positive: 7, count: 12},
   *  'Skola': {negative: 3, positive: 11, count 15}, // count can be > negative+positive if events are missing scores
   * }
   * @endcode
   */
  dp.Database.prototype.histogramBy = function(mainAxis) {
    var result = {};
    if (!this.events) {
      return result;
    }

    // Get the projections
    var mainProjection = new TypeProjection(mainAxis);

    // Iterate over the events and project on the axis
    for (var i = 0; i < this.events.length; i++) {
      var e = this.events[i];
      if (!this.filter || this.filter.filter(e)) {
        // This event should be included, project it onto the main and secondary
        // axis.
        var main = mainProjection.map(e);
        if (main) {
          for (var j = 0; j < main.length; j++) {
            var projectedEvent = main[j];

            // Add a result entry
            var prevHistogramMap = result[projectedEvent.name];
            if (!prevHistogramMap) {
              prevHistogramMap = {negative: 0, positive: 0, count: 0};
              result[projectedEvent.name] = prevHistogramMap;
            }

            var importance =
              TypeProjection.distanceToImportance(projectedEvent.distance);
            prevHistogramMap.count += importance;
            if (projectedEvent.score < 0) {
              prevHistogramMap.negative += projectedEvent.score * importance;
            }
            else if (projectedEvent.score > 0) {
              prevHistogramMap.positive += projectedEvent.score * importance;
            }
          }
        }
      }
    }

    return result;
  };


  /**
   * @brief Project the events onto a main axis and calculate histogram.
   *
   * Example:
   * @code
   * var data = db.projectionBy('Topic', 'Political Party');
   * data = {
   *  'Skatt': {'Socialdemokraterna': 0.8, 'Moderaterna': 2, 'Miljöpartiet': 3},
   *  'Skola': {'Socialdemokraterna': 3, 'Moderaterna': 4, 'Miljöpartiet': 7},
   * }
   * @endcode
   */
  dp.Database.prototype.projectionBy = function(mainAxis, secondaryAxis) {
    var result = {};
    if (!this.events) {
      return result;
    }

    // Get the projections
    var mainProjection = new TypeProjection(mainAxis);
    var secondaryProjection = new TypeProjection(secondaryAxis);

    // Iterate over the events and project on the axis
    for (var i = 0; i < this.events.length; i++) {
      var e = this.events[i];
      if (!this.filter || this.filter.filter(e)) {
        // This event should be included, project it onto the main and secondary
        // axis.
        var main = mainProjection.map(e);
        var second = secondaryProjection.map(e);
        if (main && second) {
          // TODO: Form the different tag combinations

          // Combine the distances
          var d = Math.sqrt(main.distance * main.distance +
                            second.distance * second.distance);

          // Add a result entry
          var prevHistogramMap = result[main.name];
          if (!prevHistogramMap) {
            prevHistogramMap = {};
            result[main.name] = prevHistogramMap;
          }
          var prevHistogramValue = prevHistogramMap[second.name];
          if (!prevHistogramValue) {
            prevHistogramValue = 0;
          }
          prevHistogramMap[second.name] = prevHistogramValue +
            e.score * TypeProjection.distanceToImportance(d);
        }
      }
    }

    return result;
  };


  /**
   * @brief Project the events onto a timeline
   *
   * @code
   * data = graph.timelineBy('Political Party');
   * data = {
   *   'Socialdemokraterna': [{date: 2014-01-01, value: 1}, ... ],
   *   'Moderaterna': [...],
   * };
   * @endcode
   */
  dp.Database.prototype.timelineBy = function(mainAxis) {
    var result = {};
    if (!this.events) {
      return result;
    }

    // Get the projections
    var projection = new TypeProjection(mainAxis);

    // Iterate over the events and project on the axis
    for (var i = 0; i < this.events.length; i++) {
      var e = this.events[i];
      if (!this.filter || this.filter.filter(e)) {
        // This event should be included, project it onto the main and secondary
        // axis.
        var main = projection.map(e);
        if (main) {
          // Add a result entries
          for (var j = 0; j < main.length; j++) {
            var timeline = result[main];
            if (!timeline) {
              timeline = [];
              result[main] = timeline;
            }

            timeline[timeline.length] = {
              date: e.createdA,
              type: mainAxis,
              name: main[j].name,
              importance: main[j].score *
                TypeProjection.distanceToImportance(main[j].distance)
            };
          }
        }
      }
    }

    // TODO: Sort the timelines
    return result;
  };

  if (typeof define === 'function' && define.amd) {
    define(dp);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = dp;
  } else if (this) {
    this.dp = dp;
  }
  return dp;
}());
