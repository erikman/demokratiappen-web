/*global module:false*/
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= pkg.license %> */\n',
    // Task configuration.
    tags: {
      dist: {
        options: {
          scriptTemplate: '<script type="text/javascript" src="{{ path }}"></script>',
          openTag: '<!-- start script template tags -->',
          closeTag: '<!-- end script template tags -->'
        },
        src: [
          'dist/js/demokratiappen.min.js'
        ],
        dest: 'dist/index.html'
      },
      development: {
        options: {
          scriptTemplate: '<script type="text/javascript" src="{{ path }}"></script>',
          openTag: '<!-- start script template tags -->',
          closeTag: '<!-- end script template tags -->'
        },
        src: [
          'app/js/*.js',
          '!app/js/bookmarklet.js'
        ],
        dest: 'app/index.html'
      }
    },
    copy: {
      dist: {
        cwd: 'app',
        src: ['**', '!js/*'],
        dest: 'dist',
        expand: true
      }
    },
    clean: {
      dist: {
        src: ['dist']
      },
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: [
          'app/js/**/*.js',
          '!app/js/bookmarklet.js'
        ],
        dest: 'dist/js/<%= pkg.name %>.js'
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
    watch: {
      copy: {
        files: [
          'app/**/*',
          '!app/js/*',
          '!app/scripts/*'
        ],
        tasks: ['copy']
      },
      concat: {
        files: [
          'app/js/**/*.js',
          '!app/js/bookmarklet.js'
        ],
        tasks: ['concat']
      },
      uglify: {
        files: [
          'dist/js/**/*.js',
          '!dist/js/**/*.min.js'
        ],
        tasks: ['uglify']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-script-link-tags');

  // Default task.
  grunt.registerTask('default', [
    'clean',
    'copy',
    'concat',
    'uglify',
    'tags'
  ]);

};
