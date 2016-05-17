module.exports = function(grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'js/models/*.js'],
            options: {
                jshintrc: true,
                globals: {
                    jQuery: true
                },
                ignores: ['js/lib/*.js']
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        },
        build: {
            options: {
                banner: '/*! WebUploader <%= pkg.version %> */\n'
            },

            all: {
                name: 'app',
                dest: 'dist/my.js',

                // 在没有jquery类似的库的前提下可以设置builtin,去除强行依赖。
                builtin: {
                    dollar: false,
                    promise: false
                }
            }
        }
    });
    require('load-grunt-tasks')(grunt);
    grunt.loadTasks('build/tasks'); // 加载build目录下的所有task
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('check', ['jshint']);
    grunt.registerTask('build',['build']);
    grunt.registerTask('default', ['jshint']);
};