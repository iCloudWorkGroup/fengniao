'use strict';
define(function(require) {


	var Backbone = require('lib/backbone'),
		headItemCols = require('collections/headItemCol'),
		cache = require('basic/tools/cache');


	var setCellWidth = function(sheetId, colLable, width) {
		var index;
		if (cache.TempProp.isFrozen === true) {
			return;
		}
		index = headItemCols.getIndexByDisplayname(colLable);
		if (index > -1) {
			Backbone.trigger('event:colWidthAdjust', index, width);
		}
	};
	return setCellWidth;
});