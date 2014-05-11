'use strict';

/*global module:false*/
module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    appPath: grunt.file.readJSON('./bower.json').appPath || 'app',
    distPath: 'dist',

    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= pkg.license %> */\n',

    // Task configuration.

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      bower: {
        files: ['bower.json'],
        tasks: ['bowerInstall']
      },
      js: {
        files: ['<%= appPath %>/js/{,*/}*.js'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: true
        }
      },
      styles: {
        files: ['<%= appPath %>/styles/{,*/}*.css'],
        tasks: ['newer:copy:styles']
      },
      compass: {
        files: ['<%= appPath %>/styles/{,*/}*.{scss,sass}'],
        tasks: ['compass:server']
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
      dist: {
        options: {
          base: '<%= distPath %>'
        }
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        src: ['.tmp', '<%= distPath %>']
      },
      server: '.tmp'
    },

    // Automatically inject Bower components into the app
    bowerInstall: {
      app: {
        src: ['<%= appPath %>/index.html'],
        ignorePath: '<%= appPath %>/'
      }
    },

    // Compiles Sass to CSS and generates necessary files if requested
    compass: {
      options: {
        sassDir: '<%= appPath %>/styles',
        cssDir: '.tmp/styles',
        generatedImagesDir: '.tmp/images/generated',
        imagesDir: '<%= appPath %>/images',
        javascriptsDir: '<%= appPath %>/js',
        fontsDir: '<%= appPath %>/styles/fonts',
        importPath: '<%= appPath %>/bower_components',
        httpImagesPath: '/images',
        httpGeneratedImagesPath: '/images/generated',
        httpFontsPath: '/styles/fonts',
        relativeAssets: false,
        assetCacheBuster: false,
        raw: 'Sass::Script::Number.precision = 10\n'
      },
      dist: {
        options: {
          generatedImagesDir: '<%= distPath %>/images/generated'
        }
      },
      server: {
        options: {
          debugInfo: true
        }
      }
    },

    // Automatically add javascript references to index.html
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

    // Replace servers for script dependencies
    cdnify: {
     options: {
        // Use our own cdn database which is a mix of google and cdnjs and
        // proper support for bootstrap
        cdn: require('./cdn-data')
      },
      dist: {
        html: ['<%= distPath %>/*.html']
      }
    },

    // Copies remaining (non-script) files to places other tasks can use
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
            'js/bookmarklet.js',
            'view/{,*/}*.html',
            'bower_components/bootstrap/dist/*',
            'bower_components/nvd3/*.css',
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

    // Minify html source (makes it easier to copy into wordpress page)
    htmlmin: {
      options: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeCommentsFromCDATA: true,
        removeOptionalTags: true
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= distPath %>',
          src: ['*.html'],
          dest: '<%= distPath %>'
        }]
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [
        'copy:styles'
      ],
      test: [
        'copy:styles'
      ],
      dist: [
        'copy:styles'
      ]
    },

    cssmin: {
      options: {
        banner: '<%= banner %>',
      },
      dist: {
        files: {
          '<%= distPath %>/styles/demokratiappen.css': [
            '.tmp/styles/{,*/}*.css',
            '<%= appPath %>/styles/{,*/}*.css'
          ]
        }
      }
    },

    // Concatenate scripts to a single file
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

    // Minimize the concatenated script for faster loads
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/js/<%= pkg.name %>.min.js'
      },
      bookmarklet: {
        options: {
          banner: 'javascript:'
        },
        src: 'app/js/bookmarklet.js',
        dest: 'dist/js/bookmarklet.min.js'
      },
      scrape: {
        src: 'app/scripts/Scrape.js',
        dest: 'dist/scripts/Scrape.min.js'
      }
    },

    // Javascript style checker
    jshint: {
      options: {
        reporter: require('jshint-stylish'),
        node: true,
        browser: true,
        esnext: true,
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        indent: 2,
        latedef: true,
        newcap: true,
        noarg: true,
        quotmark: 'single',
        regexp: true,
        undef: true,
        unused: true,
        strict: true,
        trailing: true,
        smarttabs: true,
        scripturl: true,
        globals: {
          angular: false,
          define: true,
          Parse: false,
          '_': false,
        }
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= appPath %>/js/{,*/}*.js',
          '!<%= appPath %>/js/bookmarklet.js'
        ]
      }
    },
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'bowerInstall',
      'concurrent:server',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('build', [
    'clean:dist',
    'bowerInstall',
    'concurrent:dist',
    'concat',
    'copy:dist',
    'cdnify',
    'cssmin',
    'uglify',
    'tags',
    'htmlmin'
  ]);

  // Default task.
  grunt.registerTask('default', [
    'newer:jshint',
    'build'
  ]);
};
