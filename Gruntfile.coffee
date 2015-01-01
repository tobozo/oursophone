module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    phonegap:
      config:
        plugins: ['https://github.com/simplec-dev/AndroidMediaGestureSetting.git']
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

  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-phonegap'

  grunt.registerTask 'server', ->
    grunt.task.run 'connect:server'
    grunt.task.run 'watch:all'
