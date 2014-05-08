'use strict';

/*global module:false*/
module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    appPath: require('./bower.json').appPath || 'app',
    distPath: 'dist',

    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= pkg.license %> */\n',

    // Task configuration.

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['<%= appPath %>/scripts/{,*/}*.js'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: true
        }
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= appPath %>/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          '<%= appPath %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }

      /*copy: {
        files: [
   *///       'app/**/*',
   //       '!app/js/*',
   //        '!app/scripts/*'
   /*     ],
        tasks: ['copy']
      },
      concat: {
   *///     files: [
   //       'app/js/**/*.js',
   //       '!app/js/bookmarklet.js'
   /*     ],
        tasks: ['concat']
      },
      uglify: {
        files: [
   *///       'dist/js/**/*.js',
   //       '!dist/js/**/*.min.js'
   /*     ],
        tasks: ['uglify']
      }*/

    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          base: [
            '.tmp',
            '<%= appPath %>'
          ]
        }
      },
      test: {
        options: {
          port: 9001,
          base: [
            '.tmp',
            'test',
            '<%= appPath %>'
          ]
        }
      },
      dist: {
        options: {
          base: '<%= distPath %>'
        }
      }
    },

    // Automatically inject Bower components into the app
    'bower-install': {
      app: {
        html: '<%= appPath %>/index.html',
        ignorePath: '<%= appPath %>/'
      }
    },

    tags: {
      dist: {
        options: {
          scriptTemplate: '<script type="text/javascript" src="{{ path }}"></script>',
          openTag: '<!-- start script template tags -->',
          closeTag: '<!-- end script template tags -->'
        },
        src: [
          '<%= distPath %>/js/demokratiappen.min.js'
        ],
        dest: '<%= distPath %>/index.html'
      },
      development: {
        options: {
          scriptTemplate: '<script type="text/javascript" src="{{ path }}"></script>',
          openTag: '<!-- start script template tags -->',
          closeTag: '<!-- end script template tags -->'
        },
        src: [
          '<%= appPath %>/js/*.js',
          '!<%= appPath %>/js/bookmarklet.js'
        ],
        dest: '<%= appPath %>/index.html'
      }
    },


    // Allow the use of non-minsafe AngularJS files. Automatically makes it
    // minsafe compatible so Uglify does not destroy the ng references
    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/scripts',
          src: '*.js',
          dest: '.tmp/concat/scripts'
        }]
      }
    },

    // Replace Google CDN references
    cdnify: {
      dist: {
        html: ['<%= yeoman.dist %>/*.html']
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= appPath %>',
          dest: '<%= distPath %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'views/{,*/}*.html',
            'bower_components/**/*',
            'images/{,*/}*.{webp}',
            'fonts/*'
          ]
        }, {
          expand: true,
          cwd: '.tmp/images',
          dest: '<%= distPath %>/images',
          src: ['generated/*']
        }]
      },
      styles: {
        expand: true,
        cwd: '<%= appPath %>/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
      }
    },

    clean: {
      dist: {
        src: ['<%= distPath %>']
      },
      server: '.tmp'
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: [
          '<%= appPath %>/js/**/*.js',
          '!<%= appPath %>/js/bookmarklet.js'
        ],
        dest: '<%= distPath %>/js/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/js/<%= pkg.name %>.min.js'
      },
      bookmarklet: {
        src: 'app/js/bookmarklet.js',
        dest: 'dist/js/bookmarklet.min.js'
      },
      scrape: {
        src: 'app/scripts/Scrape.js',
        dest: 'dist/scripts/Scrape.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {}
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['app/**/*.js']
      }
    },
  });

  // These plugins provide necessary tasks.
  /*grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-script-link-tags');*/

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
//      'bower-install',
//      'concurrent:server',
//      'autoprefixer',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('build', [
     'clean',
     'copy',
     'concat',
     'uglify',
     'tags'
 /*   'clean:dist',
    'bower-install',
    'useminPrepare',
    'concurrent:dist',
    'autoprefixer',
    'concat',
    'ngmin',
    'copy:dist',
    'cdnify',
    'cssmin',
    'uglify',
    'rev',
    'usemin',
    'htmlmin'*/
  ]);

  // Default task.
  grunt.registerTask('default', [ /*'jshint' */ 'build'
  /*  'clean',
    'copy',
    'concat',
    'uglify',
    'tags'*/
  ]);

};
