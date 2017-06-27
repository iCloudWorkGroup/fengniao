'use strict';
define(function(require) {
	var Backbone = require('lib/backbone');

	function reload() {
		Backbone.trigger('event:reload');
	}
	return reload;
});