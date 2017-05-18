'use strict';
define(function(require) {
	var Backbone = require('lib/backbone'),
		config = require('spreadsheet/config'),
		selectRegions = require('collections/selectRegion'),

		operation;

	operation = {
		setDataSourceRegion: function() {
			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState' , 'dataSourceLocatedState');
		},
		setSelectRegion: function() {
			Backbone.trigger('event:cellsContainer:setMouseState', 'locatedState' , 'selectLocatedState');
		},
		destroyDataSoureRegion: function() {
			if (selectRegions.getModelByType('datasource') !== undefined) {
				selectRegions.getModelByType('datasource').destroy();
			}
		}
	};
	return operation;
});