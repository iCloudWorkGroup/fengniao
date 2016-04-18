define(function(require) {
	'use strict';

	var Backbone = require('lib/backbone'),
		adaptScreen;
	adaptScreen = function(sheetId) {
		Backbone.trigger('call:screenContainer:adaptScreen');
	};
	return adaptScreen;
});