var FilterOP = {};

FilterOP.Equals = function(field, value) {
  this.field = field;
  this.value = value;
}
FilterOP.Equals.prototype.filter(object) {
  var value = object.field;
  return value === this.value;
}
FilterOP.Equals.prototype.updateParseQuery(query) {
  query.equalTo(this.field, this.value);
}


var Filter = function() {
  this.filters = [];
}
Filter.prototype.equalTo(field, value) {
  this.filters[this.filters.length] = new FilterOP.Equals(field, value);
}
Filter.prototype.parseQuery(query) {
  for (var i = 0; i < this.filters.length; i++) {
    this.filters[i].updateParseQuery(query);
  }
}
Filter.prototype.filter(object) {
  var result = true;
  for (var i = 0; result && (i < this.filters.length); i++) {
    result &= this.filters[i].filter(object);
  }
  return result;
}
exports.Filter = Filter;


var Event = {}
Event.valueByTag = function(type) {
  return function(object) {
    for (var i = 0; i < object.tags; i++) {
      var tag = object.tags[i];
      if (tag.type === type) {
        return tag.name;
      }
    }
  };
};


/**
 * @brief Class for working with graph data
 *
 */
var Graph = function() {
  this.nodes = [];
  this.edges = [];
}

Graph.prototype.addEdge(from, to, distance) {  
}

Graph.prototype.calculateDistances() {
}

Graph.prototype.distanceFrom(a) {
  return this.nodes[a].distances;
}

TypeProjection.totalGraph = new Graph();
TypeProjection.totalGraph.addEdge(
  {name: 'Fredrik Reinfeldt', type:'Person'},
  {name: 'Moderaterna', type:'Political Party'}, 0.2);

var TypeProjection = function(targetType) {
  this.targetType = targetType;
  this.graph = TypeProjection.totalGraph.setFilter();
  this.graph.calculateDistances();
}


/**
 * @brief Calculate distance from event to target type
 *
 * @return {name, distance, score} or undefined if no mapping was found.
 */
TypeProjection.prototype.map = function (object) {
  var d = 100000;
  var score = object.score;
  var name;

  // Check the tags on this object
  for (var i = 0; i < object.tags.length; i++) {
    var tag = object.tags[i];
    if (tag.type === this.target) {
      d = 0;
      name = tag.name;
      score = tag.score ? tag.score : score;
    }
    else {
      // Try different mappings
      var graph = graphs[tag.type];
      if (graph) {
        var distance = graph.distance(tag.name
      }
    }
  }

  if (name) {
    return { distance: d, score: score, name: name };
  }
}

// Distance 0 == very important
TypeProjection.distanceToImportance = function(x) {
  var max = 1.0f; // how to find the max?
  var sigma = 1.0f;
  return max * Math.exp((x * x) / (2.0 * sigma * sigma));
}

/**
 *
    {
      tags: [
        {
          'type': 'Person',
          'name': 'Fredrik Reinfeldt'
          'score': 1
        },
        {
          'type': 'Topic',
          'name': 'Skatt'
        }
      ],
      'createdAt': '2014-01-01',
      'score': 1
     }
 */
var Database = function(events) {
  this.events = events;
  this.filter = null;
}


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
Database.prototype.setFilter(filter) {
  this.filter = filter;
}

Database.prototype.getFilter(filter) {
  return this.filter;
}

Database.prototype.keys() {
  return ['Political Party', 'Topic', 'Person', 'Organization', 'Location'];
}


/**
 * @brief Project the events onto a main axis and calculate histogram.
 *
 * Example:
 * @code
 * var data = db.histogramBy('Topic');
 * data = {
 *  'Skatt': {negative: 5, positive: 7},
 *  'Skola': {negative: 3, positive: 11},
 * }
 * @endcode
 */
Database.prototype.histogramBy(mainAxis) {
  // Get the projections
  var mainProjection = new TypeProjection(mainAxis);

  // Iterate over the events and project on the axis
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (this.filter == null || this.filter.filter(e)) {
      // This event should be included, project it onto the main and secondary
      // axis.
      var main = mainProjection.map(e);
      if (main) {
        // Add a result entry
        var prevHistogramMap = result[main.name];
        if (!prevHistogramArray) {
          prevHistogramMap = {negative: 0, positive: 0};
          result[main.name] = prevHistogramMap;
        }
        prevHistogramMap.negative += d;
        prevHistogramMap.positive += d;
      }
    }
  }

  return result;
}


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
Database.prototype.projectionBy(mainAxis, secondaryAxis) {
  var result = {};

  // Get the projections
  var mainProjection = new TypeProjection(mainAxis);
  var secondaryProjection = new TypeProjection(secondaryAxis);

  // Iterate over the events and project on the axis
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (this.filter == null || this.filter.filter(e)) {
      // This event should be included, project it onto the main and secondary
      // axis.
      var main = mainProjection.map(e);
      var second = secondaryProjection.map(e);
      if (main && second) {
        // Combine the distances
        var d = Math.sqrt(main.distance * main.distance
                          + second.distance * second.distance);

        // Add a result entry
        var prevHistogramMap = result[main.name];
        if (!prevHistogramArray) {
          prevHistogramMap = {};
          result[main.name] = prevHistogramMap;
        }
        var prevHistogramValue = prevHistogramMap[second.name];
        if (!prevHistogramValue) prevHistogramValue = 0;
        prevHistogramMap[second.name] = prevHistogramValue
          + e.score * Projection.distanceToImportance(d);
      }
    }
  }

  return result;
}


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
Database.prototype.timelineBy(mainAxis) {
  var result = {};

  // Get the projections
  var projection = new Projection(mainAxis);

  // Iterate over the events and project on the axis
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (this.filter == null || this.filter.filter(e)) {
      // This event should be included, project it onto the main and secondary
      // axis.
      var main = mainProjection.map(e);
      if (main) {
        // Add a result entry
        var timeline = result[main];
        if (!timeline) {
          timeline = [];
          result[main] = timeline;
        }

        timeline[timeline.length] = {
          date: e.date,
          type: e.type,
          name: e.name,
          importance: e.score * Projection.distanceToImportance(main.distance)
        };
      }
    }
  }

  // TODO: Sort the timelines
  return result;
}
exports.Database = Database;

