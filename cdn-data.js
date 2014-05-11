'use strict';

var minify = true;

// Google exports
var data = module.exports = {
  jquery: {
    versions: ['2.1.0', '2.0.3', '2.0.2', '2.0.1', '2.0.0', '1.11.0', '1.10.2', '1.10.1', '1.10.0', '1.9.1', '1.9.0', '1.8.3', '1.8.2', '1.8.1', '1.8.0', '1.7.2', '1.7.1', '1.7.0', '1.6.4', '1.6.3', '1.6.2', '1.6.1', '1.6.0', '1.5.2', '1.5.1', '1.5.0', '1.4.4', '1.4.3', '1.4.2', '1.4.1', '1.4.0', '1.3.2', '1.3.1', '1.3.0', '1.2.6', '1.2.3'],
    url: function (version) {
      return '//ajax.googleapis.com/ajax/libs/jquery/' + version + '/jquery.min.js';
    }
  },
  'jquery-ui': {
    versions: ['1.10.4', '1.10.3', '1.10.2', '1.10.1', '1.10.0', '1.9.2', '1.9.1', '1.9.0', '1.8.24', '1.8.23', '1.8.22', '1.8.21', '1.8.20', '1.8.19', '1.8.18', '1.8.17', '1.8.16', '1.8.15', '1.8.14', '1.8.13', '1.8.12', '1.8.11', '1.8.10', '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.2', '1.8.1', '1.8.0', '1.7.3', '1.7.2', '1.7.1', '1.7.0', '1.6.0', '1.5.3', '1.5.2'],
    url: function (version) {
      return '//ajax.googleapis.com/ajax/libs/jqueryui/' + version + '/jquery-ui.min.js';
    }
  },
  dojo: {
    versions: ['1.9.2', '1.9.1', '1.9.0', '1.8.5', '1.8.4', '1.8.3', '1.8.2', '1.8.1', '1.8.0', '1.7.5', '1.7.4', '1.7.3', '1.7.2', '1.7.1', '1.7.0', '1.6.1', '1.6.0', '1.5.2', '1.5.1', '1.5.0', '1.4.4', '1.4.3', '1.4.1', '1.4.0', '1.3.2', '1.3.1', '1.3.0', '1.2.3', '1.2.0', '1.1.1'],
    url: function (version) {
      return '//ajax.googleapis.com/ajax/libs/dojo/' + version + '/dojo/dojo.js';
    }
  },
  swfobject: {
    versions: ['2.2', '2.1'],
    url: function (version) {
      return '//ajax.googleapis.com/ajax/libs/swfobject/' + version + '/swfobject.js';
    }
  }
};

// AngularJS
var angularFiles = [
  'angular',
  'angular-animate',
  'angular-cookies',
  'angular-loader',
  'angular-resource',
  'angular-route',
  'angular-sanitize'
];

angularFiles.forEach(function (item) {
  data[item] = {
    versions: ['1.2.16', '1.2.15', '1.2.14', '1.2.13', '1.2.12', '1.2.11', '1.2.10', '1.2.9', '1.2.8', '1.2.7', '1.2.6', '1.2.5', '1.2.4', '1.2.3', '1.2.2', '1.2.1', '1.2.0', '1.0.8', '1.0.7', '1.0.6', '1.0.5', '1.0.4', '1.0.3', '1.0.2', '1.0.1'],
    url: function (version) {
      var extension = minify ? '.min.js' : '.js';
      return '//ajax.googleapis.com/ajax/libs/angularjs/' + version + '/' + item + extension;
    }
  };
});

// Simplified data for cdnjs, note does not support .css files or other support
// files.
var cdnjs = [
  {
    name: 'bootstrap',
    cdnjsName: 'twitter-bootstrap',
    filename: 'js/bootstrap.js',
    filenameMin: 'js/bootstrap.min.js',
    versions: ['3.1.1', '3.0.3']
  },
  {
    name: 'd3',
    cdnjsName: 'd3',
    filename: 'd3.js',
    filenameMin: 'd3.min.js',
    versions: ['3.4.6', '3.3.13', '3.3.11']
  },
  {
    name: 'es5-shim',
    cdnjsName: 'es5-shim',
    filename: 'es5-shim.js',
    filenameMin: 'es5-shim.min.js',
    versions: ['2.3.0', '2.2.0', '2.1.0']
  },
  {
    name: 'json3',
    cdnjsName: 'json3',
    filename: 'json3.js',
    filenameMin: 'json3.min.js',
    versions: ['3.2.6']
  },
  {
    name: 'nvd3',
    cdnjsName: 'nvd3',
    filename: 'nv.d3.js',
    filenameMin: 'nv.d3.min.js',
    versions: ['1.1.15-beta', '1.1.14-beta']
  },
  {
    name: 'underscore',
    cdnjsName: 'underscore.js',
    filename: 'underscore.js',
    filenameMin: 'underscore-min.js',
    versions: ['1.6.0']
  }
];

cdnjs.forEach(function (item) {
  data[item.name] = {
    versions: item.versions,
    url: function (version) {
      var filename = minify ? item.filenameMin : item.filename;
      return ['//cdnjs.cloudflare.com/ajax/libs', item.cdnjsName, version,
        filename].join('/');
    }
  };
});

// jsdelivr.com
var jsdelivr = [
  {
    name: 'angularjs-nvd3-directives',
    cdnjsName: 'angularjs.nvd3-directives',
    filename: 'angularjs-nvd3-directives.js',
    filenameMin: 'angularjs-nvd3-directives.min.js',
    versions: ['0.0.7']
  }
];

jsdelivr.forEach(function (item) {
  data[item.name] = {
    versions: item.versions,
    url: function (version) {
      var filename = minify ? item.filenameMin : item.filename;
      return ['//cdn.jsdelivr.net/', item.cdnjsName, 'v' + version,
        filename].join('/');
    }
  };
});

