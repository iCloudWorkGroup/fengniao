module.exports = function(grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'js/collections/*.js', 'js/models/*.js', 'js/basic/**/*.js'],
            options: {
                jshintrc: true,
                globals: {
                    jQuery: true
                },
                ignores: ['js/lib/*.js']
            }
        },
        less: {
            production: {
                options: {
                    paths: ['css']
                },
                files: {
                    'css/toolbar.css': 'css/toolbar.less'
                }
            },
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        },
        build: {
            options: {
                banner: '/*! Spreadsheet <%= pkg.version %> */\n'
            },

            all: {
                name: 'spreadsheet/spreadsheet',
                dest: 'dist/fengniao.js',

                // 在没有jquery类似的库的前提下可以设置builtin,去除强行依赖。
                builtin: {
                    dollar: false,
                    promise: false
                }
            }
        },
	bump: {
	    options: {
		updateConfigs: ['pkg'],
		commitFIles:['package.json', 'CHANGELOG.md'],
		commitMessage: 'spreadsheet: release v%VERSION%'
	    }
	},
	conventionalChangelog: {
	    options: {
	      changelogOpts: {
		// conventional-changelog options go here
		preset: 'angular',
		outputUnreleased:true
	      },
	      context: {
		// context goes here
	      },
	      gitRawCommitsOpts: {
		// git-raw-commits options go here
	      },
	      parserOpts: {
		// conventional-commits-parser options go here
	      },
	      writerOpts: {
		// conventional-changelog-writer options go here
	      }
	    },
	    release: {
	      src: 'CHANGELOG.md'
	    }
	}
    });
    require('load-grunt-tasks')(grunt);
    grunt.loadTasks('tools/build/tasks'); // 加载build目录下的所有task
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-conventional-changelog');

    grunt.registerTask('check', ['jshint']);
    grunt.registerTask('dist', ['build']);
    grunt.registerTask('default', ['jshint', 'build']);
    grunt.registerTask('css', ['less']);
    grunt.registerTask('release','build new version info',function(type){
	grunt.task.run([
	    'bump:' + (type || 'patch') + ':bump-only',
	    'conventionalChangelog',
	    'bump-commit'
	]);
    });
};
