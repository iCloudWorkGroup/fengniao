module.exports = function(config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '',


        // frameworks to use
        frameworks: ['jasmine', 'requirejs'],


        // list of files / patterns to load in the browser
        files: [{
                pattern: 'js/**/*.js',
                included: false
            }, {
                pattern: 'test/**/*.spec.js',
                included: false
            }, {
                pattern: 'test/util/build.js',
                included: false
            },
            'test/karma-main.js'
        ],


        // list of files to exclude
        exclude: ['js/app.js', 'test/main.js'],

        coverageReporter: {
            type: 'lcov',
            dir: 'coverage/'
        },
	plugins: [
	    'karma-coverage',
	    'karma-jasmine',
	    'karma-requirejs',
	    'karma-chrome-launcher'
	],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['coverage'],

        preprocessors: {
            'js/entrance/tool/addrow.js': 'coverage',
            'js/entrance/tool/deleterow.js': 'coverage',
            'js/entrance/row/rowoperation.js': 'coverage',

        },

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: ['Chrome'],


        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};
