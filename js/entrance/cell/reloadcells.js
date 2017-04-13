'use strict';
define(function(require) {
	var Backbone = require('lib/backbone');

	function reloadCells() {
		Backbone.trigger('event:contentCellsContainer:reloadCells');
		Backbone.trigger('event:selectRegionContainer:adapt');
	}
	return reloadCells;
});