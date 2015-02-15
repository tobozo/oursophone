module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    phonegap:
      config:
        root: 'www'
        cordova: '.cordova'
        name: '<%= pkg.name %>'
        plugins: ['https://github.com/simplec-dev/AndroidMediaGestureSetting.git', 'org.apache.cordova.file-transfer', 'com.cmpsoft.mobile.plugin.download', 'https://github.com/vvelda/device-feedback.git']
        platforms: ['android']
        config:
          template: '_config.xml'
          data:
            id: 'org.oursophone'
            version: '<%= pkg.version %>'
            name: '<%= pkg.name %>'
            description: '<%= pkg.description %>'
            author:
              email: 'gard@assassine.com'
              href: 'http://assassine.org'
              text: 'tobozo'
          minSdkVersion: 19
          targetSdkVersion: 19
        versionCode: 1
        permissions: []
        androidApplicationName: 'org.assassine.oursophone'
        screenOrientation: 'landscape'

    connect:
      options:
        hostname: '192.168.1.15'
        livereload: 35729
        port: 3000
      server:
        options:
          base: 'www'
          open: true

    watch:
      options:
        livereload: '<%= connect.options.livereload %>'
      all:
        files: 'www/{,*/}*.{html,js,css,png}'
      scripts:
        files: ['src/js/*.js', 'src/templates/*.tpl']
        tasks: ['htmlConvert', 'concat', 'uglify']
        options:
          spawn: false
          reload: true

    concat:
      options:
        banner: 'var OursoPhone = OursoPhone || {};'
        separator: ';'
      dist:
        src: ['src/js/*.js', 'tmp/templates.js']
        dest: 'tmp/<%= pkg.name %>.concat.js'

    htmlConvert:
      options:
        prefix: ['OursoPhone.templates = [];//']
        rename: (moduleName) ->
          moduleName.split(/[\\/]/).pop().replace '.tpl', ''
      'TemplateStore.store':
        src: ['src/templates/*.tpl']
        dest: 'tmp/templates.js'

    uglify:
      options:
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      dist:
        files:
          'www/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']



  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-html-to-js'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-phonegap'


  grunt.registerTask 'dist', ->
    grunt.task.run 'htmlConvert'
    grunt.task.run 'concat'
    grunt.task.run 'uglify'
    grunt.task.run 'phonegap:build'

  grunt.registerTask 'server', ->
    grunt.task.run 'htmlConvert'
    grunt.task.run 'concat'
    grunt.task.run 'uglify'
    grunt.task.run 'connect:server'
    grunt.task.run 'watch:scripts'
    grunt.task.run 'watch:all'

