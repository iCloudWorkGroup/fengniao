module.exports = function(grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'js/collections/*.js','js/models/*.js'],
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
    grunt.loadTasks('tools/build/tasks'); // 加载build目录下的所有task
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('check', ['jshint']);
    grunt.registerTask('dist',['build']);
<<<<<<< HEAD
    grunt.registerTask('default', ['jshint','build']);
=======
    grunt.registerTask('default', ['jshint']);
>>>>>>> 42f2f7f05b57505fb23562892b154ed1b1c38843
};
